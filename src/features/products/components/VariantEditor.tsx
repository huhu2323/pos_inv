import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { ProductVariant } from '@/lib/db/types'
import { createEmptyVariant } from '@/lib/services/productService'
import { LowStockAlertFields } from '@/shared/components/LowStockAlertFields'
import { DEFAULT_LOW_STOCK_ALERT_MODE } from '@/shared/utils/lowStockAlert'
import { ImageUploadField } from './ImageUploadField'

interface VariantEditorProps {
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

export function VariantEditor({ variants, onChange }: VariantEditorProps) {
  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)))
  }

  function removeVariant(id: string) {
    onChange(variants.filter((variant) => variant.id !== id))
  }

  function addVariant() {
    onChange([...variants, createEmptyVariant()])
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
      >
        <Typography variant="subtitle1">Variants</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addVariant}>
          Add variant
        </Button>
      </Stack>

      {variants.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No variants yet. Add options like sizes or flavors.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {variants.map((variant, index) => (
            <Card key={variant.id} variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2">Variant {index + 1}</Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={`Remove variant ${index + 1}`}
                      size="small"
                    >
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </Stack>

                  <ImageUploadField
                    label="Variant image"
                    value={variant.image}
                    onChange={(image) => updateVariant(variant.id, { image })}
                    size={56}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Name"
                      value={variant.name}
                      onChange={(event) => updateVariant(variant.id, { name: event.target.value })}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Price"
                      type="number"
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(variant.id, { price: Number(event.target.value) || 0 })
                      }
                      slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      sx={{ minWidth: { sm: 120 } }}
                      required
                    />
                    <TextField
                      label="Qty"
                      type="number"
                      value={variant.qty}
                      onChange={(event) =>
                        updateVariant(variant.id, {
                          qty: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                        })
                      }
                      slotProps={{ htmlInput: { min: 0, step: 1 } }}
                      sx={{ minWidth: { sm: 100 } }}
                      required
                    />
                  </Stack>

                  <LowStockAlertFields
                    compact
                    initialQty={String(variant.initialQty ?? variant.qty)}
                    mode={variant.lowStockAlertMode ?? DEFAULT_LOW_STOCK_ALERT_MODE}
                    value={
                      variant.lowStockAlertValue !== null &&
                      variant.lowStockAlertValue !== undefined
                        ? String(variant.lowStockAlertValue)
                        : ''
                    }
                    onInitialQtyChange={(value) =>
                      updateVariant(variant.id, { initialQty: Math.max(0, Number(value) || 0) })
                    }
                    onModeChange={(mode) =>
                      updateVariant(variant.id, {
                        lowStockAlertMode: mode,
                        lowStockAlertValue: mode === 'off' ? null : variant.lowStockAlertValue,
                      })
                    }
                    onValueChange={(value) =>
                      updateVariant(variant.id, {
                        lowStockAlertValue: value.trim() ? Number(value) : null,
                      })
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
