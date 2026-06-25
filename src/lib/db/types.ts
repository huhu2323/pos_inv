export type UserRole = 'admin' | 'cashier'

export interface User {
  id?: number
  username: string
  passwordHash: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id?: number
  token: string
  userId: number
  expiresAt: Date
  createdAt: Date
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
}

export interface Employee {
  id: number
  username: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  image: string
  qty: number
  initialQty: number
  lowStockAlertMode: LowStockAlertMode
  lowStockAlertValue: number | null
}

export type LowStockAlertMode = 'off' | 'unit'

export type ProductUnitOfMeasure = 'kg' | 'pc' | 'liter'

export interface Product {
  id: string
  barcode: string
  shortName: string
  name: string
  defaultPrice: number
  image: string
  description: string
  qty: number
  initialQty: number
  lowStockAlertMode: LowStockAlertMode
  lowStockAlertValue: number | null
  unitOfMeasure: ProductUnitOfMeasure
  active: 0 | 1
  variants: ProductVariant[]
  createdAt: Date
  updatedAt: Date
}

export type InventoryMovementType = 'inbound' | 'outbound'

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  type: InventoryMovementType
  qty: number
  reference: string
  beforeQty: number
  afterQty: number
  createdById: number
  createdByName: string
  createdAt: Date
}

export type SaleStatus = 'completed' | 'voided'

export type SaleType = 'sale' | 'void'

export interface SaleLine {
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Sale {
  id: string
  type: SaleType
  originalSaleId?: string
  lines: SaleLine[]
  subtotal: number
  amountPaid: number
  change: number
  itemCount: number
  status: SaleStatus
  createdById: number
  createdByName: string
  voidedById?: number
  voidedByName?: string
  voidedAt?: Date
  createdAt: Date
}

export type AutoPrintMode = 'off' | 'invoice' | 'official_receipt' | 'acknowledgement_receipt'

export type PrintDocumentType = 'invoice' | 'official_receipt' | 'acknowledgement_receipt'

export interface AppSettings {
  id: 'app'
  masterPasswordHash: string
  autoPrint: AutoPrintMode
  continuousBarcodeScanning: boolean
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
  invoiceNextNumber: number
  syncApiUrl: string
  syncTenantId: string
  syncPosId: string
  updatedAt: Date
}

export interface Invoice {
  id: string
  invoiceNumber: string
  saleId: string
  lines: SaleLine[]
  subtotal: number
  amountPaid: number
  change: number
  vatPercentage: number
  netAmount: number
  vatAmount: number
  createdById: number
  createdByName: string
  createdAt: Date
}

export type DataArchiveStatus = 'archived' | 'restored'

export interface DataArchivePayload {
  sales: Sale[]
  invoices: Invoice[]
}

export interface DataArchive {
  id: string
  saleCount: number
  invoiceCount: number
  salesTotal: number
  status: DataArchiveStatus
  archivedById: number
  archivedByName: string
  restoredById?: number
  restoredByName?: string
  restoredAt?: Date
  payload: DataArchivePayload
  createdAt: Date
}
