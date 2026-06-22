import { Box, Button, Paper, Typography } from '@mui/material'
import { StoredImage } from '@/shared/components/images/StoredImage'
import { formatCurrency } from '@/shared/utils/currency'
import type { PosSellableItem } from '@/features/pos/utils/posProducts'
import { priceTypographySx } from '@/features/pos/utils/posStyles'
import { stitchCardSx } from '@/shared/theme/stitchStyles'

interface PosProductGridProps {
  loading: boolean
  sellableItems: PosSellableItem[]
  embedded?: boolean
  onItemClick: (item: PosSellableItem) => void
}

export function PosProductGrid({
  loading,
  sellableItems,
  embedded = false,
  onItemClick,
}: PosProductGridProps) {
  const content = (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2, minHeight: 0 }}>
      {!embedded && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          Products
        </Typography>
      )}

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
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
          {sellableItems.map((item) => (
            <Button
              key={item.key}
              variant="outlined"
              onClick={() => onItemClick(item)}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                textAlign: 'left',
                p: 2,
                minHeight: 160,
                justifyContent: 'flex-start',
                gap: 1,
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
              }}
            >
              <StoredImage
                image={item.image}
                alt={item.label}
                variant="rounded"
                sx={{ width: 72, height: 72, alignSelf: 'center', borderRadius: 1 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {item.label}
              </Typography>
              <Typography
                color="primary"
                sx={{ ...priceTypographySx, fontSize: '1.05rem', mt: 'auto' }}
              >
                {formatCurrency(item.price)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stock: {item.qty}
              </Typography>
            </Button>
          ))}
        </Box>
      )}
    </Box>
  )

  if (embedded) {
    return <Box sx={{ flex: 1, minHeight: 0 }}>{content}</Box>
  }

  return (
    <Paper sx={{ ...stitchCardSx, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {content}
    </Paper>
  )
}
