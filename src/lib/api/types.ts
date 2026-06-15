export interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface SyncCheckResponse {
  productIds: string[]
  saleIds: string[]
  invoiceIds: string[]
}

export interface SyncEntityResult {
  received: number
  created: number
  skipped: number
}

export interface SyncPushResponse {
  products: SyncEntityResult
  sales: SyncEntityResult
  invoices: SyncEntityResult
}
