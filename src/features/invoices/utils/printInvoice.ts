import { jsPDF } from 'jspdf'
import type { AppSettings, Invoice, PrintDocumentType, Sale, SaleLine } from '@/lib/db/types'
import { getOrCreateInvoiceForSale } from '@/lib/services/invoiceService'
import { calculateVatBreakdown } from '@/shared/utils/vat'

const PAGE_WIDTH_MM = 80
const MARGIN_MM = 6
const CONTENT_LEFT_MM = MARGIN_MM
const CONTENT_RIGHT_MM = PAGE_WIDTH_MM - MARGIN_MM
const CONTENT_WIDTH_MM = CONTENT_RIGHT_MM - CONTENT_LEFT_MM
const CENTER_X_MM = PAGE_WIDTH_MM / 2
const LINE_HEIGHT_MM = 4
const FONT_SIZE = 8
const DOCUMENT_TITLE_FONT_SIZE = 9
const STORE_NAME_FONT_SIZE = 11
const VALUE_COLUMN_WIDTH_MM = 28

const ACKNOWLEDGEMENT_RECEIPT_FOOTER = 'THIS IS NOT OFFICIAL RECEIPT'

const amountFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export type PrintableDocument = Pick<
  Invoice,
  | 'lines'
  | 'subtotal'
  | 'amountPaid'
  | 'change'
  | 'vatPercentage'
  | 'netAmount'
  | 'vatAmount'
  | 'createdByName'
  | 'createdAt'
> & {
  documentNumber: string
}

type DocumentHeaderSettings = Pick<
  AppSettings,
  | 'receiptMainText'
  | 'receiptAddress'
  | 'receiptContactNumber'
  | 'receiptTin'
  | 'receiptBottomText'
  | 'officialReceiptMainText'
  | 'officialReceiptAddress'
  | 'officialReceiptContactNumber'
  | 'officialReceiptTin'
  | 'officialReceiptBottomText'
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

function getHeaderSettings(
  settings: DocumentHeaderSettings,
  documentType: PrintDocumentType,
): Pick<
  AppSettings,
  'receiptMainText' | 'receiptAddress' | 'receiptContactNumber' | 'receiptTin' | 'receiptBottomText'
> {
  if (documentType === 'official_receipt') {
    return {
      receiptMainText: settings.officialReceiptMainText,
      receiptAddress: settings.officialReceiptAddress,
      receiptContactNumber: settings.officialReceiptContactNumber,
      receiptTin: settings.officialReceiptTin,
      receiptBottomText: settings.officialReceiptBottomText,
    }
  }

  return {
    receiptMainText: settings.receiptMainText,
    receiptAddress: settings.receiptAddress,
    receiptContactNumber: settings.receiptContactNumber,
    receiptTin: settings.receiptTin,
    receiptBottomText: settings.receiptBottomText,
  }
}

function getDocumentTitle(documentType: PrintDocumentType): string {
  switch (documentType) {
    case 'official_receipt':
      return 'Official Receipt'
    case 'acknowledgement_receipt':
      return 'Acknowledgement Receipt'
    default:
      return 'Invoice'
  }
}

function getDocumentNumberLabel(documentType: PrintDocumentType): string {
  switch (documentType) {
    case 'official_receipt':
      return 'OR no.'
    case 'acknowledgement_receipt':
      return 'Ref no.'
    default:
      return 'Invoice no.'
  }
}

function getBottomText(
  settings: DocumentHeaderSettings,
  documentType: PrintDocumentType,
): string {
  if (documentType === 'acknowledgement_receipt') {
    return ACKNOWLEDGEMENT_RECEIPT_FOOTER
  }

  return getHeaderSettings(settings, documentType).receiptBottomText
}

function getPdfFilename(document: PrintableDocument, documentType: PrintDocumentType): string {
  switch (documentType) {
    case 'official_receipt':
      return `official-receipt-${document.documentNumber}.pdf`
    case 'acknowledgement_receipt':
      return `acknowledgement-receipt-${document.documentNumber}.pdf`
    default:
      return `invoice-${document.documentNumber}.pdf`
  }
}

export function buildPrintableDocumentFromSale(
  sale: Sale,
  settings: Pick<AppSettings, 'vatPercentage'>,
  documentNumber: string,
): PrintableDocument {
  const vat = calculateVatBreakdown(sale.subtotal, settings.vatPercentage)

  return {
    documentNumber,
    lines: sale.lines,
    subtotal: sale.subtotal,
    amountPaid: sale.amountPaid,
    change: sale.change,
    vatPercentage: settings.vatPercentage,
    netAmount: vat.netAmount,
    vatAmount: vat.vatAmount,
    createdByName: sale.createdByName,
    createdAt: sale.createdAt,
  }
}

