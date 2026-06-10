import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { PosBarcodeDialog } from '../components/pos/PosBarcodeDialog'
import { PosSearchDialog } from '../components/pos/PosSearchDialog'
import { StoredImage } from '../components/StoredImage'
import type { Product, ProductVariant } from '../db/types'
import { listActiveProducts } from '../services/productService'
import { getOrCreateInvoiceForSale } from '../services/invoiceService'
import { getSettings } from '../services/settingsService'
import { createSale } from '../services/saleService'
import { printInvoice } from '../utils/saleInvoice'
import { formatCurrency } from '../utils/currency'
import {
  buildSellableItems,
  type PosSellableItem,
} from '../utils/posProducts'

type CartLine = {
  lineId: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
}

function lineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'] as const
const PH_BILLS = [20, 50, 100, 500, 1000] as const

const touchButtonSx = {
  minHeight: 56,
  fontSize: '1.25rem',
  fontWeight: 700,
} as const

const touchIconButtonSx = {
  width: 52,
  height: 52,
  borderRadius: 2,
  border: 1,
  borderColor: 'divider',
} as const

export function PosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [amountPaid, setAmountPaid] = useState('')
  const [saleComplete, setSaleComplete] = useState(false)
  const [completingSale, setCompletingSale] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [continuousBarcodeScanning, setContinuousBarcodeScanning] = useState(false)
  const cartEndRef = useRef<HTMLDivElement>(null)

  const sellableItems = useMemo(() => buildSellableItems(products), [products])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [items, settings] = await Promise.all([listActiveProducts(), getSettings()])
        if (active) {
          setProducts(items)
          setContinuousBarcodeScanning(settings.continuousBarcodeScanning)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load products')
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

  useEffect(() => {
    if (cart.length === 0) {
      return
    }

    cartEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [cart])

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  )

  const paidAmount = useMemo(() => {
    const parsed = Number.parseFloat(amountPaid)
    return Number.isFinite(parsed) ? parsed : 0
  }, [amountPaid])

  const change = paidAmount - total
  const canComplete = cart.length > 0 && paidAmount >= total

  function addToCart(
    product: Product,
    unitPrice: number,
    variant?: ProductVariant,
  ) {
    const key = lineKey(product.id, variant?.id)

    setCart((current) => {
      const existing = current.find(
        (line) => lineKey(line.productId, line.variantId) === key,
      )

      if (existing) {
        return current.map((line) =>
          line.lineId === existing.lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }

      return [
        ...current,
        {
          lineId: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPrice,
          quantity: 1,
        },
      ]
    })
  }

  function handleSellableClick(item: PosSellableItem) {
    addToCart(item.product, item.price, item.variant)
  }

  function handleSearchSelect(item: PosSellableItem) {
    handleSellableClick(item)
    setSearchOpen(false)
  }

  function handleBarcodeSelect(item: PosSellableItem) {
    handleSellableClick(item)
  }

  function updateQuantity(lineId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  function removeLine(lineId: string) {
    setCart((current) => current.filter((line) => line.lineId !== lineId))
  }

  function clearCart() {
    setCart([])
    setAmountPaid('')
  }

  function handleNumpad(key: (typeof NUMPAD_KEYS)[number]) {
    if (key === 'C') {
      setAmountPaid('')
      return
    }

    if (key === '.') {
      if (amountPaid.includes('.')) {
        return
      }
      setAmountPaid((current) => (current === '' ? '0.' : `${current}.`))
      return
    }

    setAmountPaid((current) => {
      if (current === '0') {
        return key
      }

      const next = `${current}${key}`
      const [, decimals] = next.split('.')

      if (decimals && decimals.length > 2) {
        return current
      }

      return next
    })
  }

  function handleBackspace() {
    setAmountPaid((current) => current.slice(0, -1))
  }

  function handleAddBill(bill: number) {
    setAmountPaid((current) => {
      const parsed = current === '' ? 0 : Number.parseFloat(current)
      const base = Number.isFinite(parsed) ? parsed : 0
      const next = base + bill
      return Number.isInteger(next) ? String(next) : next.toFixed(2)
    })
  }

  async function reloadProducts() {
    const items = await listActiveProducts()
    setProducts(items)
  }

  async function handleCompleteSale() {
    if (!canComplete || !user || completingSale) {
      return
    }

    setCompletingSale(true)
    setError(null)

    try {
      const sale = await createSale(
        {
          lines: cart.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          amountPaid: paidAmount,
        },
        user,
      )

      const settings = await getSettings()
      if (settings.autoInvoice) {
        const invoice = await getOrCreateInvoiceForSale(sale)
        printInvoice(invoice, settings)
      }

      clearCart()
      setSaleComplete(true)
      await reloadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sale')
    } finally {
      setCompletingSale(false)
    }
  }

  function handleExit() {
    navigate('/dashboard')
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <PointOfSaleIcon />
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              POS Terminal
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {user?.displayName} · {user?.role}
            </Typography>
          </Box>
        </Stack>

        <Button
          color="inherit"
          variant="outlined"
          size="large"
          startIcon={<CloseIcon />}
          onClick={handleExit}
          sx={{ borderColor: 'rgba(255,255,255,0.5)', minHeight: 48, px: 2.5 }}
        >
          Exit
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr minmax(400px, 44%)' },
          gap: 2,
          p: { xs: 2, md: 3 },
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Paper
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, minHeight: 0 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h6">Products</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<SearchIcon />}
                onClick={() => setSearchOpen(true)}
                sx={{ minHeight: 48 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setBarcodeOpen(true)}
                sx={{ minHeight: 48 }}
              >
                Barcode
              </Button>
            </Stack>
          </Stack>

          {loading ? (
            <Typography color="text.secondary">Loading products...</Typography>
          ) : sellableItems.length === 0 ? (
            <Typography color="text.secondary">
              No active products available. Activate products in the Products page.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 2,
              }}
            >
              {sellableItems.map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  onClick={() => handleSellableClick(item)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    p: 2,
                    minHeight: { xs: 160, md: 190 },
                    justifyContent: 'flex-start',
                    gap: 1.25,
                  }}
                >
                  <StoredImage
                    image={item.image}
                    alt={item.label}
                    variant="rounded"
                    sx={{
                      width: { xs: 72, md: 88 },
                      height: { xs: 72, md: 88 },
                      alignSelf: 'center',
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}
                    noWrap
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                  >
                    {formatCurrency(item.price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Qty: {item.qty}
                  </Typography>
                </Button>
              ))}
            </Box>
          )}
          </Box>

          <PosSearchDialog
            open={searchOpen}
            items={sellableItems}
            onClose={() => setSearchOpen(false)}
            onSelectItem={handleSearchSelect}
          />

          <PosBarcodeDialog
            open={barcodeOpen}
            products={products}
            continuousBarcodeScanning={continuousBarcodeScanning}
            onClose={() => setBarcodeOpen(false)}
            onSelectItem={handleBarcodeSelect}
          />
        </Paper>

        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography variant="h6">Current order</Typography>
            <Button
              size="large"
              color="inherit"
              variant="outlined"
              disabled={cart.length === 0}
              onClick={clearCart}
              sx={{ minHeight: 48, px: 2.5 }}
            >
              Clear
            </Button>
          </Stack>

          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 120, mb: 2 }}>
            {cart.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                Tap a product to add it to the order.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {cart.map((line) => (
                  <Box
                    key={line.lineId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, fontSize: '1.05rem' }}
                        noWrap
                      >
                        {line.productName}
                        {line.variantName ? ` (${line.variantName})` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(line.unitPrice)} each
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <IconButton
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(line.lineId, -1)}
                        sx={touchIconButtonSx}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography
                        variant="h6"
                        sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}
                      >
                        {line.quantity}
                      </Typography>
                      <IconButton
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(line.lineId, 1)}
                        sx={touchIconButtonSx}
                      >
                        <AddIcon />
                      </IconButton>
                    </Stack>
                    <Typography
                      variant="subtitle1"
                      sx={{ minWidth: 88, textAlign: 'right', fontWeight: 700 }}
                    >
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </Typography>
                    <IconButton
                      color="error"
                      aria-label="Remove item"
                      onClick={() => removeLine(line.lineId)}
                      sx={{
                        ...touchIconButtonSx,
                        borderColor: 'error.light',
                      }}
                    >
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </Box>
                ))}
                <Box ref={cartEndRef} />
              </Stack>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                {formatCurrency(total)}
              </Typography>
            </Stack>

            <Box>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Amount paid
                </Typography>
                <IconButton aria-label="Backspace" onClick={handleBackspace} sx={touchIconButtonSx}>
                  <DeleteOutlinedIcon />
                </IconButton>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 2,
                  mb: 1.5,
                  textAlign: 'right',
                  fontSize: { xs: '1.75rem', md: '2rem' },
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {amountPaid === '' ? formatCurrency(0) : `₱${amountPaid}`}
              </Paper>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Quick bills
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {PH_BILLS.map((bill) => (
                  <Button
                    key={bill}
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleAddBill(bill)}
                    sx={{
                      ...touchButtonSx,
                      minHeight: 52,
                      fontSize: '1rem',
                      px: 0.5,
                    }}
                  >
                    ₱{bill}
                  </Button>
                ))}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                }}
              >
                {NUMPAD_KEYS.map((key) => (
                  <Button
                    key={key}
                    variant={key === 'C' ? 'outlined' : 'contained'}
                    color={key === 'C' ? 'inherit' : 'primary'}
                    onClick={() => handleNumpad(key)}
                    sx={touchButtonSx}
                  >
                    {key}
                  </Button>
                ))}
              </Box>
            </Box>

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Change
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '2.5rem' } }}
                color={change < 0 ? 'error.main' : 'success.main'}
              >
                {change < 0 ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(change)}
              </Typography>
            </Stack>

            {cart.length > 0 && paidAmount < total && paidAmount > 0 && (
              <Typography variant="caption" color="error.main">
                Short by {formatCurrency(total - paidAmount)}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              disabled={!canComplete || completingSale}
              onClick={() => void handleCompleteSale()}
              sx={{ mt: 1, minHeight: 64, fontSize: '1.2rem', fontWeight: 700 }}
            >
              {completingSale ? 'Completing...' : 'Complete sale'}
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={saleComplete}
        autoHideDuration={3000}
        onClose={() => setSaleComplete(false)}
        message="Sale completed"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
