import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import {
  Box,
  Button,
  IconButton,
  Typography,
} from '@mui/material'
import type { AuthUser } from '@/lib/db/types'
import { stitchHeaderBarSx, labelCapsSx } from '@/shared/theme/stitchStyles'

interface PosHeaderProps {
  user: AuthUser | null
  onExit: () => void
}

export function PosHeader({ user, onExit }: PosHeaderProps) {
  return (
    <Box component="header" sx={stitchHeaderBarSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 } }}>
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
          Tofu POS
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
          <Typography sx={{ ...labelCapsSx, color: 'primary.main' }}>Sales</Typography>
          <Typography sx={{ ...labelCapsSx, color: 'text.secondary' }}>Inventory</Typography>
          <Typography sx={{ ...labelCapsSx, color: 'text.secondary' }}>Reports</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton aria-label="Notifications" sx={{ color: 'text.secondary' }}>
          <NotificationsNoneIcon />
        </IconButton>
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            textAlign: 'right',
            pl: 2,
            ml: 1,
            borderLeft: 1,
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ ...labelCapsSx, lineHeight: 1.2 }}>Terminal</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {user?.displayName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<CloseIcon />}
          onClick={onExit}
          sx={{ ml: 1, borderColor: 'divider', color: 'text.secondary' }}
        >
          Exit
        </Button>
      </Box>
    </Box>
  )
}

export { ArrowForwardIcon }
