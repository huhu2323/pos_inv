import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ThemeModeToggle } from '@/shared/theme/ThemeModeToggle'
import { stitchHeaderBarSx, stitchNavItemSx } from '@/shared/theme/stitchStyles'
import {
  DRAWER_COLLAPSED_WIDTH,
  DRAWER_WIDTH,
  NAV_ITEMS,
  SIDEBAR_COLLAPSED_KEY,
} from '@/shared/layouts/navConfig'

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
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  )
  const currentPage = visibleNavItems.find((item) => item.path === location.pathname)

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 3, px: 2 }}>
      <Box sx={{ mb: 4, px: isCollapsedDesktop ? 0.5 : 1, textAlign: isCollapsedDesktop ? 'center' : 'left' }}>
        {!isCollapsedDesktop ? (
          <>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Store Manager
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
              Tofu POS Terminal
            </Typography>
          </>
        ) : (
          <PointOfSaleIcon color="primary" sx={{ fontSize: 28 }} />
        )}
      </Box>

      <List sx={{ flexGrow: 1, px: 0 }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const selected = location.pathname === item.path

          const button = (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => handleNavigate(item.path)}
              sx={stitchNavItemSx(selected)}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsedDesktop ? 0 : 40,
                  justifyContent: 'center',
                  color: selected ? 'primary.main' : 'inherit',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!isCollapsedDesktop && (
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: { sx: { fontWeight: selected ? 700 : 500, fontSize: '0.95rem' } },
                  }}
                />
              )}
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

      <Box sx={{ mt: 'auto', pt: 3, borderTop: 1, borderColor: 'divider' }}>
        {!isCollapsedDesktop ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {user?.displayName?.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {user?.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {user?.role} access
              </Typography>
            </Box>
          </Box>
        ) : null}

        {isCollapsedDesktop ? (
          <Tooltip title="Start POS" placement="right">
            <IconButton
              color="secondary"
              onClick={() => handleNavigate('/pos')}
              aria-label="Start POS"
              sx={{
                width: '100%',
                borderRadius: 2,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                py: 1.5,
                '&:hover': { bgcolor: 'secondary.dark' },
              }}
            >
              <PointOfSaleIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            fullWidth
            startIcon={<PointOfSaleIcon />}
            onClick={() => handleNavigate('/pos')}
            sx={{ py: 1.5, borderRadius: 2, boxShadow: 2 }}
          >
            Start POS
          </Button>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width'),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
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
              transition: theme.transitions.create('width'),
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box component="header" sx={stitchHeaderBarSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            {isMobile ? (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton
                edge="start"
                onClick={toggleCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            )}
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
              Tofu POS
            </Typography>
            <TextField
              size="small"
              placeholder="Search orders, products..."
              sx={{
                display: { xs: 'none', lg: 'block' },
                ml: 2,
                maxWidth: 320,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  bgcolor: 'action.hover',
                  '& fieldset': { border: 'none' },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {currentPage && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: 'none', md: 'block' }, ml: 1 }}
              >
                / {currentPage.label}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeModeToggle />
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={() => void handleLogout()}
              sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Logout
            </Button>
            <IconButton
              onClick={() => void handleLogout()}
              aria-label="Logout"
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'text.secondary' }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
