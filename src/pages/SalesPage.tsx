import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import type { Invoice, Sale } from '../db/types'
import {
  createInvoiceForSale,
  listInvoices,
} from '../services/invoiceService'
import { getSettings, verifyMasterPassword } from '../services/settingsService'
import { listSales, voidSale } from '../services/saleService'
import { formatCurrency } from '../utils/currency'
import { printInvoice } from '../utils/saleInvoice'

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatItemsSummary(sale: Sale, salesById: Map<string, Sale>): string {
  if (sale.type === 'void') {
    const original = sale.originalSaleId ? salesById.get(sale.originalSaleId) : undefined
    const originalDate = original ? formatDate(original.createdAt) : 'original sale'
    return `Restores transaction from ${originalDate}`
  }

  if (sale.lines.length === 0) {
    return '—'
  }

  const first = sale.lines[0]
  const firstLabel = first.variantName
    ? `${first.productName} (${first.variantName})`
    : first.productName

  if (sale.lines.length === 1) {
    return `${firstLabel} × ${first.quantity}`
  }

  return `${firstLabel} + ${sale.lines.length - 1} more`
}

function saleStatusLabel(sale: Sale): string {
  if (sale.type === 'void') {
    return 'Restoration'
  }

  return sale.status === 'voided' ? 'Voided' : 'Completed'
}

function saleStatusColor(sale: Sale): 'error' | 'success' | 'warning' {
  if (sale.type === 'void') {
    return 'warning'
  }

  return sale.status === 'voided' ? 'error' : 'success'
}

function canInvoice(sale: Sale): boolean {
  return sale.type === 'sale' && sale.status === 'completed'
}

function formatInvoicesSummary(invoices: Invoice[]): string {
  if (invoices.length === 0) {
    return '—'
  }

  const latest = invoices[0]
  if (invoices.length === 1) {
    return latest.invoiceNumber
  }

  return `${latest.invoiceNumber} +${invoices.length - 1}`
}

