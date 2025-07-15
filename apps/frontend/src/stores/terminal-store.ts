import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  SystemLog,
  Contributor,
  NetworkStats,
  TrainingSession
} from '../types/cotrain'
import { handleError } from '../utils/error-handler'

// Terminal Command Types
export interface TerminalCommand {
  id: string
  command: string
  output: string
  timestamp: string
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number
}

// Terminal Session Types
export interface TerminalSession {
  id: string
  startTime: string
  endTime?: string
  commands: TerminalCommand[]
  isActive: boolean
}

// WebAssembly Performance Metrics
export interface WasmPerformanceMetrics {
  executionTime: number
  memoryUsage: number
  cpuUsage: number
  throughput: number
  optimizationLevel: number
}

// Terminal Store State Interface
export interface TerminalState {
  // Terminal Sessions
  sessions: TerminalSession[]
  currentSession: TerminalSession | null
  
  // Command History
  commandHistory: TerminalCommand[]
  currentCommand: string
  commandIndex: number
  
  // System Logs
  logs: SystemLog[]
  filteredLogs: SystemLog[]
  logFilter: {
    type: string[]
    category: string[]
    search: string
  }
  
  // Contributors & Network
  contributors: Contributor[]
  networkStats: NetworkStats
  
  // Real-time Data
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastUpdate: string | null
  
  // WebAssembly Terminal Optimization
  wasmTerminal: {
    module: any | null
    loaded: boolean
    error: string | null
    performance: WasmPerformanceMetrics | null
    optimizationEnabled: boolean
  }
  
  // Terminal UI State
  ui: {
    fontSize: number
    theme: 'dark' | 'light' | 'matrix' | 'retro'
    showTimestamps: boolean
    showLineNumbers: boolean
    autoScroll: boolean
    splitView: boolean
    fullscreen: boolean
  }
  
  // Loading States
  loading: {
    logs: boolean
    contributors: boolean
    stats: boolean
    commands: boolean
  }
  
  error: string | null
}

// Terminal Store Actions Interface
interface TerminalActions {
  // Session Management
  createSession: () => string
  switchSession: (sessionId: string) => void
  closeSession: (sessionId: string) => void
  clearCurrentSession: () => void
  
  // Command Execution
  executeCommand: (command: string) => Promise<void>
  addCommand: (command: TerminalCommand) => void
  updateCommandOutput: (commandId: string, output: string, status?: TerminalCommand['status']) => void
  clearCommandHistory: () => void
  
  // Command Navigation
  setCurrentCommand: (command: string) => void
  navigateHistory: (direction: 'up' | 'down') => void
  
  // System Logs
  loadLogs: () => Promise<void>
  addLog: (log: Omit<SystemLog, 'timestamp'>) => void
  clearLogs: () => void
  filterLogs: (filter: Partial<TerminalState['logFilter']>) => void
  
  // Contributors & Network
  loadContributors: () => Promise<void>
  loadNetworkStats: () => Promise<void>
  updateContributorStatus: (contributorId: number, status: Contributor['status']) => void
  
  // Real-time Connection
  connect: () => Promise<void>
  disconnect: () => void
  updateConnectionStatus: (status: TerminalState['connectionStatus']) => void
  handleRealtimeUpdate: (data: any) => void
  
  // WebAssembly Terminal Optimization
  loadWasmTerminal: () => Promise<void>
  initializeWasmTerminal: () => Promise<void>
  executeWasmCommand: (command: string) => Promise<string>
  toggleWasmOptimization: () => void
  updateWasmPerformance: (metrics: WasmPerformanceMetrics) => void
  
  // Terminal UI
  updateUISettings: (settings: Partial<TerminalState['ui']>) => void
  toggleFullscreen: () => void
  resetUISettings: () => void
  
  // Utility Actions
  clearError: () => void
  reset: () => void
}

export type TerminalStore = TerminalState & TerminalActions

// Initial State
const initialState: TerminalState = {
  sessions: [],
  currentSession: null,
  commandHistory: [],
  currentCommand: '',
  commandIndex: -1,
  logs: [],
  filteredLogs: [],
  logFilter: {
    type: [],
    category: [],
    search: ''
  },
  contributors: [],
  networkStats: {
    totalNodes: 0,
    activeNodes: 0,
    totalComputeHours: 0,
    modelsTraining: 0,
    totalContributors: 0,
    networkHealth: 0
  },
  isConnected: false,
  connectionStatus: 'disconnected',
  lastUpdate: null,
  wasmTerminal: {
    module: null,
    loaded: false,
    error: null,
    performance: null,
    optimizationEnabled: true
  },
  ui: {
    fontSize: 14,
    theme: 'dark',
    showTimestamps: true,
    showLineNumbers: false,
    autoScroll: true,
    splitView: false,
    fullscreen: false
  },
  loading: {
    logs: false,
    contributors: false,
    stats: false,
    commands: false
  },
  error: null
}

