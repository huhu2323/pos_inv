import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { LOW_STOCK_ALERT_MODES, type LowStockAlertMode } from '@/shared/utils/lowStockAlert'

interface LowStockAlertFieldsProps {
  initialQty: string
  mode: LowStockAlertMode
  value: string
  onInitialQtyChange: (value: string) => void
  onModeChange: (mode: LowStockAlertMode) => void
  onValueChange: (value: string) => void
  unitLabel?: string
  compact?: boolean
}

export function LowStockAlertFields({
  initialQty,
  mode,
  value,
  onInitialQtyChange,
  onModeChange,
  onValueChange,
  unitLabel = 'units',
  compact = false,
}: LowStockAlertFieldsProps) {
  const parsedInitialQty = Number(initialQty)
  const unitMax =
    Number.isInteger(parsedInitialQty) && parsedInitialQty > 0 ? parsedInitialQty - 1 : undefined

  return (
    <Stack spacing={compact ? 1.5 : 2}>
      {!compact && (
        <Typography variant="subtitle2" color="text.secondary">
          Low stock alert
        </Typography>
      )}

      <TextField
        label="Initial quantity"
        type="number"
        value={initialQty}
        onChange={(event) => onInitialQtyChange(event.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        fullWidth
        helperText="Starting stock level used to cap the unit alert threshold"
      />

      <FormControl fullWidth>
        <InputLabel id="low-stock-alert-mode-label">Alert mode</InputLabel>
        <Select
          labelId="low-stock-alert-mode-label"
          label="Alert mode"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as LowStockAlertMode)}
        >
          {LOW_STOCK_ALERT_MODES.map((option) => (
            <MenuItem key={option} value={option}>
              {option === 'off' ? 'Off' : 'By unit'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {mode === 'unit' && (
        <TextField
          label={`Alert at or below (${unitLabel})`}
          type="number"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          slotProps={{
            htmlInput: {
              min: 0,
              max: unitMax,
              step: 1,
            },
          }}
          fullWidth
          required
          helperText={
            unitMax !== undefined
              ? `Whole number from 0 to ${unitMax}`
              : 'Set initial quantity above zero for unit alerts'
          }
        />
      )}
    </Stack>
  )
}
