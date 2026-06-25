import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Badge,
  Box,
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
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProducts } from '@/lib/services/productService'
import { PRODUCT_UNIT_LABELS } from '@/shared/utils/productUnitOfMeasure'
import {
  collectLowStockAlerts,
  formatLowStockAlertLabel,
  type LowStockAlertItem,
} from '@/shared/utils/lowStockAlert'

const POLL_INTERVAL_MS = 60_000

export function LowStockAlertNotifier() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<LowStockAlertItem[]>([])
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const reloadAlerts = useCallback(async () => {
    const products = await listProducts()
    setAlerts(collectLowStockAlerts(products))
  }, [])

  useEffect(() => {
    void reloadAlerts()

    const intervalId = window.setInterval(() => {
      void reloadAlerts()
    }, POLL_INTERVAL_MS)

    function handleFocus() {
      void reloadAlerts()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [reloadAlerts])

  const menuOpen = Boolean(anchorEl)

  return (
    <>
      <Tooltip title={alerts.length ? `${alerts.length} low stock alerts` : 'No low stock alerts'}>
        <IconButton
          color="inherit"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label="Low stock alerts"
          sx={{ color: alerts.length ? 'warning.main' : 'text.secondary' }}
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
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Low stock alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Items at or below their configured threshold
          </Typography>
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
                sx={{ alignItems: 'flex-start' }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <WarningAmberIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={formatLowStockAlertLabel(alert)}
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
