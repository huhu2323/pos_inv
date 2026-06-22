import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useRef } from 'react'
import { formatCurrency } from '@/shared/utils/currency'
import type { CartLine } from '@/features/pos/types'
import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'
import { labelCapsSx, stitchTableHeadSx } from '@/shared/theme/stitchStyles'

interface PosCartPanelProps {
  cart: CartLine[]
  onUpdateQuantity: (lineId: string, delta: number) => void
  onRemoveLine: (lineId: string) => void
}

export function PosCartPanel({ cart, onUpdateQuantity, onRemoveLine }: PosCartPanelProps) {
  const cartEndRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (cart.length === 0) {
      return
    }
    cartEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [cart])

  if (cart.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Scan a barcode, search, or browse products to start an order.
        </Typography>
      </Box>
    )
  }

  return (
    <Table stickyHeader sx={{ minWidth: 480 }}>
      <TableHead sx={stitchTableHeadSx}>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell align="center">Qty</TableCell>
          <TableCell align="right">Price</TableCell>
          <TableCell align="right">Total</TableCell>
          <TableCell align="center" sx={{ width: 48 }} />
        </TableRow>
      </TableHead>
      <TableBody>
        {cart.map((line, index) => (
          <TableRow
            key={line.lineId}
            ref={index === cart.length - 1 ? cartEndRef : undefined}
            sx={{
              '&:hover': { bgcolor: 'action.hover' },
              bgcolor: index === cart.length - 1 ? 'action.selected' : undefined,
              borderLeft: index === cart.length - 1 ? 4 : 0,
              borderColor: 'primary.main',
            }}
          >
            <TableCell>
              <Typography sx={{ fontWeight: 700 }}>{line.productName}</Typography>
              {line.variantName && (
                <Typography variant="caption" color="text.secondary">
                  {line.variantName}
                </Typography>
              )}
            </TableCell>
            <TableCell align="center">
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <IconButton size="small" onClick={() => onUpdateQuantity(line.lineId, -1)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ px: 1.5, fontFamily: monoFontFamily, fontWeight: 500 }}>
                  {line.quantity}
                </Typography>
                <IconButton size="small" onClick={() => onUpdateQuantity(line.lineId, 1)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </TableCell>
            <TableCell align="right" sx={{ fontFamily: monoFontFamily }}>
              {formatCurrency(line.unitPrice)}
            </TableCell>
            <TableCell align="right" sx={{ fontFamily: monoFontFamily, fontWeight: 700 }}>
              {formatCurrency(line.unitPrice * line.quantity)}
            </TableCell>
            <TableCell align="center">
              <IconButton
                size="small"
                color="error"
                aria-label="Remove item"
                onClick={() => onRemoveLine(line.lineId)}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PosCartTotals({ subtotal, total }: { subtotal: number; total: number }) {
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'action.selected',
        borderTop: 1,
        borderColor: 'divider',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
          <Typography sx={labelCapsSx}>Subtotal</Typography>
          <Typography sx={{ fontFamily: monoFontFamily }}>{formatCurrency(subtotal)}</Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
        <Typography sx={{ ...labelCapsSx, color: 'primary.main', mb: 0.5 }}>Total payable</Typography>
        <Typography
          sx={{
            fontFamily: monoFontFamily,
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.75rem' },
            letterSpacing: '-0.02em',
            color: 'primary.main',
            lineHeight: 1,
          }}
        >
          {formatCurrency(total)}
        </Typography>
      </Box>
    </Box>
  )
}
