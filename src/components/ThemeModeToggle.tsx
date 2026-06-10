import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { IconButton, Tooltip } from '@mui/material'
import { useThemeMode } from '../theme/useThemeMode'

interface ThemeModeToggleProps {
  color?: 'inherit' | 'default' | 'primary'
}

export function ThemeModeToggle({ color = 'default' }: ThemeModeToggleProps) {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      <IconButton color={color} onClick={toggleMode} aria-label="Toggle theme mode">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  )
}
