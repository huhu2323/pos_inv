import { CssBaseline, ThemeProvider } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createAppTheme } from '@/shared/theme/createAppTheme'
import { ThemeModeContext } from '@/shared/theme/themeModeState'

const THEME_MODE_KEY = 'tofu_theme_mode'

function getInitialMode(): PaletteMode {
  const stored = localStorage.getItem(THEME_MODE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode)

  const theme = useMemo(() => createAppTheme(mode), [mode])

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_MODE_KEY, next)
      return next
    })
  }, [])

  const handleSetMode = useCallback(
    (value: PaletteMode | ((prev: PaletteMode) => PaletteMode)) => {
      setMode((current) => {
        const next = typeof value === 'function' ? value(current) : value
        localStorage.setItem(THEME_MODE_KEY, next)
        return next
      })
    },
    [],
  )

  const contextValue = useMemo(
    () => ({
      mode,
      setMode: handleSetMode,
      toggleMode,
    }),
    [mode, handleSetMode, toggleMode],
  )

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
