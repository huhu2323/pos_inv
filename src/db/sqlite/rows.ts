import type {
  AppSettings,
  DataArchive,
  InventoryLog,
  Invoice,
  Product,
  Sale,
  Session,
  User,
} from '../types'

interface StoredImageRecord {
  id: string
  blob: Blob
  mimeType: string
  createdAt: Date
}

function parseDate(value: unknown): Date {
  return new Date(String(value))
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image data'))
        return
      }

      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data'))
    reader.readAsDataURL(blob)
  })
}

export function rowToUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    passwordHash: String(row.passwordHash),
    displayName: String(row.displayName),
    role: row.role as User['role'],
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  }
}

export function userToValues(user: User): unknown[] {
  return [
    user.username,
    user.passwordHash,
    user.displayName,
    user.role,
    user.createdAt.toISOString(),
    user.updatedAt.toISOString(),
  ]
}

export function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: Number(row.id),
    token: String(row.token),
    userId: Number(row.userId),
    expiresAt: parseDate(row.expiresAt),
    createdAt: parseDate(row.createdAt),
  }
}

export function sessionToValues(session: Session): unknown[] {
  return [
    session.token,
    session.userId,
    session.expiresAt.toISOString(),
    session.createdAt.toISOString(),
  ]
}

export function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    barcode: String(row.barcode),
    shortName: String(row.shortName),
    name: String(row.name),
    defaultPrice: Number(row.defaultPrice),
    image: String(row.image),
    description: String(row.description),
    qty: Number(row.qty),
    active: Number(row.active) === 0 ? 0 : 1,
    variants: parseJson(row.variants, []),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  }
}

export function productToValues(product: Product): unknown[] {
  return [
    product.id,
    product.barcode,
    product.shortName,
    product.name,
    product.defaultPrice,
    product.image,
    product.description,
    product.qty,
    product.active,
    JSON.stringify(product.variants),
    product.createdAt.toISOString(),
    product.updatedAt.toISOString(),
  ]
}

export function rowToImage(row: Record<string, unknown>): StoredImageRecord {
  return {
    id: String(row.id),
    blob: base64ToBlob(String(row.blobData), String(row.mimeType)),
    mimeType: String(row.mimeType),
    createdAt: parseDate(row.createdAt),
  }
}

export async function imageToValues(image: StoredImageRecord): Promise<unknown[]> {
  return [
    image.id,
    await blobToBase64(image.blob),
    image.mimeType,
    image.createdAt.toISOString(),
  ]
}

export function rowToInventoryLog(row: Record<string, unknown>): InventoryLog {
  return {
    id: String(row.id),
    productId: String(row.productId),
    productName: String(row.productName),
    variantId: row.variantId ? String(row.variantId) : undefined,
    variantName: row.variantName ? String(row.variantName) : undefined,
    type: row.type as InventoryLog['type'],
    qty: Number(row.qty),
    reference: String(row.reference),
    beforeQty: Number(row.beforeQty),
    afterQty: Number(row.afterQty),
    createdById: Number(row.createdById),
    createdByName: String(row.createdByName),
    createdAt: parseDate(row.createdAt),
  }
}

export function inventoryLogToValues(log: InventoryLog): unknown[] {
  return [
    log.id,
    log.productId,
    log.productName,
    log.variantId ?? null,
    log.variantName ?? null,
    log.type,
    log.qty,
    log.reference,
    log.beforeQty,
    log.afterQty,
    log.createdById,
    log.createdByName,
    log.createdAt.toISOString(),
  ]
}

export function rowToSale(row: Record<string, unknown>): Sale {
  return {
    id: String(row.id),
    type: row.type as Sale['type'],
    originalSaleId: row.originalSaleId ? String(row.originalSaleId) : undefined,
    lines: parseJson(row.lines, []),
    subtotal: Number(row.subtotal),
    amountPaid: Number(row.amountPaid),
    change: Number(row.changeAmount),
    itemCount: Number(row.itemCount),
    status: row.status as Sale['status'],
    createdById: Number(row.createdById),
    createdByName: String(row.createdByName),
    voidedById: row.voidedById != null ? Number(row.voidedById) : undefined,
    voidedByName: row.voidedByName ? String(row.voidedByName) : undefined,
    voidedAt: row.voidedAt ? parseDate(row.voidedAt) : undefined,
    createdAt: parseDate(row.createdAt),
  }
}

