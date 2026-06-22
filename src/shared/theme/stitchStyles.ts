import type { PaletteMode } from '@mui/material'
import { stitchDesignTokens } from '@/shared/theme/stitchDesignTokens'

export function stitchSurfaces(mode: PaletteMode) {
  return stitchDesignTokens[mode].surface
}

export const labelCapsSx = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  lineHeight: '16px',
} as const

export const stitchCardSx = {
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
  boxShadow: '0 1px 2px rgba(4, 27, 60, 0.06)',
} as const

export const stitchTableHeadSx = {
  bgcolor: (theme: { palette: { mode: PaletteMode } }) =>
    stitchSurfaces(theme.palette.mode).containerHigh,
  '& .MuiTableCell-head': {
    ...labelCapsSx,
    color: 'text.secondary',
    borderBottom: 1,
    borderColor: 'divider',
  },
} as const

export const stitchNavItemSx = (selected: boolean) => ({
  borderRadius: 1,
  mb: 0.5,
  py: 1.5,
  px: 1.5,
  ...(selected
    ? {
        color: 'primary.main',
        fontWeight: 700,
        bgcolor: 'action.selected',
        borderRight: 4,
        borderColor: 'primary.main',
      }
    : {
        color: 'text.secondary',
        '&:hover': { bgcolor: 'action.hover' },
      }),
})

export const stitchHeaderBarSx = {
  height: 64,
  minHeight: 64,
  px: { xs: 2, md: 3 },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  bgcolor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider',
  position: 'sticky',
  top: 0,
  zIndex: (theme: { zIndex: { appBar: number } }) => theme.zIndex.appBar,
} as const
