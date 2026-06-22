import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { DataTableCard } from '@/shared/components/ui/DataTableCard'
import { StatusChip } from '@/shared/components/ui/StatusChip'
import { getTodaySalesStats, listSales, type TodaySalesStats } from '@/lib/services/saleService'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/formatDate'
import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'
import { stitchTableHeadSx } from '@/shared/theme/stitchStyles'
import type { Sale } from '@/lib/db/types'

const emptyStats: TodaySalesStats = {
  totalSales: 0,
  orderCount: 0,
  itemsSold: 0,
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [stats, setStats] = useState<TodaySalesStats>(emptyStats)
  const [recentSales, setRecentSales] = useState<Sale[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [todayStats, sales] = await Promise.all([getTodaySalesStats(), listSales()])
        if (active) {
          setStats(todayStats)
          setRecentSales(sales.filter((s) => s.type === 'sale').slice(0, 5))
        }
      } catch {
        if (active) {
          setStats(emptyStats)
          setRecentSales([])
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="h4">Welcome back, {user?.displayName}</Typography>
        <Typography color="text.secondary">
          Your terminal is ready. Review today&apos;s performance and jump into the register.
        </Typography>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Total sales"
            value={formatCurrency(stats.totalSales)}
            icon={AttachMoneyIcon}
            valueColor="primary.main"
            iconBg="#f1f3ff"
            hint={
              stats.orderCount > 0 ? (
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                  <TrendingUpIcon sx={{ fontSize: 14 }} />
                  {stats.orderCount} order{stats.orderCount === 1 ? '' : 's'} today
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No transactions yet
                </Typography>
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Orders"
            value={String(stats.orderCount)}
            icon={ReceiptLongIcon}
            iconColor="secondary.main"
            iconBg="#e8edff"
            hint={
              <Typography variant="caption" color="text.secondary">
                Completed today
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Items sold"
            value={String(stats.itemsSold)}
            icon={ShoppingCartIcon}
            iconColor="primary.main"
            iconBg="#f1f3ff"
            hint={
              <Typography variant="caption" color="text.secondary">
                Units sold today
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Register"
            value="Ready"
            icon={AttachMoneyIcon}
            valueColor="success.main"
            iconBg="#82f9be33"
            iconColor="success.main"
            hint={
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                Terminal online
              </Typography>
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick actions
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {isAdmin
                  ? 'Start a new register sale or review completed transactions.'
                  : 'Open the register to start taking orders.'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" color="secondary" onClick={() => navigate('/pos')}>
                  New sale
                </Button>
                <Button variant="outlined" onClick={() => navigate('/sales')}>
                  View transactions
                </Button>
                {isAdmin && (
                  <Button variant="outlined" onClick={() => navigate('/products')}>
                    Manage products
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Store performance
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Avg. ticket
                  </Typography>
                  <Typography sx={{ fontFamily: monoFontFamily }}>
                    {stats.orderCount > 0
                      ? formatCurrency(stats.totalSales / stats.orderCount)
                      : formatCurrency(0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Items per order
                  </Typography>
                  <Typography sx={{ fontFamily: monoFontFamily }}>
                    {stats.orderCount > 0
                      ? (stats.itemsSold / stats.orderCount).toFixed(1)
                      : '0'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTableCard
        title="Recent transactions"
        action={
          <Button
            size="small"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/sales')}
            sx={{ fontWeight: 700 }}
          >
            View all
          </Button>
        }
      >
        <TableContainer>
          <Table>
            <TableHead sx={stitchTableHeadSx}>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No transactions yet today. Start POS to record your first sale.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentSales.map((sale) => (
                  <TableRow key={sale.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')}>
                    <TableCell sx={{ fontFamily: monoFontFamily, fontSize: '0.875rem' }}>
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                    <TableCell>{sale.lines.length} item{sale.lines.length === 1 ? '' : 's'}</TableCell>
                    <TableCell>
                      <StatusChip
                        status={sale.status === 'voided' ? 'error' : 'success'}
                        label={sale.status === 'voided' ? 'Voided' : 'Completed'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: monoFontFamily, fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(sale.subtotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableCard>
    </Box>
  )
}
