import { db } from '@/lib/db/database'
import type { Invoice, Sale } from '@/lib/db/types'
import { getSettings } from './settingsService'
import { calculateVatBreakdown } from '@/shared/utils/vat'

const INVOICE_NUMBER_PAD = 6
const MAX_INVOICE_NUMBER = 999999

export function formatInvoiceNumber(sequence: number): string {
  const clamped = Math.min(Math.max(0, sequence), MAX_INVOICE_NUMBER)
  return String(clamped).padStart(INVOICE_NUMBER_PAD, '0')
}

export async function listInvoices(): Promise<Invoice[]> {
  return db.invoices.orderBy('createdAt').reverse().toArray()
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  return db.invoices.get(id)
}

export async function listInvoicesBySaleId(saleId: string): Promise<Invoice[]> {
  const invoices = await db.invoices.where('saleId').equals(saleId).toArray()
  return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getInvoiceBySaleId(saleId: string): Promise<Invoice | undefined> {
  const invoices = await listInvoicesBySaleId(saleId)
  return invoices[0]
}

export async function saleHasInvoice(saleId: string): Promise<boolean> {
  const count = await db.invoices.where('saleId').equals(saleId).count()
  return count > 0
}

function assertSaleCanBeInvoiced(sale: Sale): void {
  if (sale.type !== 'sale' || sale.status !== 'completed') {
    throw new Error('Only completed sales can be invoiced')
  }
}

async function allocateInvoiceNumber(): Promise<string> {
  const settings = await getSettings()

  if (settings.invoiceNextNumber > MAX_INVOICE_NUMBER) {
    throw new Error('Invoice number limit reached')
  }

  return formatInvoiceNumber(settings.invoiceNextNumber)
}

export async function createInvoiceForSale(sale: Sale): Promise<Invoice> {
  assertSaleCanBeInvoiced(sale)

  const settings = await getSettings()
  const vat = calculateVatBreakdown(sale.subtotal, settings.vatPercentage)

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    invoiceNumber: await allocateInvoiceNumber(),
    saleId: sale.id,
    lines: sale.lines,
    subtotal: sale.subtotal,
    amountPaid: sale.amountPaid,
    change: sale.change,
    vatPercentage: settings.vatPercentage,
    netAmount: vat.netAmount,
    vatAmount: vat.vatAmount,
    createdById: sale.createdById,
    createdByName: sale.createdByName,
    createdAt: new Date(),
  }

  await db.transaction('rw', db.invoices, db.settings, async () => {
    const currentSettings = await db.settings.get('app')
    if (!currentSettings) {
      throw new Error('Settings not found')
    }

    if (currentSettings.invoiceNextNumber > MAX_INVOICE_NUMBER) {
      throw new Error('Invoice number limit reached')
    }

    invoice.invoiceNumber = formatInvoiceNumber(currentSettings.invoiceNextNumber)

    await db.invoices.add(invoice)
    await db.settings.put({
      ...currentSettings,
      invoiceNextNumber: currentSettings.invoiceNextNumber + 1,
      updatedAt: new Date(),
    })
  })

  return invoice
}

export async function getOrCreateInvoiceForSale(sale: Sale): Promise<Invoice> {
  assertSaleCanBeInvoiced(sale)

  const existing = await getInvoiceBySaleId(sale.id)
  if (existing) {
    return existing
  }

  return createInvoiceForSale(sale)
}
