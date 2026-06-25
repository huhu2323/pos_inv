import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProducts } from '@/lib/services/productService'
import { PRODUCT_UNIT_LABELS } from '@/shared/utils/productUnitOfMeasure'
import {
  collectLowStockAlerts,
  countCriticalStockAlerts,
  formatLowStockAlertLabel,
  stockAlertLevelLabel,
  stockAlertLevelToChipStatus,
  type LowStockAlertItem,
} from '@/shared/utils/lowStockAlert'
import { StatusChip } from '@/shared/components/ui/StatusChip'
import { labelCapsSx } from '@/shared/theme/stitchStyles'

const POLL_INTERVAL_MS = 60_000

export function LowStockAlertNotifier() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<LowStockAlertItem[]>([])
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const criticalCount = countCriticalStockAlerts(alerts)
  const hasCritical = criticalCount > 0

  useEffect(() => {
    let active = true

    async function loadAlerts() {
      const products = await listProducts()
      if (active) {
        setAlerts(collectLowStockAlerts(products))
      }
    }

    void loadAlerts()

    const intervalId = window.setInterval(() => {
      void loadAlerts()
    }, POLL_INTERVAL_MS)

    function handleFocus() {
      void loadAlerts()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const menuOpen = Boolean(anchorEl)

  return (
    <>
      <Tooltip
        title={
          alerts.length
            ? `${alerts.length} low stock alert${alerts.length === 1 ? '' : 's'}${hasCritical ? ` (${criticalCount} critical)` : ''}`
            : 'No low stock alerts'
        }
      >
        <IconButton
          color="inherit"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label="Low stock alerts"
          sx={{ color: hasCritical ? 'error.main' : alerts.length ? 'warning.main' : 'text.secondary' }}
        >
          <Badge badgeContent={alerts.length} color="error" max={99}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxWidth: '92vw' } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Low stock alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items at or below their configured threshold
            </Typography>
          </Box>
          {hasCritical && (
            <Chip
              label={`${criticalCount} critical`}
              size="small"
              sx={{
                ...labelCapsSx,
                bgcolor: 'error.light',
                color: 'error.dark',
                fontSize: '0.65rem',
                height: 24,
              }}
            />
          )}
        </Box>
        <Divider />

        {alerts.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              All tracked stock levels are above their alert thresholds.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <ListItem
                key={`${alert.productId}:${alert.variantId ?? 'base'}`}
                sx={{ alignItems: 'flex-start', gap: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  {alert.level === 'critical' || alert.level === 'out_of_stock' ? (
                    <ErrorOutlineOutlinedIcon color="error" fontSize="small" />
                  ) : (
                    <WarningAmberIcon color="warning" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatLowStockAlertLabel(alert)}
                      </Typography>
                      <StatusChip
                        status={stockAlertLevelToChipStatus(alert.level)}
                        label={stockAlertLevelLabel(alert.level)}
                      />
                    </Box>
                  }
                  secondary={`${alert.qty} ${PRODUCT_UNIT_LABELS[alert.unitOfMeasure]} left (threshold ${alert.threshold})`}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1.5, py: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              setAnchorEl(null)
              navigate('/products')
            }}
            aria-label="Open products"
          >
            <Typography variant="button" sx={{ px: 1 }}>
              Products
            </Typography>
          </IconButton>
        </Box>
      </Menu>
    </>
  )
}
