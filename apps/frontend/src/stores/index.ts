// New State Management Architecture
// Zustand + React Query based stores

// Store Exports
export * from './training-store'
export * from './terminal-store'
export * from './blockchain-store'
export * from './ui-store'

// Query Client and utilities
export { queryClient, QueryProvider, queryKeys, queryUtils, QueryErrorBoundary } from './query-client'

// Combined Store Hook for convenience
import { useTrainingStore } from './training-store'
import { useTerminalStore } from './terminal-store'
import { useBlockchainStore } from './blockchain-store'
import { useUIStore } from './ui-store'

// Combined store interface for type safety
export interface AppStores {
  training: ReturnType<typeof useTrainingStore>
  terminal: ReturnType<typeof useTerminalStore>
  blockchain: ReturnType<typeof useBlockchainStore>
  ui: ReturnType<typeof useUIStore>
}

// Hook to get all stores at once (use sparingly to avoid unnecessary re-renders)
export const useAppStores = (): AppStores => {
  const training = useTrainingStore()
  const terminal = useTerminalStore()
  const blockchain = useBlockchainStore()
  const ui = useUIStore()

  return {
    training,
    terminal,
    blockchain,
    ui
  }
}

// Store initialization function
export const initializeStores = async () => {
  try {
    // Initialize UI store with system preferences
    const ui = useUIStore.getState()
    
    // Detect system theme preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      if (ui.theme.mode === 'system') {
        // Apply system preferences
        if (prefersReducedMotion) {
          ui.toggleReducedMotion()
        }
      }
      
      // Set initial screen size
      ui.updateScreenSize(window.innerWidth, window.innerHeight)
      
      // Listen for screen size changes
      const handleResize = () => {
        ui.updateScreenSize(window.innerWidth, window.innerHeight)
      }
      
      window.addEventListener('resize', handleResize)
      
      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleThemeChange = (e: MediaQueryListEvent) => {
        if (ui.theme.mode === 'system') {
          // Theme will be handled by CSS or theme provider
        }
      }
      
      mediaQuery.addEventListener('change', handleThemeChange)
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize)
        mediaQuery.removeEventListener('change', handleThemeChange)
      }
    }
    
    // Initialize terminal store
    const terminal = useTerminalStore.getState()
    await terminal.loadWasmTerminal()
    
    // Initialize blockchain store network info
    const blockchain = useBlockchainStore.getState()
    await blockchain.loadNetworkInfo()
    
    // Initialize training store
    const training = useTrainingStore.getState()
    await training.loadTrainingOptions()
    
    console.log('✅ All stores initialized successfully')
    
  } catch (error) {
    console.error('❌ Failed to initialize stores:', error)
    
    // Add error notification
    const ui = useUIStore.getState()
    ui.addNotification({
      type: 'error',
      title: 'Initialization Error',
      message: 'Failed to initialize application stores. Some features may not work correctly.',
      persistent: true
    })
  }
}

// Store reset function for testing or logout
export const resetAllStores = () => {
  useTrainingStore.getState().reset()
  useTerminalStore.getState().reset()
  useBlockchainStore.getState().reset()
  useUIStore.getState().reset()
  
  console.log('🔄 All stores reset')
}

// Store persistence utilities
export const clearStorePersistence = () => {
  if (typeof window !== 'undefined') {
    // Clear Zustand persisted data
    localStorage.removeItem('training-store')
    localStorage.removeItem('terminal-store')
    localStorage.removeItem('blockchain-store')
    localStorage.removeItem('ui-store')
    
    console.log('🗑️ Store persistence cleared')
  }
}

// Development utilities
export const getStoreStates = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      training: useTrainingStore.getState(),
      terminal: useTerminalStore.getState(),
      blockchain: useBlockchainStore.getState(),
      ui: useUIStore.getState()
    }
  }
  
  console.warn('getStoreStates is only available in development mode')
  return null
}

// Store subscription utilities for debugging
export const subscribeToStoreChanges = () => {
  if (process.env.NODE_ENV === 'development') {
    const unsubscribers = [
      useTrainingStore.subscribe(
        (state) => console.log('🏃 Training store updated:', state)
      ),
      useTerminalStore.subscribe(
        (state) => console.log('💻 Terminal store updated:', state)
      ),
      useBlockchainStore.subscribe(
        (state) => console.log('⛓️ Blockchain store updated:', state)
      ),
      useUIStore.subscribe(
        (state) => console.log('🎨 UI store updated:', state)
      )
    ]
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
      console.log('🔇 Store subscriptions cleaned up')
    }
  }
  
  return () => {}
}

// Type exports for external use
export type {
  TrainingStore,
  TrainingMetrics,
  TrainingOption,
  WasmModule
} from './training-store'

export type {
  SystemLog,
  Contributor,
  NetworkStats,
  TrainingSession
} from '../types/cotrain'

export type {
  TerminalStore,
  TerminalSession,
  TerminalCommand,
  TerminalState,
  WasmPerformanceMetrics
} from './terminal-store'

export type {
  BlockchainStore,
  WalletInfo,
  Transaction,
  SmartContract,
  TrainingContract
} from './blockchain-store'

export {
  useTrainingContract
} from './blockchain-store'

export type {
  UIStore,
  ThemeConfig,
  LayoutConfig,
  Notification,
  Modal,
  Command
} from './ui-store'