import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { InventoryMovementType, Product } from '@/lib/db/types'
import type { InventoryCreateInput } from '@/lib/services/inventoryService'

interface InventoryFormDialogProps {
  open: boolean
  products: Product[]
  onClose: () => void
  onSave: (input: InventoryCreateInput) => Promise<void>
}

interface InventoryFormContentProps {
  products: Product[]
  onClose: () => void
  onSave: (input: InventoryCreateInput) => Promise<void>
}

const PRODUCT_LEVEL = ''

function InventoryFormContent({ products, onClose, onSave }: InventoryFormContentProps) {
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState(PRODUCT_LEVEL)
  const [type, setType] = useState<InventoryMovementType>('inbound')
  const [qty, setQty] = useState('1')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedProduct = products.find((product) => product.id === productId)

  const beforeQty = useMemo(() => {
    if (!selectedProduct) {
      return 0
    }

    if (variantId) {
      return selectedProduct.variants.find((variant) => variant.id === variantId)?.qty ?? 0
    }

    return selectedProduct.qty
  }, [selectedProduct, variantId])

  const parsedQty = Number(qty)
  const afterQty =
    type === 'inbound' ? beforeQty + (Number.isNaN(parsedQty) ? 0 : parsedQty) : beforeQty - (Number.isNaN(parsedQty) ? 0 : parsedQty)

  const outboundBlocked = type === 'outbound' && beforeQty <= 0

  function handleProductChange(nextProductId: string) {
    setProductId(nextProductId)
    setVariantId(PRODUCT_LEVEL)
  }

  async function handleSubmit() {
    setError(null)

    if (!productId) {
      setError('Product is required')
      return
    }

    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be a whole number greater than zero')
      return
    }

    if (type === 'outbound' && beforeQty <= 0) {
      setError('Cannot outbound stock when quantity is zero')
      return
    }

    if (type === 'outbound' && parsedQty > beforeQty) {
      setError(`Cannot outbound more than available stock (${beforeQty})`)
      return
    }

    setSubmitting(true)

    try {
      await onSave({
        productId,
        variantId: variantId || undefined,
        type,
        qty: parsedQty,
        reference,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory log')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth required>
            <InputLabel id="inventory-product-label">Product</InputLabel>
            <Select
              labelId="inventory-product-label"
              label="Product"
              value={productId}
              onChange={(event) => handleProductChange(event.target.value)}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedProduct}>
            <InputLabel id="inventory-variant-label">Target</InputLabel>
            <Select
              labelId="inventory-variant-label"
              label="Target"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
            >
              <MenuItem value={PRODUCT_LEVEL}>Product (base stock)</MenuItem>
              {selectedProduct?.variants.map((variant) => (
                <MenuItem key={variant.id} value={variant.id}>
                  {variant.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Type</FormLabel>
            <RadioGroup
              row
              value={type}
              onChange={(event) => setType(event.target.value as InventoryMovementType)}
            >
              <FormControlLabel
                value="inbound"
                control={<Radio color="success" />}
                label="Inbound"
              />
              <FormControlLabel
                value="outbound"
                control={<Radio color="error" />}
                label="Outbound"
              />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Quantity"
            type="number"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            required
            fullWidth
          />

          <TextField
            label="Reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            helperText="Note for this delivery, removal, or stock adjustment"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Before qty"
              value={selectedProduct ? beforeQty : ''}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="After qty"
              value={selectedProduct ? afterQty : ''}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
              sx={{
                '& .MuiInputBase-input': {
                  color: type === 'inbound' ? 'success.main' : 'error.main',
                  fontWeight: 600,
                },
              }}
            />
          </Stack>

          {outboundBlocked && (
            <Typography variant="body2" color="error">
              Current stock is zero. Inbound stock before attempting an outbound movement.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={type === 'inbound' ? 'success' : 'error'}
          onClick={() => void handleSubmit()}
          disabled={submitting || outboundBlocked}
        >
          {submitting ? 'Saving...' : 'Create log'}
        </Button>
      </DialogActions>
    </>
  )
}

export function InventoryFormDialog({
  open,
  products,
  onClose,
  onSave,
}: InventoryFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New inventory log</DialogTitle>
      {open && (
        <InventoryFormContent
          key={products.map((product) => `${product.id}:${product.qty}`).join(',')}
          products={products}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}
