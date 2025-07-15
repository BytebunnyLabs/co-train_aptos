import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  TrainingOption,
  TrainingSession,
  TrainingHistory,
  TrainingMetrics
} from '../types/cotrain'
import { smartApi } from '../services/api'
import { handleError } from '../utils/error-handler'

// Re-export types for external use
export type { TrainingOption, TrainingMetrics } from '../types/cotrain'

// WebAssembly Module Type
export interface WasmModule {
  memory: WebAssembly.Memory
  exports: Record<string, any>
  instance: WebAssembly.Instance
}

// Training Store State Interface
export interface TrainingState {
  // Training Options
  options: TrainingOption[]
  selectedOption: TrainingOption | null
  
  // Active Sessions
  sessions: TrainingSession[]
  currentSession: TrainingSession | null
  activeSession: string | null
  
  // Training History
  history: TrainingHistory[]
  
  // Real-time Metrics
  metrics: TrainingMetrics | null
  
  // Training Progress by Session ID
  trainingProgress: Record<string, number>
  
  // UI State
  loading: {
    options: boolean
    sessions: boolean
    history: boolean
    joining: boolean
  }
  error: string | null
  
  // WebAssembly Integration State
  wasmModule: any | null
  wasmLoaded: boolean
  wasmError: string | null
}

// Training Store Actions Interface
export interface TrainingActions {
  // Training Options
  loadTrainingOptions: () => Promise<void>
  selectTrainingOption: (option: TrainingOption) => void
  clearSelectedOption: () => void
  
  // Session Management
  joinTraining: (optionId: string) => Promise<void>
  pauseTraining: (sessionId: string) => Promise<void>
  resumeTraining: (sessionId: string) => Promise<void>
  stopTraining: (sessionId: string) => Promise<void>
  
  // Session Data
  loadActiveSessions: () => Promise<void>
  loadTrainingHistory: () => Promise<void>
  updateSessionProgress: (sessionId: string, progress: number) => void
  updateSessionMetrics: (sessionId: string, metrics: Partial<TrainingMetrics>) => void
  
  // Real-time Updates
  setCurrentSession: (session: TrainingSession | null) => void
  setActiveSession: (sessionId: string | null) => void
  updateMetrics: (metrics: TrainingMetrics) => void
  updateProgress: (sessionId: string, progress: number) => void
  
  // WebAssembly Integration
  loadWasmModule: () => Promise<void>
  initializeWasm: () => Promise<void>
  executeWasmTraining: (data: any) => Promise<any>
  
  // Utility Actions
  clearError: () => void
  reset: () => void
}

export type TrainingStore = TrainingState & TrainingActions

// Initial State
const initialState: TrainingState = {
  options: [],
  selectedOption: null,
  sessions: [],
  currentSession: null,
  activeSession: null,
  history: [],
  metrics: null,
  trainingProgress: {},
  loading: {
    options: false,
    sessions: false,
    history: false,
    joining: false
  },
  error: null,
  wasmModule: null,
  wasmLoaded: false,
  wasmError: null
}

