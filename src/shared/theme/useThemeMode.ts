import { useContext } from 'react'
import { ThemeModeContext } from '@/shared/theme/themeModeState'

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return context
}
