import { createApiClient } from '@/lib/api/client'
import type { SyncPushResponse } from '@/lib/api/types'
import type { AppSettings, Invoice, Product, Sale } from '@/lib/db/types'
import { listInvoices } from '@/lib/services/invoiceService'
import { listProducts } from '@/lib/services/productService'
import { listSales } from '@/lib/services/saleService'
import { getSettings } from '@/lib/services/settingsService'

export type SyncSettings = Pick<
  AppSettings,
  'syncApiUrl' | 'syncTenantId' | 'syncEmail' | 'syncPassword'
>

export function isSyncConfigured(settings: SyncSettings): boolean {
  return Boolean(
    settings.syncApiUrl.trim() &&
      settings.syncTenantId.trim() &&
      settings.syncEmail.trim() &&
      settings.syncPassword.trim(),
  )
}

function assertSyncConfigured(settings: SyncSettings): void {
  if (!isSyncConfigured(settings)) {
    throw new Error('Sync settings are incomplete. Save API URL, tenant ID, email, and password first.')
  }
}

function toSyncProduct(product: Product) {
  return {
    id: product.id,
    barcode: product.barcode,
    shortName: product.shortName,
    name: product.name,
    defaultPrice: product.defaultPrice,
    image: product.image,
    description: product.description,
    qty: product.qty,
    active: product.active,
    variants: product.variants,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

function toSyncSale(sale: Sale) {
  return {
    id: sale.id,
    type: sale.type,
    originalSaleId: sale.originalSaleId,
    lines: sale.lines,
    subtotal: sale.subtotal,
    amountPaid: sale.amountPaid,
    change: sale.change,
    itemCount: sale.itemCount,
    status: sale.status,
    createdById: sale.createdById,
    createdByName: sale.createdByName,
    voidedById: sale.voidedById,
    voidedByName: sale.voidedByName,
    voidedAt: sale.voidedAt?.toISOString(),
    createdAt: sale.createdAt.toISOString(),
  }
}

function toSyncInvoice(invoice: Invoice) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    saleId: invoice.saleId,
    lines: invoice.lines,
    subtotal: invoice.subtotal,
    amountPaid: invoice.amountPaid,
    change: invoice.change,
    vatPercentage: invoice.vatPercentage,
    netAmount: invoice.netAmount,
    vatAmount: invoice.vatAmount,
    createdById: invoice.createdById,
    createdByName: invoice.createdByName,
    createdAt: invoice.createdAt.toISOString(),
  }
}

function filterNewRecords<T extends { id: string }>(
  records: T[],
  existingIds: string[],
): T[] {
  const existing = new Set(existingIds)
  return records.filter((record) => !existing.has(record.id))
}

export async function syncWithServer(): Promise<SyncPushResponse> {
  const settings = await getSettings()
  assertSyncConfigured(settings)

  const client = createApiClient(settings.syncApiUrl, settings.syncTenantId)
  await client.login(settings.syncEmail, settings.syncPassword)

  const [products, sales, invoices] = await Promise.all([
    listProducts(),
    listSales(),
    listInvoices(),
  ])

  const existing = await client.checkExisting({
    productIds: products.map((product) => product.id),
    saleIds: sales.map((sale) => sale.id),
    invoiceIds: invoices.map((invoice) => invoice.id),
  })

  const newProducts = filterNewRecords(products, existing.productIds)
  const newSales = filterNewRecords(sales, existing.saleIds)
  const newInvoices = filterNewRecords(invoices, existing.invoiceIds)

  if (!newProducts.length && !newSales.length && !newInvoices.length) {
    return {
      products: { received: 0, created: 0, skipped: 0 },
      sales: { received: 0, created: 0, skipped: 0 },
      invoices: { received: 0, created: 0, skipped: 0 },
    }
  }

  return client.push({
    products: newProducts.map(toSyncProduct),
    sales: newSales.map(toSyncSale),
    invoices: newInvoices.map(toSyncInvoice),
  })
}

export function formatSyncSummary(result: SyncPushResponse): string {
  const totalCreated =
    result.products.created + result.sales.created + result.invoices.created

  if (totalCreated === 0) {
    return 'Sync complete: everything is already on the server.'
  }

  const parts = [
    `products ${result.products.created} new, ${result.products.skipped} skipped`,
    `sales ${result.sales.created} new, ${result.sales.skipped} skipped`,
    `invoices ${result.invoices.created} new, ${result.invoices.skipped} skipped`,
  ]

  return `Sync complete: ${parts.join('; ')}.`
}
