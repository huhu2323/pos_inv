import CloseIcon from '@mui/icons-material/Close'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { AuthUser } from '@/lib/db/types'

interface PosHeaderProps {
  user: AuthUser | null
  onExit: () => void
}

export function PosHeader({ user, onExit }: PosHeaderProps) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <PointOfSaleIcon />
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            POS Terminal
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {user?.displayName} · {user?.role}
          </Typography>
        </Box>
      </Stack>

      <Button
        color="inherit"
        variant="outlined"
        size="large"
        startIcon={<CloseIcon />}
        onClick={onExit}
        sx={{ borderColor: 'rgba(255,255,255,0.5)', minHeight: 48, px: 2.5 }}
      >
        Exit
      </Button>
    </Box>
  )
}
