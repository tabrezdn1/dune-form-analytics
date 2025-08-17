import { ApiResponse, PaginatedResponse, Form, PublicForm, FormResponse, SubmitResponseResult, Analytics } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// API Client Class
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Form endpoints
  async createForm(data: {
    title: string
    description?: string
    fields: any[]
  }): Promise<ApiResponse<Form>> {
    return this.request('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getForm(id: string): Promise<ApiResponse<Form>> {
    return this.request(`/api/forms/${id}`)
  }

  async updateForm(id: string, data: Partial<Form>): Promise<ApiResponse<Form>> {
    return this.request(`/api/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteForm(id: string): Promise<ApiResponse> {
    return this.request(`/api/forms/${id}`, {
      method: 'DELETE',
    })
  }

  async listForms(page = 1, limit = 10): Promise<PaginatedResponse<Form>> {
    return this.request(`/api/forms?page=${page}&limit=${limit}`)
  }

  async publishForm(id: string): Promise<ApiResponse<Form>> {
    return this.request(`/api/forms/${id}/publish`, {
      method: 'POST',
    })
  }

  async unpublishForm(id: string): Promise<ApiResponse<Form>> {
    return this.request(`/api/forms/${id}/unpublish`, {
      method: 'POST',
    })
  }

  // Public form endpoints
  async getPublicForm(slug: string): Promise<ApiResponse<PublicForm>> {
    return this.request(`/api/forms/slug/${slug}`)
  }

  // Response endpoints
  async submitResponse(
    formId: string,
    data: {
      answers: Array<{ fieldId: string; value: any }>
      meta?: any
    }
  ): Promise<SubmitResponseResult> {
    return this.request(`/api/forms/${formId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getResponses(
    formId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<FormResponse>> {
    return this.request(`/api/forms/${formId}/responses?page=${page}&limit=${limit}`)
  }

  async exportResponsesCSV(formId: string, params?: {
    startDate?: string
    endDate?: string
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.set('startDate', params.startDate)
    if (params?.endDate) queryParams.set('endDate', params.endDate)
    
    const url = `${this.baseURL}/api/forms/${formId}/export.csv?${queryParams}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`)
    }
    
    return response.blob()
  }

  // Analytics endpoints
  async getAnalytics(formId: string): Promise<ApiResponse<Analytics>> {
    return this.request(`/api/forms/${formId}/analytics`)
  }

  async computeAnalytics(
    formId: string,
    params?: {
      startDate?: string
      endDate?: string
      fields?: string[]
    }
  ): Promise<ApiResponse<Analytics>> {
    return this.request(`/api/forms/${formId}/analytics/compute`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async getRealTimeMetrics(formId: string): Promise<ApiResponse<{
    activeUsers: number
    responsesToday: number
    responsesThisHour: number
    lastUpdate: string
  }>> {
    return this.request(`/api/forms/${formId}/metrics`)
  }

  async getAnalyticsSummary(): Promise<ApiResponse<Array<{
    formId: string
    formTitle: string
    totalResponses: number
    completionRate: number
    lastResponse?: string
  }>>> {
    return this.request('/api/analytics/summary')
  }

  async getTrendAnalytics(
    formId: string,
    fieldId: string,
    days = 30
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/forms/${formId}/trends?fieldId=${fieldId}&days=${days}`)
  }

  // WebSocket connection stats
  async getWebSocketStats(formId?: string): Promise<ApiResponse<{
    totalConnections: number
    roomConnections?: number
  }>> {
    const params = formId ? `?formId=${formId}` : ''
    return this.request(`/api/ws/stats${params}`)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request('/health')
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL)

// Utility functions for common operations
export const formUtils = {
  // Generate form URL for sharing
  getFormShareURL(slug: string, baseURL?: string): string {
    const base = baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/f/${slug}`
  },

  // Generate dashboard URL
  getDashboardURL(formId: string, baseURL?: string): string {
    const base = baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/dashboard/${formId}`
  },

  // Format form status
  formatStatus(status: string): string {
    return status === 'published' ? 'Published' : 'Draft'
  },

  // Get status color
  getStatusColor(status: string): string {
    return status === 'published' ? 'text-green-600' : 'text-yellow-600'
  },
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError
}
