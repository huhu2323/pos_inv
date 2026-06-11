import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material'
import { formatCurrency } from '@/shared/utils/currency'
import type { CartLine } from '@/features/pos/types'
import {
  NUMPAD_KEYS,
  PH_BILLS,
  touchButtonSx,
  touchIconButtonSx,
} from '@/features/pos/utils/posStyles'

interface PosPaymentPanelProps {
  cart: CartLine[]
  total: number
  amountPaid: string
  paidAmount: number
  change: number
  canComplete: boolean
  completingSale: boolean
  onAmountPaidChange: (value: string) => void
  onBackspace: () => void
  onCompleteSale: () => void
}

export function PosPaymentPanel({
  cart,
  total,
  amountPaid,
  paidAmount,
  change,
  canComplete,
  completingSale,
  onAmountPaidChange,
  onBackspace,
  onCompleteSale,
}: PosPaymentPanelProps) {
  function handleNumpad(key: (typeof NUMPAD_KEYS)[number]) {
    if (key === 'C') {
      onAmountPaidChange('')
      return
    }

    if (key === '.') {
      if (amountPaid.includes('.')) {
        return
      }
      onAmountPaidChange(amountPaid === '' ? '0.' : `${amountPaid}.`)
      return
    }

    if (amountPaid === '0') {
      onAmountPaidChange(key)
      return
    }

    const next = `${amountPaid}${key}`
    const [, decimals] = next.split('.')

    if (decimals && decimals.length > 2) {
      return
    }

    onAmountPaidChange(next)
  }

  function handleAddBill(bill: number) {
    const parsed = amountPaid === '' ? 0 : Number.parseFloat(amountPaid)
    const base = Number.isFinite(parsed) ? parsed : 0
    const next = base + bill
    onAmountPaidChange(Number.isInteger(next) ? String(next) : next.toFixed(2))
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="subtitle1">Total</Typography>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
          {formatCurrency(total)}
        </Typography>
      </Stack>

      <Box>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            Amount paid
          </Typography>
          <IconButton aria-label="Backspace" onClick={onBackspace} sx={touchIconButtonSx}>
            <DeleteOutlinedIcon />
          </IconButton>
        </Stack>
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 2,
            mb: 1.5,
            textAlign: 'right',
            fontSize: { xs: '1.75rem', md: '2rem' },
            fontWeight: 700,
            fontFamily: 'monospace',
          }}
        >
          {amountPaid === '' ? formatCurrency(0) : `₱${amountPaid}`}
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Quick bills
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 1,
            mb: 1.5,
          }}
        >
          {PH_BILLS.map((bill) => (
            <Button
              key={bill}
              variant="outlined"
              color="secondary"
              onClick={() => handleAddBill(bill)}
              sx={{
                ...touchButtonSx,
                minHeight: 52,
                fontSize: '1rem',
                px: 0.5,
              }}
            >
              ₱{bill}
            </Button>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}
        >
          {NUMPAD_KEYS.map((key) => (
            <Button
              key={key}
              variant={key === 'C' ? 'outlined' : 'contained'}
              color={key === 'C' ? 'inherit' : 'primary'}
              onClick={() => handleNumpad(key)}
              sx={touchButtonSx}
            >
              {key}
            </Button>
          ))}
        </Box>
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Change
        </Typography>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '2.5rem' } }}
          color={change < 0 ? 'error.main' : 'success.main'}
        >
          {change < 0 ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(change)}
        </Typography>
      </Stack>

      {cart.length > 0 && paidAmount < total && paidAmount > 0 && (
        <Typography variant="caption" color="error.main">
          Short by {formatCurrency(total - paidAmount)}
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={!canComplete || completingSale}
        onClick={onCompleteSale}
        sx={{ mt: 1, minHeight: 64, fontSize: '1.2rem', fontWeight: 700 }}
      >
        {completingSale ? 'Completing...' : 'Complete sale'}
      </Button>
    </Stack>
  )
}
