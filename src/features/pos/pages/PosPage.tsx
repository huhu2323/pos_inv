import { Alert, Box, Divider, Paper, Snackbar } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PosCartPanel } from '@/features/pos/components/PosCartPanel'
import { PosHeader } from '@/features/pos/components/PosHeader'
import { PosPaymentPanel } from '@/features/pos/components/PosPaymentPanel'
import { PosProductGrid } from '@/features/pos/components/PosProductGrid'
import { usePosCart } from '@/features/pos/hooks/usePosCart'
import { buildSellableItems, type PosSellableItem } from '@/features/pos/utils/posProducts'
import { printInvoice } from '@/features/invoices/utils/printInvoice'
import type { Product } from '@/lib/db/types'
import { getOrCreateInvoiceForSale } from '@/lib/services/invoiceService'
import { listActiveProducts } from '@/lib/services/productService'
import { getSettings } from '@/lib/services/settingsService'
import { createSale } from '@/lib/services/saleService'

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
      <PosHeader user={user} onExit={() => navigate('/dashboard')} />

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
        <PosProductGrid
          loading={loading}
          sellableItems={sellableItems}
          products={products}
          continuousBarcodeScanning={continuousBarcodeScanning}
          searchOpen={searchOpen}
          barcodeOpen={barcodeOpen}
          onSearchOpen={() => setSearchOpen(true)}
          onSearchClose={() => setSearchOpen(false)}
          onBarcodeOpen={() => setBarcodeOpen(true)}
          onBarcodeClose={() => setBarcodeOpen(false)}
          onItemClick={handleSellableClick}
          onSearchSelect={handleSearchSelect}
          onBarcodeSelect={handleSellableClick}
        />

        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <PosCartPanel
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveLine={removeLine}
            onClearCart={clearCart}
          />

          <Divider sx={{ mb: 2 }} />

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
