import type {
  RemotePosSettings,
  SyncCheckResponse,
  SyncPushResponse,
} from '@/lib/api/types'

const TENANT_HEADER = 'x-tenant-id'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class ApiClient {
  private accessToken: string | null = null
  private readonly baseUrl: string
  private readonly tenantId: string

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl
    this.tenantId = tenantId
  }

  async authenticatePos(posId: string): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>('/auth/pos-sync', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, posId: posId.trim() }),
      authenticated: false,
    })

    this.accessToken = response.accessToken
    return response
  }

  fetchPosSettings(): Promise<RemotePosSettings> {
    return this.request<RemotePosSettings>('/pos-settings')
  }

  checkExisting(payload: {
    productIds: string[]
    saleIds: string[]
    invoiceIds: string[]
  }): Promise<SyncCheckResponse> {
    return this.request<SyncCheckResponse>('/sync/check', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  push(payload: {
    products: unknown[]
    sales: unknown[]
    invoices: unknown[]
  }): Promise<SyncPushResponse> {
    return this.request<SyncPushResponse>('/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  private async request<T>(
    path: string,
    options: RequestInit & { authenticated?: boolean } = {},
  ): Promise<T> {
    const { authenticated = true, ...init } = options
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')

    if (authenticated) {
      if (!this.accessToken) {
        throw new Error('API client is not authenticated')
      }

      headers.set('Authorization', `Bearer ${this.accessToken}`)
      headers.set(TENANT_HEADER, this.tenantId)
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (!response.ok) {
      const message = await this.readErrorMessage(response)
      throw new ApiError(message, response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  private async readErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { message?: string | string[] }
      if (Array.isArray(body.message)) {
        return body.message.join(', ')
      }

      if (typeof body.message === 'string') {
        return body.message
      }
    } catch {
      // Fall back to status text below.
    }

    return response.statusText || `Request failed with status ${response.status}`
  }
}

export function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function createApiClient(apiUrl: string, tenantId: string): ApiClient {
  return new ApiClient(`${normalizeApiBaseUrl(apiUrl)}/api`, tenantId.trim())
}
