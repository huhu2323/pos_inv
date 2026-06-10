import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import type { Product } from '../db/types'
import type { ProductInput } from '../services/productService'
import { toSnakeCase } from '../utils/snakeCase'
import { ImageUploadField } from './ImageUploadField'
import { VariantEditor } from './VariantEditor'

interface ProductFormDialogProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (input: ProductInput) => Promise<void>
}

interface ProductFormContentProps {
  product: Product | null
  onClose: () => void
  onSave: (input: ProductInput) => Promise<void>
}

function ProductFormContent({ product, onClose, onSave }: ProductFormContentProps) {
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [shortName, setShortName] = useState(product?.shortName ?? '')
  const [defaultPrice, setDefaultPrice] = useState(String(product?.defaultPrice ?? 0))
  const [qty, setQty] = useState(String(product?.qty ?? 0))
  const [image, setImage] = useState(product?.image ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [variants, setVariants] = useState(product?.variants ?? [])
  const [shortNameEdited, setShortNameEdited] = useState(Boolean(product))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!shortNameEdited) {
      setShortName(toSnakeCase(value))
    }
  }

  async function handleSubmit() {
    setError(null)

    const parsedDefaultPrice = Number(defaultPrice)
    if (Number.isNaN(parsedDefaultPrice)) {
      setError('Default price must be a valid number')
      return
    }

    const parsedQty = Number(qty)
    if (Number.isNaN(parsedQty) || parsedQty < 0 || !Number.isInteger(parsedQty)) {
      setError('Quantity must be a whole number zero or greater')
      return
    }

    const invalidVariant = variants.find(
      (variant) => !variant.name.trim() || variant.price < 0,
    )
    if (invalidVariant) {
      setError('Each variant needs a name and a valid price')
      return
    }

    setSubmitting(true)

    try {
      await onSave({
        barcode,
        name,
        shortName,
        defaultPrice: parsedDefaultPrice,
        qty: parsedQty,
        image,
        description,
        variants: variants.map((variant) => ({
          ...variant,
          name: variant.name.trim(),
        })),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <ImageUploadField
            label="Default product image"
            value={image}
            onChange={setImage}
          />

          <TextField
            label="Barcode"
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            required
            fullWidth
            autoFocus
            helperText="Unique product barcode for scanning"
          />
          <TextField
            label="Name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Short name"
            value={shortName}
            onChange={(event) => {
              setShortNameEdited(true)
              setShortName(event.target.value)
            }}
            required
            fullWidth
            helperText="Auto-generated from name as snake_case, but editable"
          />
          <TextField
            label="Default price"
            type="number"
            value={defaultPrice}
            onChange={(event) => setDefaultPrice(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            required
            fullWidth
            helperText="Base price used when no variant is selected"
          />
          <TextField
            label="Quantity"
            type="number"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            required
            fullWidth
            helperText="Starting stock for the base product (use Inventory to adjust later)"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={4}
            fullWidth
          />

          <VariantEditor variants={variants} onChange={setVariants} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Saving...' : product ? 'Save changes' : 'Create product'}
        </Button>
      </DialogActions>
    </>
  )
}

export function ProductFormDialog({
  open,
  product,
  onClose,
  onSave,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle>
      {open && (
        <ProductFormContent
          key={product?.id ?? 'create'}
          product={product}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}
