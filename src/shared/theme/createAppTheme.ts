import { createTheme, type PaletteMode } from '@mui/material/styles'

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1565c0' : '#42a5f5',
        dark: mode === 'light' ? '#0d47a1' : '#1976d2',
        light: mode === 'light' ? '#42a5f5' : '#90caf9',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'light' ? '#0288d1' : '#4fc3f7',
        dark: mode === 'light' ? '#01579b' : '#29b6f6',
        light: mode === 'light' ? '#4fc3f7' : '#81d4fa',
      },
      background: {
        default: mode === 'light' ? '#f0f4f8' : '#0a1628',
        paper: mode === 'light' ? '#ffffff' : '#132337',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 8px 24px rgba(21, 101, 192, 0.1)'
                : '0 8px 24px rgba(0, 0, 0, 0.35)',
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)'
                : 'linear-gradient(90deg, #0d47a1 0%, #1565c0 100%)',
          }),
        },
      },
    },
  })
}
