import { Chip, type ChipProps } from '@mui/material'

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'

const variantStyles: Record<
  StatusVariant,
  { bgcolor: string; color: string }
> = {
  success: { bgcolor: '#82f9be', color: '#005235' },
  error: { bgcolor: '#ffdad6', color: '#93000a' },
  warning: { bgcolor: '#afecff', color: '#004e5d' },
  info: { bgcolor: '#dae2ff', color: '#0040a2' },
  neutral: { bgcolor: '#e8edff', color: '#434654' },
}

interface StatusChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  status?: StatusVariant
}

export function StatusChip({ status = 'neutral', label, sx, ...props }: StatusChipProps) {
  const colors = variantStyles[status]
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: colors.bgcolor,
        color: colors.color,
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        height: 24,
        borderRadius: 999,
        ...sx,
      }}
      {...props}
    />
  )
}
