import type { SvgIconComponent } from '@mui/icons-material'
import BadgeIcon from '@mui/icons-material/Badge'
import DashboardIcon from '@mui/icons-material/Dashboard'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import SettingsIcon from '@mui/icons-material/Settings'

export interface NavItem {
  label: string
  path: string
  icon: SvgIconComponent
  adminOnly: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, adminOnly: false },
  { label: 'Products', path: '/products', icon: Inventory2Icon, adminOnly: true },
  { label: 'Inventory', path: '/inventory', icon: WarehouseOutlinedIcon, adminOnly: true },
  { label: 'Sales', path: '/sales', icon: ReceiptLongIcon, adminOnly: false },
  { label: 'Receipts', path: '/receipts', icon: DescriptionOutlinedIcon, adminOnly: false },
  { label: 'Employees', path: '/employees', icon: BadgeIcon, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, adminOnly: true },
  { label: 'Data Archiver', path: '/data-archiver', icon: ArchiveOutlinedIcon, adminOnly: true },
]

export const SIDEBAR_COLLAPSED_KEY = 'tofu_sidebar_collapsed'
export const DRAWER_WIDTH = 260
export const DRAWER_COLLAPSED_WIDTH = 76
