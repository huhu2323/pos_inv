import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { StoredImage } from '@/shared/components/images/StoredImage'
import { formatCurrency } from '@/shared/utils/currency'
import type { Product } from '@/lib/db/types'
import type { PosSellableItem } from '@/features/pos/utils/posProducts'
import { PosBarcodeDialog } from './PosBarcodeDialog'
import { PosSearchDialog } from './PosSearchDialog'

interface PosProductGridProps {
  loading: boolean
  sellableItems: PosSellableItem[]
  products: Product[]
  continuousBarcodeScanning: boolean
  searchOpen: boolean
  barcodeOpen: boolean
  onSearchOpen: () => void
  onSearchClose: () => void
  onBarcodeOpen: () => void
  onBarcodeClose: () => void
  onItemClick: (item: PosSellableItem) => void
  onSearchSelect: (item: PosSellableItem) => void
  onBarcodeSelect: (item: PosSellableItem) => void
}

export function PosProductGrid({
  loading,
  sellableItems,
  products,
  continuousBarcodeScanning,
  searchOpen,
  barcodeOpen,
  onSearchOpen,
  onSearchClose,
  onBarcodeOpen,
  onBarcodeClose,
  onItemClick,
  onSearchSelect,
  onBarcodeSelect,
}: PosProductGridProps) {
  return (
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
              onClick={onSearchOpen}
              sx={{ minHeight: 48 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<QrCodeScannerIcon />}
              onClick={onBarcodeOpen}
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
                onClick={() => onItemClick(item)}
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
        onClose={onSearchClose}
        onSelectItem={onSearchSelect}
      />

      <PosBarcodeDialog
        open={barcodeOpen}
        products={products}
        continuousBarcodeScanning={continuousBarcodeScanning}
        onClose={onBarcodeClose}
        onSelectItem={onBarcodeSelect}
      />
    </Paper>
  )
}
