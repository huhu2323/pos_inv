import type { Invoice, PrintDocumentType, Sale, SaleLine } from '@/lib/db/types'

export interface ReceiptRow {
  id: string
  documentType: PrintDocumentType
  documentNumber: string
  saleId: string
  date: Date
  cashier: string
  subtotal: number
  lines: SaleLine[]
  sale: Sale
  invoice?: Invoice
}

function formatSaleReferenceNumber(saleId: string): string {
  return saleId.slice(0, 8).toUpperCase()
}

function isPrintableSale(sale: Sale): boolean {
  return sale.type === 'sale' && sale.status === 'completed'
}

export function buildReceiptRows(sales: Sale[], invoices: Invoice[]): ReceiptRow[] {
  const salesById = new Map(sales.map((sale) => [sale.id, sale]))
  const invoicesBySaleId = new Map<string, Invoice[]>()

  for (const invoice of invoices) {
    const existing = invoicesBySaleId.get(invoice.saleId) ?? []
    existing.push(invoice)
    invoicesBySaleId.set(invoice.saleId, existing)
  }

  for (const [saleId, saleInvoices] of invoicesBySaleId) {
    invoicesBySaleId.set(
      saleId,
      saleInvoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    )
  }

  const rows: ReceiptRow[] = []

  for (const invoice of invoices) {
    const sale = salesById.get(invoice.saleId)
    if (!sale) continue

    rows.push({
      id: invoice.id,
      documentType: 'invoice',
      documentNumber: invoice.invoiceNumber,
      saleId: invoice.saleId,
      date: invoice.createdAt,
      cashier: invoice.createdByName,
      subtotal: invoice.subtotal,
      lines: invoice.lines,
      sale,
      invoice,
    })
  }

  for (const sale of sales) {
    if (!isPrintableSale(sale)) continue

    const latestInvoice = (invoicesBySaleId.get(sale.id) ?? [])[0]
    const documentNumber = latestInvoice?.invoiceNumber ?? formatSaleReferenceNumber(sale.id)

    rows.push({
      id: `${sale.id}:official_receipt`,
      documentType: 'official_receipt',
      documentNumber,
      saleId: sale.id,
      date: sale.createdAt,
      cashier: sale.createdByName,
      subtotal: sale.subtotal,
      lines: sale.lines,
      sale,
      invoice: latestInvoice,
    })

    rows.push({
      id: `${sale.id}:acknowledgement_receipt`,
      documentType: 'acknowledgement_receipt',
      documentNumber,
      saleId: sale.id,
      date: sale.createdAt,
      cashier: sale.createdByName,
      subtotal: sale.subtotal,
      lines: sale.lines,
      sale,
      invoice: latestInvoice,
    })
  }

  return rows.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getDocumentTypeLabel(documentType: PrintDocumentType): string {
  switch (documentType) {
    case 'official_receipt':
      return 'Official Receipt'
    case 'acknowledgement_receipt':
      return 'Acknowledgement'
    default:
      return 'Invoice'
  }
}
