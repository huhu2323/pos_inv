import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import type { Product } from '@/lib/db/types'
import { formatCurrency } from '@/shared/utils/currency'
import { ZoomableImage } from './ZoomableImage'

interface ProductDetailDialogProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onZoomImage: (src: string, alt: string) => void
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  )
}

export function ProductDetailDialog({
  open,
  product,
  onClose,
  onZoomImage,
}: ProductDetailDialogProps) {
  if (!product) {
    return null
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{product.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Product image
            </Typography>
            <ZoomableImage
              image={product.image}
              alt={product.name}
              width={160}
              height={160}
              onZoom={onZoomImage}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="ID" value={product.id} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Barcode" value={product.barcode} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Short name" value={product.shortName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Default price" value={formatCurrency(product.defaultPrice)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Name" value={product.name} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Description"
                value={product.description || '—'}
              />
            </Grid>
          </Grid>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Variants
            </Typography>
            {product.variants.length === 0 ? (
              <Typography color="text.secondary">No variants for this product.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {product.variants.map((variant, index) => (
                  <Card key={variant.id} variant="outlined">
                    <CardContent>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ alignItems: { sm: 'center' } }}
                      >
                        <ZoomableImage
                          image={variant.image}
                          alt={`${product.name} - ${variant.name}`}
                          width={72}
                          height={72}
                          onZoom={onZoomImage}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">
                            {variant.name || `Variant ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price: {formatCurrency(variant.price)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: 'monospace' }}
                          >
                            ID: {variant.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
