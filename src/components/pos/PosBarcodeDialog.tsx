import CloseIcon from '@mui/icons-material/Close'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Product } from '../../db/types'
import {
  findProductByBarcode,
  toSellableItem,
  type PosSellableItem,
} from '../../utils/posProducts'
import { formatCurrency } from '../../utils/currency'
import { getPosPanelDialogSx, posPanelDialogSlotProps } from './posPanelDialog'

interface PosBarcodeDialogProps {
  open: boolean
  products: Product[]
  continuousBarcodeScanning: boolean
  onClose: () => void
  onSelectItem: (item: PosSellableItem) => void
}

export function PosBarcodeDialog({
  open,
  products,
  continuousBarcodeScanning,
  onClose,
  onSelectItem,
}: PosBarcodeDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!open) {
      setBarcode('')
      setError(null)
      setVariantProduct(null)
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    return () => {
      window.clearTimeout(timer)
    }
  }, [open])

  function focusInput() {
    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  function clearBarcodeField() {
    setBarcode('')
    focusInput()
  }

  function handleClose() {
    setBarcode('')
    setError(null)
    setVariantProduct(null)
    onClose()
  }

  function handleItemSelected(item: PosSellableItem) {
    onSelectItem(item)

    if (!continuousBarcodeScanning) {
      handleClose()
      return
    }

    clearBarcodeField()
    setVariantProduct(null)
    setError(null)
  }

  function handleLookup() {
    const scannedBarcode = barcode.trim()
    clearBarcodeField()

    if (!scannedBarcode) {
      return
    }

    const product = findProductByBarcode(products, scannedBarcode)

    if (!product) {
      setError('No active product found for this barcode')
      setVariantProduct(null)
      return
    }

    setError(null)

    if (product.variants.length > 0) {
      setVariantProduct(product)
      return
    }

    handleItemSelected(toSellableItem(product))
  }

  function handleVariantSelect(variantId: string) {
    if (!variantProduct) {
      return
    }

    const variant = variantProduct.variants.find((item) => item.id === variantId)
    if (!variant) {
      return
    }

    handleItemSelected(toSellableItem(variantProduct, variant))
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleLookup()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disablePortal
      disableScrollLock
      maxWidth="sm"
      fullWidth
      slotProps={posPanelDialogSlotProps}
      sx={getPosPanelDialogSx(480)}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <QrCodeScannerIcon />
          <Typography variant="h6">Barcode scan</Typography>
        </Stack>
        <IconButton aria-label="Close barcode scanner" onClick={handleClose} sx={touchCloseSx}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Scan a barcode or type it manually, then press Enter.
            {continuousBarcodeScanning && ' The scanner stays open for the next item.'}
          </Typography>

          <TextField
            label="Barcode"
            value={barcode}
            onChange={(event) => {
              setBarcode(event.target.value)
              setError(null)
              setVariantProduct(null)
            }}
            onKeyDown={handleKeyDown}
            fullWidth
            autoComplete="off"
            slotProps={{
              htmlInput: {
                ref: inputRef,
                style: { fontFamily: 'monospace', fontSize: '1.25rem' },
              },
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          {variantProduct && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select variant for {variantProduct.name}
              </Typography>
              <Stack spacing={1}>
                {variantProduct.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant="outlined"
                    onClick={() => handleVariantSelect(variant.id)}
                    sx={{ justifyContent: 'space-between', py: 1.5 }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{variant.name}</Typography>
                    <Typography color="primary" sx={{ fontWeight: 700 }}>
                      {formatCurrency(variant.price)}
                    </Typography>
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

const touchCloseSx = {
  width: 48,
  height: 48,
  border: 1,
  borderColor: 'divider',
} as const
