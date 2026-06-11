import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { PaletteMode } from '@mui/material'

export interface ThemeModeContextValue {
  mode: PaletteMode
  setMode: Dispatch<SetStateAction<PaletteMode>>
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)
