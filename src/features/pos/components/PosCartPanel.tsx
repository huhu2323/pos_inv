import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { formatCurrency } from '@/shared/utils/currency'
import type { CartLine } from '@/features/pos/types'
import { touchIconButtonSx } from '@/features/pos/utils/posStyles'

interface PosCartPanelProps {
  cart: CartLine[]
  onUpdateQuantity: (lineId: string, delta: number) => void
  onRemoveLine: (lineId: string) => void
  onClearCart: () => void
}

export function PosCartPanel({
  cart,
  onUpdateQuantity,
  onRemoveLine,
  onClearCart,
}: PosCartPanelProps) {
  const cartEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cart.length === 0) {
      return
    }

    cartEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [cart])

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant="h6">Current order</Typography>
        <Button
          size="large"
          color="inherit"
          variant="outlined"
          disabled={cart.length === 0}
          onClick={onClearCart}
          sx={{ minHeight: 48, px: 2.5 }}
        >
          Clear
        </Button>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 120, mb: 2 }}>
        {cart.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Tap a product to add it to the order.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {cart.map((line) => (
              <Box
                key={line.lineId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, fontSize: '1.05rem' }}
                    noWrap
                  >
                    {line.productName}
                    {line.variantName ? ` (${line.variantName})` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(line.unitPrice)} each
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <IconButton
                    aria-label="Decrease quantity"
                    onClick={() => onUpdateQuantity(line.lineId, -1)}
                    sx={touchIconButtonSx}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography
                    variant="h6"
                    sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}
                  >
                    {line.quantity}
                  </Typography>
                  <IconButton
                    aria-label="Increase quantity"
                    onClick={() => onUpdateQuantity(line.lineId, 1)}
                    sx={touchIconButtonSx}
                  >
                    <AddIcon />
                  </IconButton>
                </Stack>
                <Typography
                  variant="subtitle1"
                  sx={{ minWidth: 88, textAlign: 'right', fontWeight: 700 }}
                >
                  {formatCurrency(line.unitPrice * line.quantity)}
                </Typography>
                <IconButton
                  color="error"
                  aria-label="Remove item"
                  onClick={() => onRemoveLine(line.lineId)}
                  sx={{
                    ...touchIconButtonSx,
                    borderColor: 'error.light',
                  }}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              </Box>
            ))}
            <Box ref={cartEndRef} />
          </Stack>
        )}
      </Box>
    </>
  )
}
