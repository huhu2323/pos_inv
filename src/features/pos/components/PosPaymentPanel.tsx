import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined'
import { ArrowForwardIcon } from '@/features/pos/components/PosHeader'
import { Box, Button, Stack, Typography } from '@mui/material'
import { formatCurrency } from '@/shared/utils/currency'
import type { CartLine } from '@/features/pos/types'
import {
  NUMPAD_KEYS,
  PH_BILLS,
  displayPriceSx,
  touchButtonSx,
} from '@/features/pos/utils/posStyles'
import { labelCapsSx } from '@/shared/theme/stitchStyles'

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

  const tenderDisplay = amountPaid === '' ? formatCurrency(0) : `₱${amountPaid}`

  return (
    <Stack spacing={2} sx={{ height: '100%', p: 2 }}>
      <Box
        sx={{
          bgcolor: '#1d3052',
          color: '#edf0ff',
          p: 3,
          borderRadius: 2,
          textAlign: 'right',
        }}
      >
        <Typography sx={{ ...labelCapsSx, opacity: 0.7, mb: 1 }}>Amount tendered</Typography>
        <Typography sx={{ ...displayPriceSx, fontSize: { xs: '2rem', md: '2.75rem' }, lineHeight: 1 }}>
          {tenderDisplay}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          flex: 1,
        }}
      >
        {NUMPAD_KEYS.map((key) => (
          <Button
            key={key}
            variant={key === 'C' ? 'outlined' : 'contained'}
            color={key === 'C' ? 'inherit' : 'primary'}
            onClick={() => (key === 'C' ? onBackspace() : handleNumpad(key))}
            sx={{
              ...touchButtonSx,
              minHeight: 64,
              bgcolor: key === 'C' ? 'action.selected' : 'background.paper',
              color: key === 'C' ? 'text.primary' : 'primary.main',
              borderColor: 'divider',
              boxShadow: key === 'C' ? 'none' : '0 1px 2px rgba(4,27,60,0.08)',
              '&:hover': {
                bgcolor: key === 'C' ? 'error.light' : 'primary.main',
                color: key === 'C' ? 'error.dark' : 'primary.contrastText',
              },
            }}
          >
            {key === 'C' ? <BackspaceOutlinedIcon /> : key}
          </Button>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
        {PH_BILLS.map((bill) => (
          <Button
            key={bill}
            variant="contained"
            onClick={() => handleAddBill(bill)}
            sx={{
              py: 1.25,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: '#50dcff',
              color: '#005f71',
              '&:hover': { bgcolor: '#48d7f9' },
            }}
          >
            ₱{bill}
          </Button>
        ))}
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={labelCapsSx} color="text.secondary">
          Change
        </Typography>
        <Typography
          sx={{ ...displayPriceSx, fontSize: '1.75rem' }}
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
        color="primary"
        size="large"
        disabled={!canComplete || completingSale}
        onClick={onCompleteSale}
        endIcon={<ArrowForwardIcon />}
        sx={{
          mt: 'auto',
          minHeight: 80,
          fontSize: '1.25rem',
          fontWeight: 700,
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0, 61, 155, 0.25)',
        }}
      >
        {completingSale ? 'Completing...' : 'Complete order'}
      </Button>
    </Stack>
  )
}
