import type { SvgIconComponent } from '@mui/icons-material'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { monoFontFamily } from '@/shared/theme/stitchDesignTokens'
import { labelCapsSx } from '@/shared/theme/stitchStyles'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  hint?: ReactNode
  icon: SvgIconComponent
  iconColor?: string
  iconBg?: string
  valueColor?: string
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconColor = 'primary.main',
  iconBg = 'action.hover',
  valueColor = 'text.primary',
}: MetricCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ ...labelCapsSx, color: 'text.secondary', mb: 1 }}>{label}</Typography>
          <Typography
            variant="h4"
            sx={{ color: valueColor, fontFamily: valueColor === 'text.primary' ? undefined : monoFontFamily }}
          >
            {value}
          </Typography>
          {hint && <Box sx={{ mt: 1 }}>{hint}</Box>}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon />
        </Box>
      </CardContent>
    </Card>
  )
}