export function saleToValues(sale: Sale): unknown[] {
  return [
    sale.id,
    sale.type,
    sale.originalSaleId ?? null,
    JSON.stringify(sale.lines),
    sale.subtotal,
    sale.amountPaid,
    sale.change,
    sale.itemCount,
    sale.status,
    sale.createdById,
    sale.createdByName,
    sale.voidedById ?? null,
    sale.voidedByName ?? null,
    sale.voidedAt?.toISOString() ?? null,
    sale.createdAt.toISOString(),
  ]
}

export function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    id: 'app',
    masterPasswordHash: String(row.masterPasswordHash),
    autoInvoice: Number(row.autoInvoice) === 1,
    continuousBarcodeScanning: Number(row.continuousBarcodeScanning) === 1,
    vatPercentage: Number(row.vatPercentage),
    receiptMainText: String(row.receiptMainText),
    receiptAddress: String(row.receiptAddress),
    receiptContactNumber: String(row.receiptContactNumber),
    receiptTin: String(row.receiptTin),
    receiptBottomText: String(row.receiptBottomText),
    invoiceNextNumber: Number(row.invoiceNextNumber),
    updatedAt: parseDate(row.updatedAt),
  }
}

export function settingsToValues(settings: AppSettings): unknown[] {
  return [
    settings.id,
    settings.masterPasswordHash,
    settings.autoInvoice ? 1 : 0,
    settings.continuousBarcodeScanning ? 1 : 0,
    settings.vatPercentage,
    settings.receiptMainText,
    settings.receiptAddress,
    settings.receiptContactNumber,
    settings.receiptTin,
    settings.receiptBottomText,
    settings.invoiceNextNumber,
    settings.updatedAt.toISOString(),
  ]
}

export function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoiceNumber),
    saleId: String(row.saleId),
    lines: parseJson(row.lines, []),
    subtotal: Number(row.subtotal),
    amountPaid: Number(row.amountPaid),
    change: Number(row.changeAmount),
    vatPercentage: Number(row.vatPercentage),
    netAmount: Number(row.netAmount),
    vatAmount: Number(row.vatAmount),
    createdById: Number(row.createdById),
    createdByName: String(row.createdByName),
    createdAt: parseDate(row.createdAt),
  }
}

export function invoiceToValues(invoice: Invoice): unknown[] {
  return [
    invoice.id,
    invoice.invoiceNumber,
    invoice.saleId,
    JSON.stringify(invoice.lines),
    invoice.subtotal,
    invoice.amountPaid,
    invoice.change,
    invoice.vatPercentage,
    invoice.netAmount,
    invoice.vatAmount,
    invoice.createdById,
    invoice.createdByName,
    invoice.createdAt.toISOString(),
  ]
}

export function rowToDataArchive(row: Record<string, unknown>): DataArchive {
  return {
    id: String(row.id),
    saleCount: Number(row.saleCount),
    invoiceCount: Number(row.invoiceCount),
    salesTotal: Number(row.salesTotal),
    status: row.status as DataArchive['status'],
    archivedById: Number(row.archivedById),
    archivedByName: String(row.archivedByName),
    restoredById: row.restoredById != null ? Number(row.restoredById) : undefined,
    restoredByName: row.restoredByName ? String(row.restoredByName) : undefined,
    restoredAt: row.restoredAt ? parseDate(row.restoredAt) : undefined,
    payload: parseJson(row.payload, { sales: [], invoices: [] }),
    createdAt: parseDate(row.createdAt),
  }
}

export function dataArchiveToValues(archive: DataArchive): unknown[] {
  return [
    archive.id,
    archive.saleCount,
    archive.invoiceCount,
    archive.salesTotal,
    archive.status,
    archive.archivedById,
    archive.archivedByName,
    archive.restoredById ?? null,
    archive.restoredByName ?? null,
    archive.restoredAt?.toISOString() ?? null,
    JSON.stringify(archive.payload),
    archive.createdAt.toISOString(),
  ]
}
