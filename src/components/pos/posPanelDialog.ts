import type { SxProps, Theme } from '@mui/material/styles'

export const posPanelDialogSlotProps = {
  backdrop: {
    sx: {
      position: 'absolute',
      inset: 0,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.45)',
    },
  },
} as const

export function getPosPanelDialogSx(maxWidth: number): SxProps<Theme> {
  return (theme) => ({
    position: 'absolute',
    inset: 0,
    zIndex: theme.zIndex.modal,
    '& .MuiDialog-container': {
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    '& .MuiDialog-paper': {
      m: 2,
      width: 'calc(100% - 32px)',
      maxWidth,
      maxHeight: 'calc(100% - 32px)',
    },
  })
}

export function getPosPanelFullDialogSx(): SxProps<Theme> {
  return (theme) => ({
    position: 'absolute',
    inset: 0,
    zIndex: theme.zIndex.modal,
    '& .MuiDialog-container': {
      position: 'absolute',
      inset: 0,
      alignItems: 'stretch',
      justifyContent: 'stretch',
    },
    '& .MuiDialog-paper': {
      m: 0,
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      maxHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
    },
  })
}
