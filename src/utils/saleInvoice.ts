import { jsPDF } from 'jspdf'
import type { AppSettings, Invoice, SaleLine } from '../db/types'

const PAGE_WIDTH_MM = 80
const MARGIN_MM = 6
const CONTENT_LEFT_MM = MARGIN_MM
const CONTENT_RIGHT_MM = PAGE_WIDTH_MM - MARGIN_MM
const CONTENT_WIDTH_MM = CONTENT_RIGHT_MM - CONTENT_LEFT_MM
const CENTER_X_MM = PAGE_WIDTH_MM / 2
const LINE_HEIGHT_MM = 4
const FONT_SIZE = 8
const VALUE_COLUMN_WIDTH_MM = 28

const amountFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export type InvoicePrintSettings = Pick<
  AppSettings,
  | 'receiptMainText'
  | 'receiptAddress'
  | 'receiptContactNumber'
  | 'receiptTin'
  | 'receiptBottomText'
>

function formatInvoiceAmount(value: number): string {
  return `PHP ${amountFormatter.format(value)}`
}

function formatInvoiceDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatLineLabel(line: SaleLine): string {
  const name = line.variantName
    ? `${line.productName} (${line.variantName})`
    : line.productName

  return `${name} x${line.quantity}`
}

export function printInvoice(invoice: Invoice, settings: InvoicePrintSettings): void {
  const headerLines =
    Number(Boolean(settings.receiptMainText.trim())) +
    (settings.receiptAddress.trim() ? 2 : 0) +
    (settings.receiptContactNumber.trim() ? 2 : 0) +
    (settings.receiptTin.trim() ? 2 : 0)
  const pageHeightMm = Math.max(120, 60 + invoice.lines.length * 10 + headerLines * LINE_HEIGHT_MM)

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH_MM, pageHeightMm],
    putOnlyUsedFonts: true,
  })

  let y = MARGIN_MM

  function setStyle(fontSize = FONT_SIZE, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
  }

  function addCenteredBlock(text: string, fontSize = FONT_SIZE, bold = false) {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }

    setStyle(fontSize, bold)
    const lines = doc.splitTextToSize(trimmed, CONTENT_WIDTH_MM) as string[]
    for (const line of lines) {
      doc.text(line, CENTER_X_MM, y, { align: 'center', baseline: 'top' })
      y += LINE_HEIGHT_MM
    }
  }

  function addLeft(text: string, maxWidthMm = CONTENT_WIDTH_MM) {
    setStyle()
    const lines = doc.splitTextToSize(text, maxWidthMm) as string[]
    for (const line of lines) {
      doc.text(line, CONTENT_LEFT_MM, y, { align: 'left', baseline: 'top' })
      y += LINE_HEIGHT_MM
    }
  }

  function addRight(text: string) {
    setStyle()
    doc.text(text, CONTENT_RIGHT_MM, y, { align: 'right', baseline: 'top' })
    y += LINE_HEIGHT_MM
  }

  function addRow(label: string, value: string, bold = false) {
    setStyle(FONT_SIZE, bold)
    const labelMaxWidth = CONTENT_WIDTH_MM - VALUE_COLUMN_WIDTH_MM
    const labelLines = doc.splitTextToSize(label, labelMaxWidth) as string[]
    const rowLineCount = Math.max(labelLines.length, 1)
    const rowStartY = y

    labelLines.forEach((line, index) => {
      doc.text(line, CONTENT_LEFT_MM, rowStartY + index * LINE_HEIGHT_MM, {
        align: 'left',
        baseline: 'top',
      })
    })

    doc.text(value, CONTENT_RIGHT_MM, rowStartY, {
      align: 'right',
      baseline: 'top',
    })

    y = rowStartY + rowLineCount * LINE_HEIGHT_MM
  }

  function addDivider() {
    y += 1
    doc.setLineWidth(0.2)
    doc.line(CONTENT_LEFT_MM, y, CONTENT_RIGHT_MM, y)
    y += LINE_HEIGHT_MM
  }

  addCenteredBlock(settings.receiptMainText, 11, true)
  addCenteredBlock(settings.receiptAddress)
  addCenteredBlock(settings.receiptContactNumber)
  if (settings.receiptTin.trim()) {
    addCenteredBlock(`TIN: ${settings.receiptTin.trim()}`)
  }
  y += 2
  addRow('Date', formatInvoiceDate(invoice.createdAt))
  addRow('Cashier', invoice.createdByName)
  addRow('Invoice no.', invoice.invoiceNumber)
  addDivider()

  for (const line of invoice.lines) {
    addLeft(formatLineLabel(line), CONTENT_WIDTH_MM - VALUE_COLUMN_WIDTH_MM)
    addRight(formatInvoiceAmount(line.lineTotal))
  }

  addDivider()
  addRow('Net amount', formatInvoiceAmount(invoice.netAmount))
  addRow(`VAT (${invoice.vatPercentage}%)`, formatInvoiceAmount(invoice.vatAmount))
  addRow('Total', formatInvoiceAmount(invoice.subtotal), true)
  y += 1
  addRow('Total paid', formatInvoiceAmount(invoice.amountPaid), true)
  addRow('Change', formatInvoiceAmount(invoice.change))
  y += 2
  addCenteredBlock(settings.receiptBottomText)

  doc.autoPrint()
  const blobUrl = doc.output('bloburl')
  const printWindow = window.open(blobUrl, '_blank')

  if (!printWindow) {
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
  }
}
