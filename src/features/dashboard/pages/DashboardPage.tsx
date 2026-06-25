import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
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
import { listProducts } from '@/lib/services/productService'
import { getTodaySalesStats, listSales, type TodaySalesStats } from '@/lib/services/saleService'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/formatDate'
import {
  collectLowStockAlerts,
  countCriticalStockAlerts,
  formatLowStockAlertLabel,
  stockAlertLevelLabel,
  stockAlertLevelToChipStatus,
  type LowStockAlertItem,
} from '@/shared/utils/lowStockAlert'
import { formatQtyWithUnit } from '@/shared/utils/productUnitOfMeasure'
import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'
import { stitchTableHeadSx, labelCapsSx } from '@/shared/theme/stitchStyles'
import type { Sale } from '@/lib/db/types'

const DASHBOARD_LOW_STOCK_LIMIT = 10

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
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertItem[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [todayStats, sales, products] = await Promise.all([
          getTodaySalesStats(),
          listSales(),
          listProducts(),
        ])
        if (active) {
          setStats(todayStats)
          setRecentSales(sales.filter((s) => s.type === 'sale').slice(0, 5))
          setLowStockAlerts(collectLowStockAlerts(products))
        }
      } catch {
        if (active) {
          setStats(emptyStats)
          setRecentSales([])
          setLowStockAlerts([])
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const criticalCount = countCriticalStockAlerts(lowStockAlerts)
  const hasLowStock = lowStockAlerts.length > 0
  const hasCritical = criticalCount > 0

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
            label="Low stock"
            value={String(lowStockAlerts.length)}
            icon={WarningAmberIcon}
            valueColor={hasCritical ? 'error.main' : hasLowStock ? 'warning.main' : 'text.primary'}
            iconBg={hasCritical ? '#ffdad6' : hasLowStock ? '#fff4e5' : '#f1f3ff'}
            iconColor={hasCritical ? 'error.main' : hasLowStock ? 'warning.main' : 'primary.main'}
            hint={
              <Typography
                variant="caption"
                color={hasCritical ? 'error.main' : hasLowStock ? 'warning.main' : 'text.secondary'}
                sx={{ fontWeight: hasLowStock ? 700 : 400 }}
              >
                {hasCritical
                  ? `${criticalCount} critical item${criticalCount === 1 ? '' : 's'}`
                  : hasLowStock
                    ? 'Items at or below alert level'
                    : 'No stock alerts right now'}
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

      <Box sx={{ mb: 4 }}>
        <DataTableCard
          title="Low stock alerts"
          action={
            hasLowStock ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {hasCritical && (
                  <Typography
                    component="span"
                    sx={{
                      ...labelCapsSx,
                      bgcolor: 'error.light',
                      color: 'error.dark',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 999,
                      fontSize: '0.65rem',
                    }}
                  >
                    {criticalCount} critical
                  </Typography>
                )}
                <Button
                  size="small"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/products')}
                  sx={{ fontWeight: 700 }}
                >
                  Manage products
                </Button>
              </Box>
            ) : undefined
          }
        >
        <TableContainer>
          <Table>
            <TableHead sx={stitchTableHeadSx}>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Alert at</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No products are below their configured low stock thresholds.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lowStockAlerts.slice(0, DASHBOARD_LOW_STOCK_LIMIT).map((alert) => (
                  <TableRow
                    key={`${alert.productId}:${alert.variantId ?? 'base'}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate('/products')}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatLowStockAlertLabel(alert)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: monoFontFamily }}>
                      {formatQtyWithUnit(alert.qty, alert.unitOfMeasure)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: monoFontFamily }}>
                      {formatQtyWithUnit(alert.threshold, alert.unitOfMeasure)}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={stockAlertLevelToChipStatus(alert.level)}
                        label={stockAlertLevelLabel(alert.level)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {lowStockAlerts.length > DASHBOARD_LOW_STOCK_LIMIT && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
            Showing the {DASHBOARD_LOW_STOCK_LIMIT} lowest stock items by current quantity.
          </Typography>
        )}
        </DataTableCard>
      </Box>

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
