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

export type RemoteAutoPrintMode =
  | 'off'
  | 'invoice'
  | 'official_receipt'
  | 'acknowledgement_receipt'

export interface RemotePosSettings {
  masterPasswordHash: string
  vatPercentage: number
  receiptMainText: string
  receiptAddress: string
  receiptContactNumber: string
  receiptTin: string
  receiptBottomText: string
  officialReceiptMainText: string
  officialReceiptAddress: string
  officialReceiptContactNumber: string
  officialReceiptTin: string
  officialReceiptBottomText: string
  autoPrint: RemoteAutoPrintMode
  continuousBarcodeScanning: boolean
}
