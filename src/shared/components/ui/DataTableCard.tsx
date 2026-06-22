import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { stitchCardSx } from '@/shared/theme/stitchStyles'

interface DataTableCardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
}

export function DataTableCard({ title, action, children }: DataTableCardProps) {
  return (
    <Paper sx={{ ...stitchCardSx, overflow: 'hidden' }}>
      {(title || action) && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {title && <Typography variant="h6">{title}</Typography>}
          {action}
        </Box>
      )}
      {children}
    </Paper>
  )
}
