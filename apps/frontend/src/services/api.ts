import { 
  ApiResponse, 
  PaginatedResponse, 
  TrainingOption, 
  Contributor, 
  NetworkStats, 
  ChartData, 
  TrainingSession,
  TrainingHistory,
  UserProfile
} from '../types/cotrain'
import { handleError } from '../utils/error-handler'
import { globalCache } from '../utils/performance'
import { API_CONFIG, CACHE_CONFIG } from '../config'

// HTTP client with error handling and auth support
class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      throw new Error('No access token found')
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
    }
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit & { requireAuth?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = false, ...requestOptions } = options
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestOptions.headers as Record<string, string> || {}),
    }

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await this.getAuthHeaders()
        Object.assign(headers, authHeaders)
      } catch (error) {
        // Try to refresh token
        const refreshed = await this.refreshTokenIfNeeded()
        if (refreshed) {
          const authHeaders = await this.getAuthHeaders()
          Object.assign(headers, authHeaders)
        } else {
          throw new Error('Authentication required')
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      // Handle 401 errors by trying to refresh token
      if (response.status === 401 && requireAuth) {
        const refreshed = await this.refreshTokenIfNeeded()
        if (refreshed) {
          // Retry the request with new token
          const authHeaders = await this.getAuthHeaders()
          Object.assign(headers, authHeaders)
          const retryResponse = await fetch(url, {
            ...requestOptions,
            headers,
          })
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`)
          }
          
          const retryData = await retryResponse.json()
          return {
            success: true,
            data: retryData,
            timestamp: new Date().toISOString()
          }
        } else {
          // Clear auth data
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          throw new Error('Authentication failed')
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const handledError = handleError(error)
      return {
        success: false,
        error: handledError.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async get<T>(endpoint: string, requireAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth })
  }

  async post<T>(endpoint: string, data?: any, requireAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    })
  }

  async put<T>(endpoint: string, data?: any, requireAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    })
  }

  async delete<T>(endpoint: string, requireAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth })
  }

  async patch<T>(endpoint: string, data?: any, requireAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    })
  }
}

// Create API client instances
const apiClient = new ApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT)
const authApiClient = new ApiClient(API_CONFIG.BACKEND_URL, API_CONFIG.TIMEOUT)

// Export types for external use
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

// Training API
export const trainingApi = {
  // Get all training options
  getTrainingOptions: async (): Promise<ApiResponse<TrainingOption[]>> => {
    const cacheKey = 'training-options'
    const cached = globalCache.get(cacheKey) as TrainingOption[] | null
    
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString()
      }
    }

    const response = await apiClient.get<TrainingOption[]>('/training/options')
    
    if (response.success && response.data) {
      globalCache.set(cacheKey, response.data, CACHE_CONFIG.DEFAULT_TTL)
    }
    
    return response
  },

  // Get training option by ID
  getTrainingOption: async (id: string): Promise<ApiResponse<TrainingOption>> => {
    return apiClient.get<TrainingOption>(`/training/options/${id}`)
  },

  // Join training session
  joinTraining: async (optionId: string): Promise<ApiResponse<TrainingSession>> => {
    return apiClient.post<TrainingSession>('/training/join', { optionId })
  },

  // Get training history
  getTrainingHistory: async (userId?: string): Promise<ApiResponse<TrainingHistory[]>> => {
    const endpoint = userId ? `/training/history?userId=${userId}` : '/training/history'
    return apiClient.get<TrainingHistory[]>(endpoint)
  },

  // Get active training sessions
  getActiveSessions: async (): Promise<ApiResponse<TrainingSession[]>> => {
    return apiClient.get<TrainingSession[]>('/training/sessions/active')
  }
}

// Network API
export const networkApi = {
  // Get network statistics
  getNetworkStats: async (): Promise<ApiResponse<NetworkStats>> => {
    const cacheKey = 'network-stats'
    const cached = globalCache.get(cacheKey) as NetworkStats | null
    
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString()
      }
    }

    const response = await apiClient.get<NetworkStats>('/network/stats')
    
    if (response.success && response.data) {
      globalCache.set(cacheKey, response.data, 30000) // Cache for 30 seconds
    }
    
    return response
  },

  // Get contributors
  getContributors: async (page = 1, limit = 50): Promise<PaginatedResponse<Contributor>> => {
    return apiClient.get<Contributor[]>(`/network/contributors?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Contributor>>
  },

  // Get chart data
  getChartData: async (timeRange = '7d'): Promise<ApiResponse<ChartData[]>> => {
    const cacheKey = `chart-data-${timeRange}`
    const cached = globalCache.get(cacheKey) as ChartData[] | null
    
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString()
      }
    }

    const response = await apiClient.get<ChartData[]>(`/network/chart-data?range=${timeRange}`)
    
    if (response.success && response.data) {
      globalCache.set(cacheKey, response.data, 60000) // Cache for 1 minute
    }
    
    return response
  }
}

// User API
export const userApi = {
  // Get user profile
  getProfile: async (userId?: string): Promise<ApiResponse<UserProfile>> => {
    const endpoint = userId ? `/users/${userId}` : '/users/me'
    return apiClient.get<UserProfile>(endpoint)
  },

  // Update user profile
  updateProfile: async (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiClient.put<UserProfile>('/users/me', data)
  },

  // Get user statistics
  getUserStats: async (userId?: string): Promise<ApiResponse<any>> => {
    const endpoint = userId ? `/users/${userId}/stats` : '/users/me/stats'
    return apiClient.get<any>(endpoint)
  }
}

// Fallback to mock data when API is not available
export const mockFallback = {
  async getTrainingOptions(): Promise<ApiResponse<TrainingOption[]>> {
    try {
      const { generateTrainingOptions } = await import('../data/mock-data')
      return {
        success: true,
        data: generateTrainingOptions(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load mock training options',
        timestamp: new Date().toISOString()
      }
    }
  },

  async getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
    try {
      const { generateNetworkStats } = await import('../data/mock-data')
      return {
        success: true,
        data: generateNetworkStats(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load mock network stats',
        timestamp: new Date().toISOString()
      }
    }
  },

  async getContributors(): Promise<ApiResponse<Contributor[]>> {
    try {
      const { generateContributors } = await import('../data/mock-data')
      return {
        success: true,
        data: generateContributors(50),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load mock contributors',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Smart API that falls back to mock data
export const smartApi = {
  async getTrainingOptions(): Promise<ApiResponse<TrainingOption[]>> {
    const response = await trainingApi.getTrainingOptions()
    if (!response.success) {
      return mockFallback.getTrainingOptions()
    }
    return response
  },

  async getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
    const response = await networkApi.getNetworkStats()
    if (!response.success) {
      return mockFallback.getNetworkStats()
    }
    return response
  },

  async getContributors(): Promise<ApiResponse<Contributor[]>> {
    const response = await networkApi.getContributors()
    if (!response.success) {
      return mockFallback.getContributors()
    }
    return response.data ? { ...response, data: response.data } : mockFallback.getContributors()
  }
}

// Export unified API client (backward compatibility)
export default apiClient

// Export individual clients
export { apiClient, authApiClient }