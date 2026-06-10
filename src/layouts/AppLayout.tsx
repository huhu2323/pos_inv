import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BadgeIcon from '@mui/icons-material/Badge'
import DashboardIcon from '@mui/icons-material/Dashboard'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ThemeModeToggle } from '../components/ThemeModeToggle'

const DRAWER_WIDTH = 260
const DRAWER_COLLAPSED_WIDTH = 76
const SIDEBAR_COLLAPSED_KEY = 'tofu_sidebar_collapsed'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, adminOnly: false },
  { label: 'Products', path: '/products', icon: Inventory2Icon, adminOnly: true },
  { label: 'Inventory', path: '/inventory', icon: WarehouseOutlinedIcon, adminOnly: true },
  { label: 'Sales', path: '/sales', icon: ReceiptLongIcon, adminOnly: false },
  { label: 'Invoices', path: '/invoices', icon: DescriptionOutlinedIcon, adminOnly: false },
  { label: 'Employees', path: '/employees', icon: BadgeIcon, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, adminOnly: true },
  { label: 'Data Archiver', path: '/data-archiver', icon: ArchiveOutlinedIcon, adminOnly: true },
]

function getInitialCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH
  const isCollapsedDesktop = collapsed && !isMobile
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  )

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function handleNavigate(path: string) {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          px: isCollapsedDesktop ? 1.5 : 2.5,
          justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <PointOfSaleIcon color="primary" sx={{ mr: isCollapsedDesktop ? 0 : 1.5 }} />
          {!isCollapsedDesktop && (
            <Typography variant="h6" noWrap>
              Tofu POS
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const selected = location.pathname === item.path

          const button = (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
                px: isCollapsedDesktop ? 1 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsedDesktop ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                <Icon color={selected ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {!isCollapsedDesktop && <ListItemText primary={item.label} />}
            </ListItemButton>
          )

          return isCollapsedDesktop ? (
            <Tooltip key={item.path} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          )
        })}
      </List>
      <Box sx={{ px: isCollapsedDesktop ? 1 : 2, pb: 1 }}>
        {isCollapsedDesktop ? (
          <Tooltip title="Start POS" placement="right">
            <IconButton
              color="primary"
              onClick={() => handleNavigate('/pos')}
              aria-label="Start POS"
              sx={{
                width: '100%',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                py: 1.5,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <PointOfSaleIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PointOfSaleIcon />}
            onClick={() => handleNavigate('/pos')}
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            Start POS
          </Button>
        )}
      </Box>
      <Divider />
      {!isCollapsedDesktop ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={`${user?.displayName} (${user?.role})`} placement="right">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {user?.displayName?.charAt(0).toUpperCase()}
            </Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="primary"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleCollapsed}
              sx={{ mr: 1 }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {visibleNavItems.find((item) => item.path === location.pathname)?.label ?? 'Tofu POS'}
          </Typography>
          <ThemeModeToggle color="inherit" />
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => void handleLogout()}
            sx={{ ml: 1 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, md: 3 },
          pt: { xs: 10, md: 11 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
