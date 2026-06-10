import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined'
import { Box, Button, IconButton } from '@mui/material'

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
] as const

interface PosOnScreenKeyboardProps {
  onInput: (value: string) => void
  onBackspace: () => void
  onClear: () => void
  disabled?: boolean
  compact?: boolean
}

export function PosOnScreenKeyboard({
  onInput,
  onBackspace,
  onClear,
  disabled = false,
  compact = false,
}: PosOnScreenKeyboardProps) {
  const keyHeight = compact ? 48 : 72
  const keyFontSize = compact ? '1rem' : '1.5rem'
  const keyGap = compact ? 0.75 : 1.5
  const backspaceWidth = compact ? 64 : 88
  const backspaceIconSize = compact ? 24 : 32

  const touchKeySx = {
    minHeight: keyHeight,
    minWidth: 0,
    fontSize: keyFontSize,
    fontWeight: 700,
    px: compact ? 0.25 : 0.5,
    borderRadius: 2,
  } as const

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: keyGap, width: '100%' }}>
      {LETTER_ROWS.map((row) => (
        <Box
          key={row.join('')}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
            gap: keyGap,
          }}
        >
          {row.map((key) => (
            <Button
              key={key}
              variant="contained"
              color="inherit"
              disabled={disabled}
              onClick={() => onInput(key)}
              sx={touchKeySx}
            >
              {key.toUpperCase()}
            </Button>
          ))}
        </Box>
      ))}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: keyGap }}>
        <Button
          variant="contained"
          color="inherit"
          disabled={disabled}
          onClick={() => onInput(' ')}
          sx={{ ...touchKeySx, minHeight: keyHeight }}
        >
          Space
        </Button>
        <IconButton
          aria-label="Backspace"
          disabled={disabled}
          onClick={onBackspace}
          sx={{
            width: backspaceWidth,
            height: keyHeight,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <BackspaceOutlinedIcon sx={{ fontSize: backspaceIconSize }} />
        </IconButton>
        <Button
          variant="outlined"
          color="inherit"
          disabled={disabled}
          onClick={onClear}
          sx={{ ...touchKeySx, minWidth: compact ? 72 : 100, minHeight: keyHeight }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  )
}
