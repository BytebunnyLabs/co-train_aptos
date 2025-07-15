import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import React from 'react'
import { handleError } from '../utils/error-handler'
import { useUIStore } from './ui-store'

// Query Client Configuration
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry configuration
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (disabled by default)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (disabled by default)
      refetchInterval: false as false,
      // Network mode
      networkMode: 'online' as const
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay
      retryDelay: 1000,
      // Network mode
      networkMode: 'online' as const,
      // Global mutation error handler
      onError: (error: any) => {
        const handledError = handleError(error)
        const ui = useUIStore.getState()
        
        ui.addNotification({
          type: 'error',
          title: 'Operation Failed',
          message: handledError.message,
          duration: 5000
        })
      }
    }
  }
}

// Create Query Client
export const queryClient = new QueryClient(queryClientConfig)

// Persistence Configuration
const persister = typeof window !== 'undefined' ? createSyncStoragePersister({
  storage: window.localStorage,
  key: 'cotrain-query-cache',
  // Serialize/deserialize functions for complex data types
  serialize: JSON.stringify,
  deserialize: JSON.parse
}) : undefined

// Query Keys Factory
export const queryKeys = {
  // Training related queries
  training: {
    all: ['training'] as const,
    sessions: () => [...queryKeys.training.all, 'sessions'] as const,
    session: (id: string) => [...queryKeys.training.sessions(), id] as const,
    options: () => [...queryKeys.training.all, 'options'] as const,
    history: (userId?: string) => [...queryKeys.training.all, 'history', userId] as const,
    metrics: (sessionId: string) => [...queryKeys.training.all, 'metrics', sessionId] as const,
    leaderboard: () => [...queryKeys.training.all, 'leaderboard'] as const
  },
  
  // Blockchain related queries
  blockchain: {
    all: ['blockchain'] as const,
    wallet: () => [...queryKeys.blockchain.all, 'wallet'] as const,
    balance: (address: string) => [...queryKeys.blockchain.wallet(), 'balance', address] as const,
    transactions: (address: string) => [...queryKeys.blockchain.all, 'transactions', address] as const,
    transaction: (hash: string) => [...queryKeys.blockchain.all, 'transaction', hash] as const,
    contracts: () => [...queryKeys.blockchain.all, 'contracts'] as const,
    contract: (address: string) => [...queryKeys.blockchain.contracts(), address] as const,
    network: () => [...queryKeys.blockchain.all, 'network'] as const,
    rewards: (address: string) => [...queryKeys.blockchain.all, 'rewards', address] as const
  },
  
  // Terminal related queries
  terminal: {
    all: ['terminal'] as const,
    sessions: () => [...queryKeys.terminal.all, 'sessions'] as const,
    session: (id: string) => [...queryKeys.terminal.sessions(), id] as const,
    logs: (sessionId?: string) => [...queryKeys.terminal.all, 'logs', sessionId] as const,
    contributors: () => [...queryKeys.terminal.all, 'contributors'] as const,
    networkStats: () => [...queryKeys.terminal.all, 'network-stats'] as const,
    performance: () => [...queryKeys.terminal.all, 'performance'] as const
  },
  
  // User related queries
  user: {
    all: ['user'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    achievements: (id: string) => [...queryKeys.user.all, 'achievements', id] as const,
    statistics: (id: string) => [...queryKeys.user.all, 'statistics', id] as const
  },
  
  // System related queries
  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    version: () => [...queryKeys.system.all, 'version'] as const,
    config: () => [...queryKeys.system.all, 'config'] as const,
    announcements: () => [...queryKeys.system.all, 'announcements'] as const
  }
} as const

// Query Client Provider Component
interface QueryProviderProps {
  children: React.ReactNode
  enablePersistence?: boolean
  enableDevtools?: boolean
}

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  enablePersistence = true,
  enableDevtools = process.env.NODE_ENV === 'development'
}) => {
  // Use persistence if enabled and available
  if (enablePersistence && persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          // Restore cache on mount
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          // Dehydrate options
          dehydrateOptions: {
            shouldDehydrateQuery: (query: any) => {
              // Only persist successful queries
              return query.state.status === 'success'
            }
          }
        }}
      >
        {children}
        {enableDevtools && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom"
          />
        )}
      </PersistQueryClientProvider>
    )
  }
  
  // Fallback to regular provider
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  )
}

// Utility functions for query management
export const queryUtils = {
  // Invalidate all queries for a specific domain
  invalidateTraining: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.training.all })
  },
  
  invalidateBlockchain: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.blockchain.all })
  },
  
  invalidateTerminal: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.terminal.all })
  },
  
  invalidateUser: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
  },
  
  // Prefetch common queries
  prefetchTrainingOptions: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.training.options(),
      queryFn: async () => {
        // This would be replaced with actual API call
        const response = await fetch('/api/training/options')
        if (!response.ok) throw new Error('Failed to fetch training options')
        return response.json()
      },
      staleTime: 1000 * 60 * 10 // 10 minutes
    })
  },
  
  prefetchNetworkStats: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.terminal.networkStats(),
      queryFn: async () => {
        // This would be replaced with actual API call
        const response = await fetch('/api/terminal/network-stats')
        if (!response.ok) throw new Error('Failed to fetch network stats')
        return response.json()
      },
      staleTime: 1000 * 30 // 30 seconds
    })
  },
  
  // Clear all cached data
  clearCache: () => {
    queryClient.clear()
  },
  
  // Remove specific queries
  removeQueries: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey })
  },
  
  // Get cached data
  getCachedData: <T = unknown>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  },
  
  // Set cached data
  setCachedData: <T = unknown>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData<T>(queryKey, data)
  },
  
  // Optimistic updates
  optimisticUpdate: <T = unknown>(
    queryKey: readonly unknown[],
    updater: (oldData: T | undefined) => T
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey)
    queryClient.setQueryData<T>(queryKey, updater(previousData))
    return previousData
  },
  
  // Rollback optimistic update
  rollbackUpdate: <T = unknown>(queryKey: readonly unknown[], previousData: T) => {
    queryClient.setQueryData<T>(queryKey, previousData)
  }
}

// Error boundary for React Query
export class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo)
    
    // Add error notification
    const ui = useUIStore.getState()
    ui.addNotification({
      type: 'error',
      title: 'Application Error',
      message: 'An unexpected error occurred. Please refresh the page.',
      persistent: true
    })
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Add query client to window for debugging
  ;(window as any).__queryClient = queryClient
  ;(window as any).__queryUtils = queryUtils
  ;(window as any).__queryKeys = queryKeys
}

export default queryClient