import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { Invoice } from '../db/types'
import { listInvoices } from '../services/invoiceService'
import { getSettings } from '../services/settingsService'
import { formatCurrency } from '../utils/currency'
import { printInvoice } from '../utils/saleInvoice'

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatItemsSummary(invoice: Invoice): string {
  if (invoice.lines.length === 0) {
    return '—'
  }

  const first = invoice.lines[0]
  const firstLabel = first.variantName
    ? `${first.productName} (${first.variantName})`
    : first.productName

  if (invoice.lines.length === 1) {
    return `${firstLabel} × ${first.quantity}`
  }

  return `${firstLabel} + ${invoice.lines.length - 1} more`
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const items = await listInvoices()
        if (active) {
          setInvoices(items)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load invoices')
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

  async function handlePrint(invoice: Invoice) {
    setError(null)

    try {
      const settings = await getSettings()
      printInvoice(invoice, settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print invoice')
    }
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">Invoices</Typography>
        <Typography color="text.secondary">
          Saved sales invoices with sequential invoice numbers. Invoices are created from sales or
          automatically when auto-invoice is enabled.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice no.</TableCell>
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
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">Loading invoices...</Typography>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">
                    No invoices yet. Create one from a sale or enable auto-invoice in Settings.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>{invoice.createdByName}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatItemsSummary(invoice)}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(invoice.subtotal)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void handlePrint(invoice)}
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
