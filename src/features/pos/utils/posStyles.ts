import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'

export const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'] as const
export const PH_BILLS = [20, 50, 100, 500, 1000] as const

export const touchButtonSx = {
  minHeight: 64,
  fontSize: '1.25rem',
  fontWeight: 700,
} as const

export const touchIconButtonSx = {
  width: 52,
  height: 52,
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
} as const

export const priceTypographySx = {
  fontFamily: monoFontFamily,
  fontWeight: 700,
} as const

export const displayPriceSx = {
  fontFamily: monoFontFamily,
  fontWeight: 700,
  letterSpacing: '-0.02em',
} as const
