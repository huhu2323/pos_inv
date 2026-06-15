import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { PrintDocumentType, SaleLine } from '@/lib/db/types'
import { createInvoiceForSale, listInvoices } from '@/lib/services/invoiceService'
import { getSettings } from '@/lib/services/settingsService'
import { listSales } from '@/lib/services/saleService'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/formatDate'
import { printInvoice, printSaleDocumentType } from '@/features/invoices/utils/printInvoice'
import {
  buildReceiptRows,
  getDocumentTypeLabel,
  type ReceiptRow,
} from '@/features/receipts/utils/buildReceiptRows'

type TypeFilter = 'all' | PrintDocumentType

function formatItemsSummary(lines: SaleLine[]): string {
  if (lines.length === 0) {
    return '—'
  }

  const first = lines[0]
  const firstLabel = first.variantName
    ? `${first.productName} (${first.variantName})`
    : first.productName

  if (lines.length === 1) {
    return `${firstLabel} × ${first.quantity}`
  }

  return `${firstLabel} + ${lines.length - 1} more`
}

function documentTypeChipColor(
  documentType: PrintDocumentType,
): 'default' | 'primary' | 'success' | 'warning' {
  switch (documentType) {
    case 'official_receipt':
      return 'success'
    case 'acknowledgement_receipt':
      return 'warning'
    default:
      return 'primary'
  }
}

export function ReceiptsPage() {
  const [rows, setRows] = useState<ReceiptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [sales, invoices] = await Promise.all([listSales(), listInvoices()])
        if (active) {
          setRows(buildReceiptRows(sales, invoices))
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load receipts')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    if (typeFilter === 'all') {
      return rows
    }

    return rows.filter((row) => row.documentType === typeFilter)
  }, [rows, typeFilter])

  async function reloadRows() {
    const [sales, invoices] = await Promise.all([listSales(), listInvoices()])
    setRows(buildReceiptRows(sales, invoices))
  }

  async function handlePrint(row: ReceiptRow) {
    setError(null)
    setPrintingId(row.id)

    try {
      const settings = await getSettings()

      if (row.documentType === 'invoice' && row.invoice) {
        printInvoice(row.invoice, settings)
        return
      }

      if (row.documentType === 'invoice') {
        const invoice = await createInvoiceForSale(row.sale)
        printInvoice(invoice, settings)
        await reloadRows()
        return
      }

      await printSaleDocumentType(row.sale, settings, row.documentType, row.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print document')
    } finally {
      setPrintingId(null)
    }
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">Receipts</Typography>
        <Typography color="text.secondary">
          All invoices, official receipts, and acknowledgement receipts in one place. Reprint any
          document from a completed sale.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={typeFilter}
        onChange={(_, value: TypeFilter) => setTypeFilter(value)}
        sx={{ mb: 2 }}
      >
        <Tab label="All" value="all" />
        <Tab label="Invoice" value="invoice" />
        <Tab label="Official Receipt" value="official_receipt" />
        <Tab label="Acknowledgement" value="acknowledgement_receipt" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Document no.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary">Loading receipts...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary">
                    No receipts yet. Complete a sale to generate printable documents.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Chip
                      label={getDocumentTypeLabel(row.documentType)}
                      color={documentTypeChipColor(row.documentType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {row.documentNumber}
                  </TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{row.cashier}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatItemsSummary(row.lines)}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.subtotal)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={printingId === row.id}
                      onClick={() => void handlePrint(row)}
                    >
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
