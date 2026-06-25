import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import type { Product } from '@/lib/db/types'
import type { ProductInput } from '@/lib/services/productService'
import {
  DEFAULT_PRODUCT_UNIT_OF_MEASURE,
  PRODUCT_UNIT_LABELS,
  PRODUCT_UNITS_OF_MEASURE,
  type ProductUnitOfMeasure,
} from '@/shared/utils/productUnitOfMeasure'
import { LowStockAlertFields } from '@/shared/components/LowStockAlertFields'
import {
  DEFAULT_LOW_STOCK_ALERT_MODE,
  type LowStockAlertMode,
} from '@/shared/utils/lowStockAlert'
import { toSnakeCase } from '@/shared/utils/snakeCase'
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
  const [initialQty, setInitialQty] = useState(String(product?.initialQty ?? product?.qty ?? 0))
  const [lowStockAlertMode, setLowStockAlertMode] = useState<LowStockAlertMode>(
    product?.lowStockAlertMode ?? DEFAULT_LOW_STOCK_ALERT_MODE,
  )
  const [lowStockAlertValue, setLowStockAlertValue] = useState(
    product?.lowStockAlertValue !== null && product?.lowStockAlertValue !== undefined
      ? String(product.lowStockAlertValue)
      : '',
  )
  const [unitOfMeasure, setUnitOfMeasure] = useState<ProductUnitOfMeasure>(
    product?.unitOfMeasure ?? DEFAULT_PRODUCT_UNIT_OF_MEASURE,
  )
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

    const parsedInitialQty = Number(initialQty)
    if (Number.isNaN(parsedInitialQty) || parsedInitialQty < 0 || !Number.isInteger(parsedInitialQty)) {
      setError('Initial quantity must be a whole number zero or greater')
      return
    }

    const parsedAlertValue =
      lowStockAlertMode === 'off' || !lowStockAlertValue.trim()
        ? null
        : Number(lowStockAlertValue)

    if (
      lowStockAlertMode !== 'off' &&
      (parsedAlertValue === null || Number.isNaN(parsedAlertValue))
    ) {
      setError('Low stock alert threshold is required')
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
        initialQty: parsedInitialQty,
        lowStockAlertMode,
        lowStockAlertValue: parsedAlertValue,
        unitOfMeasure,
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
            label={`Quantity (${PRODUCT_UNIT_LABELS[unitOfMeasure]})`}
            type="number"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            required
            fullWidth
            helperText="Starting stock for the base product (use Inventory to adjust later)"
          />
          <LowStockAlertFields
            initialQty={initialQty}
            mode={lowStockAlertMode}
            value={lowStockAlertValue}
            onInitialQtyChange={setInitialQty}
            onModeChange={setLowStockAlertMode}
            onValueChange={setLowStockAlertValue}
            unitLabel={PRODUCT_UNIT_LABELS[unitOfMeasure]}
          />
          <FormControl fullWidth required>
            <InputLabel id="product-unit-label">Unit of measure</InputLabel>
            <Select
              labelId="product-unit-label"
              label="Unit of measure"
              value={unitOfMeasure}
              onChange={(event) =>
                setUnitOfMeasure(event.target.value as ProductUnitOfMeasure)
              }
            >
              {PRODUCT_UNITS_OF_MEASURE.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {PRODUCT_UNIT_LABELS[unit]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