export function buildPrintableDocumentFromInvoice(invoice: Invoice): PrintableDocument {
  return {
    documentNumber: invoice.invoiceNumber,
    lines: invoice.lines,
    subtotal: invoice.subtotal,
    amountPaid: invoice.amountPaid,
    change: invoice.change,
    vatPercentage: invoice.vatPercentage,
    netAmount: invoice.netAmount,
    vatAmount: invoice.vatAmount,
    createdByName: invoice.createdByName,
    createdAt: invoice.createdAt,
  }
}

export function printSaleDocument(
  document: PrintableDocument,
  settings: DocumentHeaderSettings,
  documentType: PrintDocumentType,
): void {
  const headerSettings = getHeaderSettings(settings, documentType)
  const headerLines =
    2 +
    Number(Boolean(headerSettings.receiptMainText.trim())) +
    (headerSettings.receiptAddress.trim() ? 2 : 0) +
    (headerSettings.receiptContactNumber.trim() ? 2 : 0) +
    (headerSettings.receiptTin.trim() ? 2 : 0)
  const pageHeightMm = Math.max(
    120,
    60 + document.lines.length * 10 + headerLines * LINE_HEIGHT_MM,
  )

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

  addCenteredBlock(getDocumentTitle(documentType), DOCUMENT_TITLE_FONT_SIZE, true)
  y += 3
  addCenteredBlock(headerSettings.receiptMainText, STORE_NAME_FONT_SIZE, true)
  addCenteredBlock(headerSettings.receiptAddress)
  addCenteredBlock(headerSettings.receiptContactNumber)
  if (headerSettings.receiptTin.trim()) {
    addCenteredBlock(`TIN: ${headerSettings.receiptTin.trim()}`)
  }
  y += 2
  addRow('Date', formatInvoiceDate(document.createdAt))
  addRow('Cashier', document.createdByName)
  addRow(getDocumentNumberLabel(documentType), document.documentNumber)
  addDivider()

  for (const line of document.lines) {
    addLeft(formatLineLabel(line), CONTENT_WIDTH_MM - VALUE_COLUMN_WIDTH_MM)
    addRight(formatInvoiceAmount(line.lineTotal))
  }

  addDivider()
  addRow('Net amount', formatInvoiceAmount(document.netAmount))
  addRow(`VAT (${document.vatPercentage}%)`, formatInvoiceAmount(document.vatAmount))
  addRow('Total', formatInvoiceAmount(document.subtotal), true)
  y += 1
  addRow('Total paid', formatInvoiceAmount(document.amountPaid), true)
  addRow('Change', formatInvoiceAmount(document.change))
  y += 2
  addCenteredBlock(getBottomText(settings, documentType))

  doc.autoPrint()
  const blobUrl = doc.output('bloburl')
  const printWindow = window.open(blobUrl, '_blank')

  if (!printWindow) {
    doc.save(getPdfFilename(document, documentType))
  }
}

export function printInvoice(invoice: Invoice, settings: DocumentHeaderSettings): void {
  printSaleDocument(buildPrintableDocumentFromInvoice(invoice), settings, 'invoice')
}

export function printOfficialReceipt(
  document: PrintableDocument,
  settings: DocumentHeaderSettings,
): void {
  printSaleDocument(document, settings, 'official_receipt')
}

export function printAcknowledgementReceipt(
  document: PrintableDocument,
  settings: DocumentHeaderSettings,
): void {
  printSaleDocument(document, settings, 'acknowledgement_receipt')
}

function formatSaleReferenceNumber(sale: Sale): string {
  return sale.id.slice(0, 8).toUpperCase()
}

export async function autoPrintForCompletedSale(
  sale: Sale,
  settings: AppSettings,
): Promise<void> {
  switch (settings.autoPrint) {
    case 'off':
      return
    case 'invoice': {
      const invoice = await getOrCreateInvoiceForSale(sale)
      printInvoice(invoice, settings)
      return
    }
    case 'official_receipt': {
      const document = buildPrintableDocumentFromSale(
        sale,
        settings,
        formatSaleReferenceNumber(sale),
      )
      printOfficialReceipt(document, settings)
      return
    }
    case 'acknowledgement_receipt': {
      const document = buildPrintableDocumentFromSale(
        sale,
        settings,
        formatSaleReferenceNumber(sale),
      )
      printAcknowledgementReceipt(document, settings)
      return
    }
  }
}

export async function printSaleDocumentType(
  sale: Sale,
  settings: AppSettings,
  documentType: PrintDocumentType,
  invoice?: Invoice,
): Promise<void> {
  if (documentType === 'invoice') {
    const resolvedInvoice = invoice ?? (await getOrCreateInvoiceForSale(sale))
    printInvoice(resolvedInvoice, settings)
    return
  }

  const documentNumber = invoice?.invoiceNumber ?? formatSaleReferenceNumber(sale)
  const document = buildPrintableDocumentFromSale(sale, settings, documentNumber)

  if (documentType === 'official_receipt') {
    printOfficialReceipt(document, settings)
    return
  }

  printAcknowledgementReceipt(document, settings)
}
