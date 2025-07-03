const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = false,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(requestHeaders, authHeaders);
      } catch (error) {
        // Try to refresh token
        const refreshed = await this.refreshTokenIfNeeded();
        if (refreshed) {
          const authHeaders = await this.getAuthHeaders();
          Object.assign(requestHeaders, authHeaders);
        } else {
          throw new Error('Authentication required');
        }
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 errors by trying to refresh token
      if (response.status === 401 && requireAuth) {
        const refreshed = await this.refreshTokenIfNeeded();
        if (refreshed) {
          // Retry the request with new token
          const authHeaders = await this.getAuthHeaders();
          Object.assign(requestHeaders, authHeaders);
          const retryResponse = await fetch(url, {
            ...requestOptions,
            headers: requestHeaders,
          });
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        } else {
          // Clear auth data and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          throw new Error('Authentication failed');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return response.text() as any;
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  async post<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  async put<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  async delete<T = any>(endpoint: string, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  async patch<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(BACKEND_URL);

// Export types
export type { ApiRequestOptions };