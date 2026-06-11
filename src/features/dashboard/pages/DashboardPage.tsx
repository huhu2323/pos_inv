import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTodaySalesStats, type TodaySalesStats } from '@/lib/services/saleService'
import { formatCurrency } from '@/shared/utils/currency'

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

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const todayStats = await getTodaySalesStats()
        if (active) {
          setStats(todayStats)
        }
      } catch {
        if (active) {
          setStats(emptyStats)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const statCards = [
    {
      title: "Today's sales",
      value: formatCurrency(stats.totalSales),
      subtitle:
        stats.orderCount === 0
          ? 'No transactions yet'
          : `${stats.orderCount} completed order${stats.orderCount === 1 ? '' : 's'}`,
      icon: AttachMoneyIcon,
      colorKey: 'primary.main' as const,
    },
    {
      title: 'Orders',
      value: String(stats.orderCount),
      subtitle: stats.orderCount === 0 ? 'Open register to start' : 'Completed today',
      icon: ReceiptLongIcon,
      colorKey: 'secondary.main' as const,
    },
    {
      title: 'Items sold',
      value: String(stats.itemsSold),
      subtitle: stats.itemsSold === 0 ? 'Ready for first sale' : 'Units sold today',
      icon: ShoppingCartIcon,
      colorKey: 'primary.light' as const,
    },
  ]

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4">Welcome back, {user?.displayName}</Typography>
        <Typography color="text.secondary">
          Your terminal is ready. Connect inventory and start taking orders from here.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Grid key={stat.title} size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                  >
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: (theme) => {
                          const [palette, shade] = stat.colorKey.split('.') as [
                            'primary' | 'secondary',
                            'main' | 'light',
                          ]
                          const color = theme.palette[palette][shade]
                          return theme.palette.mode === 'light' ? `${color}18` : `${color}33`
                        },
                        color: stat.colorKey,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Card sx={{ mt: 3 }}>
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
            <Button variant="contained" onClick={() => navigate('/pos')}>
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
    </Box>
  )
}