export function SalesPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewTarget, setViewTarget] = useState<Sale | null>(null)
  const [invoicesModalTarget, setInvoicesModalTarget] = useState<Sale | null>(null)
  const [invoiceRegenerateTarget, setInvoiceRegenerateTarget] = useState<Sale | null>(null)
  const [invoicing, setInvoicing] = useState(false)
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null)
  const [voiding, setVoiding] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [voidDialogError, setVoidDialogError] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'
  const requiresMasterPassword = !isAdmin

  const salesById = useMemo(
    () => new Map(sales.map((sale) => [sale.id, sale])),
    [sales],
  )

  const invoicesBySaleId = useMemo(() => {
    const grouped = new Map<string, Invoice[]>()

    for (const invoice of invoices) {
      const existing = grouped.get(invoice.saleId) ?? []
      existing.push(invoice)
      grouped.set(invoice.saleId, existing)
    }

    for (const [saleId, saleInvoices] of grouped) {
      grouped.set(
        saleId,
        saleInvoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      )
    }

    return grouped
  }, [invoices])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [items, invoiceItems] = await Promise.all([listSales(), listInvoices()])
        if (active) {
          setSales(items)
          setInvoices(invoiceItems)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load sales')
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

  async function reloadSales() {
    setLoading(true)
    setError(null)

    try {
      const [items, invoiceItems] = await Promise.all([listSales(), listInvoices()])
      setSales(items)
      setInvoices(invoiceItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  function openVoidDialog(sale: Sale) {
    setVoidTarget(sale)
    setMasterPassword('')
    setVoidDialogError(null)
  }

  function closeVoidDialog() {
    setVoidTarget(null)
    setMasterPassword('')
    setVoidDialogError(null)
  }

  function handleInvoiceClick(sale: Sale) {
    const saleInvoices = invoicesBySaleId.get(sale.id) ?? []
    if (saleInvoices.length > 0) {
      setInvoiceRegenerateTarget(sale)
      return
    }

    void executeInvoice(sale)
  }

  async function executeInvoice(sale: Sale) {
    setError(null)
    setInvoicing(true)

    try {
      const [settings, invoice] = await Promise.all([
        getSettings(),
        createInvoiceForSale(sale),
      ])
      printInvoice(invoice, settings)
      setInvoiceRegenerateTarget(null)
      await reloadSales()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice')
    } finally {
      setInvoicing(false)
    }
  }

  async function handlePrintInvoice(invoice: Invoice) {
    setError(null)

    try {
      const settings = await getSettings()
      printInvoice(invoice, settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print invoice')
    }
  }

  async function handleVoid() {
    if (!voidTarget || !user) {
      return
    }

    setVoiding(true)
    setVoidDialogError(null)

    try {
      if (requiresMasterPassword) {
        if (!masterPassword.trim()) {
          throw new Error('Master password is required')
        }

        const valid = await verifyMasterPassword(masterPassword)
        if (!valid) {
          throw new Error('Incorrect master password')
        }
      }

      await voidSale(voidTarget.id, user)
      closeVoidDialog()
      await reloadSales()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to void sale'
      setVoidDialogError(message)
    } finally {
      setVoiding(false)
    }
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">Sales</Typography>
        <Typography color="text.secondary">
          Completed POS transactions. Sales are created automatically when a register sale is
          completed.
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
              <TableCell>Date</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Change</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Invoiced</TableCell>
              <TableCell>Invoices</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography color="text.secondary">Loading sales...</Typography>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography color="text.secondary">
                    No sales yet. Complete a sale from the POS terminal to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => {
                const saleInvoices = invoicesBySaleId.get(sale.id) ?? []

                return (
                <TableRow
                  key={sale.id}
                  hover
                  sx={(theme) => {
                    if (sale.type === 'void') {
                      return { bgcolor: alpha(theme.palette.warning.main, 0.08) }
                    }

                    if (sale.status === 'voided') {
                      return { bgcolor: alpha(theme.palette.error.main, 0.06) }
                    }

                    return {}
                  }}
                >
                  <TableCell>{formatDate(sale.createdAt)}</TableCell>
                  <TableCell>{sale.createdByName}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatItemsSummary(sale, salesById)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sale.itemCount} item{sale.itemCount === 1 ? '' : 's'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(sale.subtotal)}</TableCell>
                  <TableCell align="right">{formatCurrency(sale.amountPaid)}</TableCell>
                  <TableCell align="right">{formatCurrency(sale.change)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={saleStatusLabel(sale)}
                      color={saleStatusColor(sale)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {canInvoice(sale) ? (
                      <Chip
                        size="small"
                        label={saleInvoices.length > 0 ? 'Yes' : 'No'}
                        color={saleInvoices.length > 0 ? 'success' : 'default'}
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {saleInvoices.length > 0 ? (
                      <Button
                        size="small"
                        variant="text"
                        sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 0, px: 0.5 }}
                        onClick={() => setInvoicesModalTarget(sale)}
                      >
                        {formatInvoicesSummary(saleInvoices)}
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setViewTarget(sale)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!canInvoice(sale) || invoicing}
                        onClick={() => handleInvoiceClick(sale)}
                      >
                        Invoice
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={sale.status === 'voided' || sale.type === 'void'}
                        onClick={() => openVoidDialog(sale)}
                      >
                        Void
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Sale details</DialogTitle>
        <DialogContent>
          {viewTarget && (
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(viewTarget.createdAt)} · {viewTarget.createdByName}
                </Typography>
                <Chip
                  size="small"
                  label={saleStatusLabel(viewTarget)}
                  color={saleStatusColor(viewTarget)}
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start' }}
                />
                {viewTarget.type === 'void' && (
                  <Typography variant="body2" color="text.secondary">
                    {formatItemsSummary(viewTarget, salesById)}
                  </Typography>
                )}
              </Stack>

              {viewTarget.lines.length === 0 ? (
                <Typography color="text.secondary">No line items.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewTarget.lines.map((line, index) => (
                      <TableRow key={`${line.productId}-${line.variantId ?? 'base'}-${index}`}>
                        <TableCell>
                          {line.productName}
                          {line.variantName ? ` (${line.variantName})` : ''}
                        </TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(line.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Stack spacing={0.5} sx={{ pt: 1 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(viewTarget.subtotal)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">Paid</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(viewTarget.amountPaid)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">Change</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(viewTarget.change)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(invoicesModalTarget)}
        onClose={() => setInvoicesModalTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Sale invoices</DialogTitle>
        <DialogContent>
          {invoicesModalTarget && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {formatDate(invoicesModalTarget.createdAt)} · {invoicesModalTarget.createdByName}
              </Typography>

              {(invoicesBySaleId.get(invoicesModalTarget.id) ?? []).length === 0 ? (
                <Typography color="text.secondary">No invoices for this sale.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice no.</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoicesBySaleId.get(invoicesModalTarget.id) ?? []).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell align="right">{formatCurrency(invoice.subtotal)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => void handlePrintInvoice(invoice)}
                          >
                            Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoicesModalTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(invoiceRegenerateTarget)}
        onClose={() => !invoicing && setInvoiceRegenerateTarget(null)}
      >
        <DialogTitle>Regenerate invoice?</DialogTitle>
        <DialogContent>
          {invoiceRegenerateTarget && (
            <DialogContentText>
              This sale already has{' '}
              <strong>
                {(invoicesBySaleId.get(invoiceRegenerateTarget.id) ?? []).length} invoice
                {(invoicesBySaleId.get(invoiceRegenerateTarget.id) ?? []).length === 1
                  ? ''
                  : 's'}
              </strong>
              . Generate a new invoice with the next available number and print it?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceRegenerateTarget(null)} disabled={invoicing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => invoiceRegenerateTarget && void executeInvoice(invoiceRegenerateTarget)}
            disabled={invoicing}
          >
            {invoicing ? 'Generating...' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(voidTarget)} onClose={closeVoidDialog}>
        <DialogTitle>Void sale</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: requiresMasterPassword ? 2 : 0 }}>
            Void this sale for <strong>{formatCurrency(voidTarget?.subtotal ?? 0)}</strong>? A
            restoration record will be created, stock will be returned, and today&apos;s totals
            will be updated.
          </DialogContentText>
          {requiresMasterPassword && (
            <TextField
              label="Master password"
              type="password"
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              fullWidth
              autoFocus
              disabled={voiding}
            />
          )}
          {voidDialogError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {voidDialogError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeVoidDialog} disabled={voiding}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleVoid()}
            disabled={voiding}
          >
            {voiding ? 'Voiding...' : 'Void sale'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
