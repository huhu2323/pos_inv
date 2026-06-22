import { createTheme, type PaletteMode } from '@mui/material/styles'
import { stitchDesignTokens } from '@/shared/theme/stitchDesignTokens'

export function createAppTheme(mode: PaletteMode) {
  const tokens = mode === 'light' ? stitchDesignTokens.light : stitchDesignTokens.dark
  const { fonts, shape } = stitchDesignTokens

  return createTheme({
    palette: {
      mode,
      primary: tokens.primary,
      secondary: tokens.secondary,
      success: tokens.success,
      error: tokens.error,
      warning: tokens.warning,
      background: tokens.background,
      text: tokens.text,
      divider: tokens.divider,
      action: {
        hover:
          mode === 'light' ? 'rgba(0, 61, 155, 0.04)' : 'rgba(178, 197, 255, 0.08)',
        selected:
          mode === 'light' ? tokens.surface.containerHigh : tokens.surface.containerHigh,
      },
    },
    typography: {
      fontFamily: fonts.body,
      h3: {
        fontFamily: fonts.headline,
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontFamily: fonts.headline,
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.25,
      },
      h5: {
        fontFamily: fonts.headline,
        fontWeight: 600,
      },
      h6: {
        fontFamily: fonts.headline,
        fontWeight: 600,
      },
      subtitle1: {
        fontFamily: fonts.headline,
        fontWeight: 600,
      },
      button: {
        fontFamily: fonts.body,
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: shape.borderRadius,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background.default,
          },
          '*::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: tokens.divider,
            borderRadius: 10,
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: stitchDesignTokens.layout.touchTargetMin,
            borderRadius: shape.borderRadius,
          },
          sizeLarge: {
            minHeight: stitchDesignTokens.layout.touchTargetMin,
            borderRadius: shape.borderRadiusLg,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadiusLg,
            border: `1px solid ${tokens.divider}`,
            boxShadow: '0 1px 2px rgba(4, 27, 60, 0.06)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: tokens.divider,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${tokens.divider}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.borderRadius,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: tokens.text.secondary,
            bgcolor: tokens.surface.containerHigh,
            borderBottom: `1px solid ${tokens.divider}`,
          },
          root: {
            borderBottom: `1px solid ${tokens.divider}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              bgcolor: mode === 'light' ? '#f1f3ff' : tokens.surface.container,
            },
          },
        },
      },
    },
  })
}
