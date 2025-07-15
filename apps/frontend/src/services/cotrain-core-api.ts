import { ApiResponse } from '../types/cotrain'
import { API_CONFIG } from '../config'
import { handleError } from '../utils/error-handler'

// CotrainCore API client
class CotrainCoreApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

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

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Create CotrainCore API client instance
const cotrainCoreClient = new CotrainCoreApiClient(API_CONFIG.COTRAIN_CORE_URL)

// CotrainCore API interfaces
export interface TrainingConfig {
  id: string
  name: string
  description: string
  model_type: string
  parameters: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  config_id: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  metrics: {
    loss: number
    accuracy: number
    learning_rate: number
    epoch: number
    step: number
  }
  participants: string[]
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface TrainingLog {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
  message: string
  session_id: string
}

// CotrainCore API methods
export const cotrainCoreApi = {
  // Health check
  health: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return cotrainCoreClient.get('/health')
  },

  // Configuration management
  getConfigs: async (): Promise<ApiResponse<TrainingConfig[]>> => {
    return cotrainCoreClient.get('/api/v1/configs')
  },

  getConfig: async (configId: string): Promise<ApiResponse<TrainingConfig>> => {
    return cotrainCoreClient.get(`/api/v1/configs/${configId}`)
  },

  loadConfig: async (configPath: string): Promise<ApiResponse<TrainingConfig>> => {
    return cotrainCoreClient.post('/api/v1/configs/load', { config_path: configPath })
  },

  // Training session management
  startTraining: async (configId: string, participants?: string[]): Promise<ApiResponse<TrainingSession>> => {
    return cotrainCoreClient.post('/api/v1/training/start', {
      config_id: configId,
      participants: participants || []
    })
  },

  stopTraining: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    return cotrainCoreClient.post(`/api/v1/training/${sessionId}/stop`)
  },

  pauseTraining: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    return cotrainCoreClient.post(`/api/v1/training/${sessionId}/pause`)
  },

  resumeTraining: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    return cotrainCoreClient.post(`/api/v1/training/${sessionId}/resume`)
  },

  // Training status and monitoring
  getTrainingStatus: async (sessionId: string): Promise<ApiResponse<TrainingSession>> => {
    return cotrainCoreClient.get(`/api/v1/training/${sessionId}/status`)
  },

  getTrainingSessions: async (): Promise<ApiResponse<TrainingSession[]>> => {
    return cotrainCoreClient.get('/api/v1/training/sessions')
  },

  getTrainingLogs: async (sessionId: string, limit = 100): Promise<ApiResponse<TrainingLog[]>> => {
    return cotrainCoreClient.get(`/api/v1/training/${sessionId}/logs?limit=${limit}`)
  },

  // Real-time updates (WebSocket would be better, but HTTP polling for now)
  subscribeToUpdates: async (sessionId: string, callback: (data: TrainingSession) => void) => {
    const pollInterval = 5000 // 5 seconds
    
    const poll = async () => {
      try {
        const response = await cotrainCoreApi.getTrainingStatus(sessionId)
        if (response.success && response.data) {
          callback(response.data)
        }
      } catch (error) {
        console.error('Failed to poll training status:', error)
      }
    }

    // Initial poll
    await poll()
    
    // Set up polling interval
    const intervalId = setInterval(poll, pollInterval)
    
    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}

// Export the client for direct use if needed
export { cotrainCoreClient }
export default cotrainCoreApi