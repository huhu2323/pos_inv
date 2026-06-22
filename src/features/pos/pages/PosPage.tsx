import GridViewIcon from '@mui/icons-material/GridView'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PosBarcodeDialog } from '@/features/pos/components/PosBarcodeDialog'
import { PosCartPanel, PosCartTotals } from '@/features/pos/components/PosCartPanel'
import { PosHeader } from '@/features/pos/components/PosHeader'
import { PosPaymentPanel } from '@/features/pos/components/PosPaymentPanel'
import { PosProductGrid } from '@/features/pos/components/PosProductGrid'
import { PosSearchDialog } from '@/features/pos/components/PosSearchDialog'
import { usePosCart } from '@/features/pos/hooks/usePosCart'
import { buildSellableItems, type PosSellableItem } from '@/features/pos/utils/posProducts'
import { autoPrintForCompletedSale } from '@/features/invoices/utils/printInvoice'
import type { Product } from '@/lib/db/types'
import { listActiveProducts } from '@/lib/services/productService'
import { getSettings } from '@/lib/services/settingsService'
import { createSale } from '@/lib/services/saleService'
import { stitchDesignTokens } from '@/shared/theme/stitchDesignTokens'
import { labelCapsSx } from '@/shared/theme/stitchStyles'

export function PosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saleComplete, setSaleComplete] = useState(false)
  const [completingSale, setCompletingSale] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [continuousBarcodeScanning, setContinuousBarcodeScanning] = useState(false)

  const {
    cart,
    amountPaid,
    setAmountPaid,
    total,
    paidAmount,
    change,
    canComplete,
    addToCart,
    updateQuantity,
    removeLine,
    clearCart,
  } = usePosCart()

  const sellableItems = useMemo(() => buildSellableItems(products), [products])
  const subtotal = total

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

  function handleSellableClick(item: PosSellableItem) {
    addToCart(item.product, item.price, item.variant)
    setBrowseOpen(false)
  }

  function handleSearchSelect(item: PosSellableItem) {
    handleSellableClick(item)
    setSearchOpen(false)
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
      await autoPrintForCompletedSale(sale, settings)

      clearCart()
      setSaleComplete(true)
      await reloadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sale')
    } finally {
      setCompletingSale(false)
    }
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
        overflow: 'hidden',
      }}
    >
      <PosHeader user={user} onExit={() => navigate('/dashboard')} />

      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: cart / browse workspace */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ ...labelCapsSx, color: 'text.secondary', mb: 1 }}>
              Barcode scan
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                placeholder="Scan item or type barcode..."
                onClick={() => setBarcodeOpen(true)}
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCodeScannerIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { minHeight: 48 } }}
              />
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setSearchOpen(true)}
                sx={{ minHeight: 48, whiteSpace: 'nowrap' }}
              >
                Search
              </Button>
              <Button
                variant={browseOpen ? 'contained' : 'outlined'}
                color={browseOpen ? 'primary' : 'inherit'}
                startIcon={<GridViewIcon />}
                onClick={() => setBrowseOpen((v) => !v)}
                sx={{ minHeight: 48, whiteSpace: 'nowrap' }}
              >
                Browse
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={clearCart}
                  sx={{ minHeight: 48, whiteSpace: 'nowrap' }}
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {browseOpen ? (
              <PosProductGrid
                loading={loading}
                sellableItems={sellableItems}
                embedded
                onItemClick={handleSellableClick}
              />
            ) : (
              <PosCartPanel
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveLine={removeLine}
              />
            )}
          </Box>

          {!browseOpen && cart.length > 0 && <PosCartTotals subtotal={subtotal} total={total} />}
        </Box>

        {/* Right: payment panel */}
        <Box
          sx={{
            width: { xs: '100%', md: stitchDesignTokens.layout.cartSummaryWidth },
            maxWidth: stitchDesignTokens.layout.cartSummaryWidth,
            display: { xs: cart.length > 0 ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            bgcolor: 'background.default',
            boxShadow: { md: '-8px 0 24px rgba(4, 27, 60, 0.08)' },
            zIndex: 1,
          }}
        >
          <PosPaymentPanel
            cart={cart}
            total={total}
            amountPaid={amountPaid}
            paidAmount={paidAmount}
            change={change}
            canComplete={canComplete}
            completingSale={completingSale}
            onAmountPaidChange={setAmountPaid}
            onBackspace={() => setAmountPaid((current) => current.slice(0, -1))}
            onCompleteSale={() => void handleCompleteSale()}
          />
        </Box>
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
        onSelectItem={handleSellableClick}
      />

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