// Training Store Implementation
export const useTrainingStore = create<TrainingStore>()(devtools(
  persist(
    immer(
        (set, get) => ({
          ...initialState,

          // Training Options
          loadTrainingOptions: async () => {
            set((state) => {
              state.loading.options = true
              state.error = null
            })
            
            try {
              const response = await smartApi.getTrainingOptions()
              if (response.success && response.data) {
                set((state) => {
                  state.options = response.data!
                  state.loading.options = false
                })
              } else {
                throw new Error(response.error || 'Failed to load training options')
              }
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.options = false
              })
            }
          },

          selectTrainingOption: (option) => {
            set((state) => {
              state.selectedOption = option
            })
          },

          clearSelectedOption: () => {
            set((state) => {
              state.selectedOption = null
            })
          },

          // Session Management
          joinTraining: async (optionId) => {
            set((state) => {
              state.loading.joining = true
              state.error = null
            })
            
            try {
              // Initialize WebAssembly if not loaded
              if (!get().wasmLoaded) {
                await get().loadWasmModule()
              }
              
              // Create new training session
              const mockSession: TrainingSession = {
                id: `session-${Date.now()}`,
                trainingOptionId: optionId,
                userId: '1', // TODO: Get from user store
                startTime: new Date().toISOString(),
                status: 'active',
                progress: 0,
                computeContributed: 0,
                tokensEarned: 0,
                reputationEarned: 0,
                metrics: {
                  throughput: 0,
                  efficiency: 0,
                  uptime: 100,
                  errorRate: 0
                }
              }
              
              set((state) => {
                state.sessions.push(mockSession)
                state.currentSession = mockSession
                state.loading.joining = false
              })
              
              // Start WebAssembly training process
              await get().executeWasmTraining({ sessionId: mockSession.id })
              
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.joining = false
              })
            }
          },

          pauseTraining: async (sessionId) => {
            try {
              set((state) => {
                const session = state.sessions.find((s: any) => s.id === sessionId)
                if (session) {
                  session.status = 'paused'
                }
                if (state.currentSession?.id === sessionId) {
                  state.currentSession.status = 'paused'
                }
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
              })
            }
          },

          resumeTraining: async (sessionId) => {
            try {
              set((state) => {
                const session = state.sessions.find((s: any) => s.id === sessionId)
                if (session) {
                  session.status = 'active'
                }
                if (state.currentSession?.id === sessionId) {
                  state.currentSession.status = 'active'
                }
              })
              
              // Resume WebAssembly training
              await get().executeWasmTraining({ sessionId, resume: true })
              
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
              })
            }
          },

          stopTraining: async (sessionId) => {
            try {
              set((state) => {
                const session = state.sessions.find((s: any) => s.id === sessionId)
                if (session) {
                  session.status = 'completed'
                  session.endTime = new Date().toISOString()
                }
                if (state.currentSession?.id === sessionId) {
                  state.currentSession = null
                }
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
              })
            }
          },

          // Session Data
          loadActiveSessions: async () => {
            set((state) => {
              state.loading.sessions = true
              state.error = null
            })
            
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              set((state) => {
                state.loading.sessions = false
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.sessions = false
              })
            }
          },

          loadTrainingHistory: async () => {
            set((state) => {
              state.loading.history = true
              state.error = null
            })
            
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              set((state) => {
                state.loading.history = false
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.error = handledError.message
                state.loading.history = false
              })
            }
          },

          updateSessionProgress: (sessionId, progress) => {
            set((state) => {
              const session = state.sessions.find((s: any) => s.id === sessionId)
              if (session) {
                session.progress = progress
              }
              if (state.currentSession?.id === sessionId) {
                state.currentSession.progress = progress
              }
            })
          },

          updateSessionMetrics: (sessionId, metrics) => {
            set((state) => {
              const session = state.sessions.find((s: any) => s.id === sessionId)
              if (session) {
                session.metrics = { ...session.metrics, ...metrics }
              }
              if (state.currentSession?.id === sessionId) {
                state.currentSession.metrics = { ...state.currentSession.metrics, ...metrics }
              }
            })
          },

          // Real-time Updates
          setCurrentSession: (session) => {
            set((state) => {
              state.currentSession = session
            })
          },

          setActiveSession: (sessionId) => {
            set((state) => {
              state.activeSession = sessionId
            })
          },

          updateMetrics: (metrics) => {
            set((state) => {
              state.metrics = metrics
            })
          },

          updateProgress: (sessionId, progress) => {
            set((state) => {
              state.trainingProgress[sessionId] = progress
            })
          },

          // WebAssembly Integration
          loadWasmModule: async () => {
            try {
              set((state) => {
                state.wasmError = null
              })
              
              // Load WebAssembly module for terminal optimization
              const wasmModule = await import('../wasm/training-module')
              await wasmModule.default()
              
              set((state) => {
                state.wasmModule = wasmModule
                state.wasmLoaded = true
              })
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmError = handledError.message
                state.wasmLoaded = false
              })
            }
          },

          initializeWasm: async () => {
            const { wasmModule } = get()
            if (!wasmModule) {
              await get().loadWasmModule()
            }
            
            try {
              // Initialize WASM training environment
              await wasmModule.initialize()
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmError = handledError.message
              })
            }
          },

          executeWasmTraining: async (data) => {
            const { wasmModule } = get()
            if (!wasmModule) {
              throw new Error('WebAssembly module not loaded')
            }
            
            try {
              // Execute training computation in WebAssembly
              const result = await wasmModule.executeTraining(data)
              return result
            } catch (error) {
              const handledError = handleError(error)
              set((state) => {
                state.wasmError = handledError.message
              })
              throw error
            }
          },

          // Utility Actions
          clearError: () => {
            set((state) => {
              state.error = null
              state.wasmError = null
            })
          },

          reset: () => {
            set((state) => {
              Object.assign(state, initialState)
            })
          }
        })
    ),
    {
      name: 'training-store',
      partialize: (state: TrainingStore) => ({
        selectedOption: state.selectedOption,
        sessions: state.sessions,
        history: state.history
      })
    }
  )
));

// Selectors for optimized re-renders
export const useTrainingOptions = () => useTrainingStore(state => state.options)
export const useCurrentSession = () => useTrainingStore(state => state.currentSession)
export const useTrainingMetrics = () => useTrainingStore(state => state.metrics)
export const useTrainingLoading = () => useTrainingStore(state => state.loading)
export const useWasmStatus = () => useTrainingStore(state => ({ 
  loaded: state.wasmLoaded, 
  error: state.wasmError 
}))