// Terminal Store Implementation
export const useTerminalStore = create<TerminalStore>()(devtools(
  persist(
    immer(
        (set, get) => ({
          ...initialState,

          // Session Management
          createSession: () => {
            const sessionId = `session-${Date.now()}`
            const newSession: TerminalSession = {
              id: sessionId,
              startTime: new Date().toISOString(),
              commands: [],
              isActive: true
            }
            
            set((state) => {
              // Deactivate current session
              if (state.currentSession) {
                const currentIndex = state.sessions.findIndex((s: any) => s.id === state.currentSession!.id)
                if (currentIndex !== -1) {
                  state.sessions[currentIndex].isActive = false
                }
              }
              
              state.sessions.push(newSession)
              state.currentSession = newSession
            })
            
            return sessionId
          },

          switchSession: (sessionId) => {
            set((state) => {
              const session = state.sessions.find((s: any) => s.id === sessionId)
              if (session) {
                // Deactivate current session
                if (state.currentSession) {
                  const currentIndex = state.sessions.findIndex((s: any) => s.id === state.currentSession!.id)
                  if (currentIndex !== -1) {
                    state.sessions[currentIndex].isActive = false
                  }
                }
                
                session.isActive = true
                state.currentSession = session
              }
            })
          },

          closeSession: (sessionId) => {
            set((state) => {
              const sessionIndex = state.sessions.findIndex((s: any) => s.id === sessionId)
              if (sessionIndex !== -1) {
                state.sessions[sessionIndex].endTime = new Date().toISOString()
                state.sessions[sessionIndex].isActive = false
                
                if (state.currentSession?.id === sessionId) {
                  // Switch to another active session or create new one
                  const activeSession = state.sessions.find((s: any) => s.isActive && s.id !== sessionId)
                  state.currentSession = activeSession || null
                }
              }
            })
          },

          clearCurrentSession: () => {
            set((state) => {
              if (state.currentSession) {
                state.currentSession.commands = []
              }
            })
          },

          // Command Execution
          executeCommand: async (command) => {
            const commandId = `cmd-${Date.now()}`
            const newCommand: TerminalCommand = {
              id: commandId,
              command,
              output: '',
              timestamp: new Date().toISOString(),
              status: 'pending'
            }
            
            set((state) => {
              state.loading.commands = true
              state.commandHistory.push(newCommand)
              state.commandIndex = -1
              state.currentCommand = ''
              
              if (state.currentSession) {
                state.currentSession.commands.push(newCommand)
              }
            })
            
            try {
              // Update status to running
              get().updateCommandOutput(commandId, '', 'running')
              
              let output: string
              const startTime = Date.now()
              
              // Use WebAssembly optimization if enabled
              if (get().wasmTerminal.optimizationEnabled && get().wasmTerminal.loaded) {
                output = await get().executeWasmCommand(command)
              } else {
                // Simulate command execution
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
                output = `Executed: ${command}\nResult: Success\nTimestamp: ${new Date().toISOString()}`
              }
              
              const duration = Date.now() - startTime
              
              set((state) => {
                const cmd = state.commandHistory.find((c: any) => c.id === commandId)
                if (cmd) {
                  cmd.output = output
                  cmd.status = 'completed'
                  cmd.duration = duration
                }
                
                if (state.currentSession) {
                  const sessionCmd = state.currentSession.commands.find((c: any) => c.id === commandId)
                  if (sessionCmd) {
                    sessionCmd.output = output
                    sessionCmd.status = 'completed'
                    sessionCmd.duration = duration
                  }
                }
                
                state.loading.commands = false
              })
              
            } catch (error) {
              const handledError = handleError(error)
              get().updateCommandOutput(commandId, `Error: ${handledError.message}`, 'error')
              
              set((state) => {
                state.error = handledError.message
                state.loading.commands = false
              })
            }
          },

          addCommand: (command) => {
            set((state) => {
              state.commandHistory.push(command)
              if (state.currentSession) {
                state.currentSession.commands.push(command)
              }
            })
          },

          updateCommandOutput: (commandId, output, status) => {
            set((state) => {
              const cmd = state.commandHistory.find((c: any) => c.id === commandId)
              if (cmd) {
                cmd.output = output
                if (status) cmd.status = status
              }
              
              if (state.currentSession) {
                const sessionCmd = state.currentSession.commands.find((c: any) => c.id === commandId)
                if (sessionCmd) {
                  sessionCmd.output = output
                  if (status) sessionCmd.status = status
                }
              }
            })
          },

          clearCommandHistory: () => {
            set((state) => {
              state.commandHistory = []
              state.commandIndex = -1
            })
          },

          // Command Navigation
          setCurrentCommand: (command) => {
            set((state) => {
              state.currentCommand = command
            })
          },

          navigateHistory: (direction) => {
            set((state) => {
              const history = state.commandHistory.filter((cmd: any) => cmd.status === 'completed')
              if (history.length === 0) return
              
              if (direction === 'up') {
                if (state.commandIndex < history.length - 1) {
                  state.commandIndex++
                  state.currentCommand = history[history.length - 1 - state.commandIndex].command
                }
              } else {
                if (state.commandIndex > 0) {
                  state.commandIndex--
                  state.currentCommand = history[history.length - 1 - state.commandIndex].command
                } else if (state.commandIndex === 0) {
                  state.commandIndex = -1
                  state.currentCommand = ''
                }
              }
            })
          },

          // System Logs
          loadLogs: async () => {
            set((state) => {
              state.loading.logs = true
              state.error = null
            })
            
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Mock logs
              const mockLogs: SystemLog[] = [
                {
                  timestamp: new Date().toISOString(),
                  message: 'System initialized successfully',
                  type: 'SUCCESS',
                  category: 'SYSTEM'
                },
                {
                  timestamp: new Date().toISOString(),
                  message: 'Network connection established',
                  type: 'INFO',
                  category: 'NETWORK'
                }
              ]
              
              set((state) => {
                state.logs = mockLogs
                state.filteredLogs = mockLogs
                state.loading.logs = false
              })
              
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.logs = false
              })
            }
          },

          addLog: (log) => {
            const newLog: SystemLog = {
              ...log,
              timestamp: new Date().toISOString()
            }
            
            set((state) => {
              state.logs.unshift(newLog)
              // Keep only last 1000 logs
              if (state.logs.length > 1000) {
                state.logs = state.logs.slice(0, 1000)
              }
              
              // Apply current filter
              get().filterLogs({})
            })
          },

          clearLogs: () => {
            set((state) => {
              state.logs = []
              state.filteredLogs = []
            })
          },

          filterLogs: (filter) => {
            set((state) => {
              // Update filter
              state.logFilter = { ...state.logFilter, ...filter }
              
              // Apply filter
              let filtered = state.logs
              
              if (state.logFilter.type.length > 0) {
                filtered = filtered.filter((log: any) => state.logFilter.type.includes(log.type))
              }
              
              if (state.logFilter.category.length > 0) {
                filtered = filtered.filter((log: any) => 
                  log.category && state.logFilter.category.includes(log.category)
                )
              }
              
              if (state.logFilter.search) {
                const search = state.logFilter.search.toLowerCase()
                filtered = filtered.filter((log: any) => 
                  log.message.toLowerCase().includes(search)
                )
              }
              
              state.filteredLogs = filtered
            })
          },

          // Contributors & Network
          loadContributors: async () => {
            set((state) => {
              state.loading.contributors = true
              state.error = null
            })
            
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              set((state) => {
                state.loading.contributors = false
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.contributors = false
              })
            }
          },

          loadNetworkStats: async () => {
            set((state) => {
              state.loading.stats = true
              state.error = null
            })
            
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              set((state) => {
                state.loading.stats = false
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.stats = false
              })
            }
          },

          updateContributorStatus: (contributorId, status) => {
            set((state) => {
              const contributor = state.contributors.find((c: any) => c.id === contributorId)
              if (contributor) {
                contributor.status = status
              }
            })
          },

          // Real-time Connection
          connect: async () => {
            try {
              set((state) => {
                state.connectionStatus = 'connecting'
              })
              
              // Simulate connection
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              set((state) => {
                state.isConnected = true
                state.connectionStatus = 'connected'
                state.lastUpdate = new Date().toISOString()
              })
              
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.connectionStatus = 'error'
                state.error = handledError.message
              })
            }
          },

          disconnect: () => {
            set((state) => {
              state.isConnected = false
              state.connectionStatus = 'disconnected'
            })
          },

          updateConnectionStatus: (status) => {
            set((state) => {
              state.connectionStatus = status
              if (status === 'connected') {
                state.isConnected = true
                state.lastUpdate = new Date().toISOString()
              } else {
                state.isConnected = false
              }
            })
          },

          handleRealtimeUpdate: (data) => {
            set((state) => {
              state.lastUpdate = new Date().toISOString()
              
              // Handle different types of real-time updates
              if (data.type === 'contributor_status') {
                get().updateContributorStatus(data.contributorId, data.status)
              } else if (data.type === 'system_log') {
                get().addLog(data.log)
              } else if (data.type === 'network_stats') {
                state.networkStats = { ...state.networkStats, ...data.stats }
              }
            })
          },

          // WebAssembly Terminal Optimization
          loadWasmTerminal: async () => {
            try {
              set((state) => {
                state.wasmTerminal.error = null
              })
              
              // Load WebAssembly terminal module
              const wasmModule = await import('../wasm/terminal-module')
              await wasmModule.default()
              
              set((state) => {
                state.wasmTerminal.module = wasmModule
                state.wasmTerminal.loaded = true
              })
              
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmTerminal.error = handledError.message
                state.wasmTerminal.loaded = false
              })
            }
          },

          initializeWasmTerminal: async () => {
            const { wasmTerminal } = get()
            if (!wasmTerminal.module) {
              await get().loadWasmTerminal()
            }
            
            try {
              await wasmTerminal.module.initialize()
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmTerminal.error = handledError.message
              })
            }
          },

          executeWasmCommand: async (command) => {
            const { wasmTerminal } = get()
            if (!wasmTerminal.module) {
              throw new Error('WebAssembly terminal module not loaded')
            }
            
            try {
              const startTime = performance.now()
              const result = await wasmTerminal.module.executeCommand(command)
              const endTime = performance.now()
              
              // Update performance metrics
              const metrics: WasmPerformanceMetrics = {
                executionTime: endTime - startTime,
                memoryUsage: wasmTerminal.module.getMemoryUsage(),
                cpuUsage: wasmTerminal.module.getCpuUsage(),
                throughput: result.length / (endTime - startTime),
                optimizationLevel: wasmTerminal.module.getOptimizationLevel()
              }
              
              get().updateWasmPerformance(metrics)
              
              return result
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmTerminal.error = handledError.message
              })
              throw error
            }
          },

          toggleWasmOptimization: () => {
            set((state) => {
              state.wasmTerminal.optimizationEnabled = !state.wasmTerminal.optimizationEnabled
            })
          },

          updateWasmPerformance: (metrics) => {
            set((state) => {
              state.wasmTerminal.performance = metrics
            })
          },

          // Terminal UI
          updateUISettings: (settings) => {
            set((state) => {
              state.ui = { ...state.ui, ...settings }
            })
          },

          toggleFullscreen: () => {
            set((state) => {
              state.ui.fullscreen = !state.ui.fullscreen
            })
          },

          resetUISettings: () => {
            set((state) => {
              state.ui = initialState.ui
            })
          },

          // Utility Actions
          clearError: () => {
            set((state) => {
              state.error = null
              state.wasmTerminal.error = null
            })
          },

          reset: () => {
            set((state) => {
              Object.assign(state, initialState)
            })
          },
        })
    ),
    {
      name: 'terminal-store',
      partialize: (state: TerminalStore) => ({
        ui: state.ui,
        logFilter: state.logFilter,
        wasmTerminal: {
          optimizationEnabled: state.wasmTerminal.optimizationEnabled
        }
      })
    }
  )
));

// Selectors for optimized re-renders
export const useTerminalSession = () => useTerminalStore(state => state.currentSession)
export const useTerminalCommands = () => useTerminalStore(state => state.commandHistory)
export const useTerminalLogs = () => useTerminalStore(state => state.filteredLogs)
export const useTerminalConnection = () => useTerminalStore(state => ({
  isConnected: state.isConnected,
  status: state.connectionStatus,
  lastUpdate: state.lastUpdate
}))
export const useWasmTerminal = () => useTerminalStore(state => state.wasmTerminal)
export const useTerminalUI = () => useTerminalStore(state => state.ui)
export const useTerminalLoading = () => useTerminalStore(state => state.loading)