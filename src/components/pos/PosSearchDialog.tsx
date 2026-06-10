import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { StoredImage } from '../StoredImage'
import {
  filterSellableItems,
  type PosSellableItem,
} from '../../utils/posProducts'
import { formatCurrency } from '../../utils/currency'
import { PosOnScreenKeyboard } from './PosOnScreenKeyboard'
import { getPosPanelFullDialogSx, posPanelDialogSlotProps } from './posPanelDialog'

interface PosSearchDialogProps {
  open: boolean
  items: PosSellableItem[]
  onClose: () => void
  onSelectItem: (item: PosSellableItem) => void
}

export function PosSearchDialog({
  open,
  items,
  onClose,
  onSelectItem,
}: PosSearchDialogProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const results = useMemo(() => filterSellableItems(items, query), [items, query])

  function handleInput(value: string) {
    setQuery((current) => `${current}${value}`)
  }

  function handleBackspace() {
    setQuery((current) => current.slice(0, -1))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disablePortal
      disableScrollLock
      fullWidth
      maxWidth={false}
      slotProps={posPanelDialogSlotProps}
      sx={getPosPanelFullDialogSx()}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SearchIcon />
          <Typography variant="h6">Search products</Typography>
        </Stack>
        <IconButton aria-label="Close search" onClick={onClose} sx={touchCloseSx}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          pt: 0,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 1.5,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {query || 'Type to search by name or barcode'}
        </Paper>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {results.length === 0 ? (
            <Typography color="text.secondary">No matching products.</Typography>
          ) : (
            <Stack spacing={1}>
              {results.map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  onClick={() => onSelectItem(item)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    py: 1.25,
                    px: 2,
                    gap: 1.5,
                  }}
                >
                  <StoredImage
                    image={item.image}
                    alt={item.label}
                    variant="rounded"
                    sx={{ width: 44, height: 44 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(item.price)} · Qty {item.qty}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          )}
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <PosOnScreenKeyboard
            compact
            onInput={handleInput}
            onBackspace={handleBackspace}
            onClear={() => setQuery('')}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

const touchCloseSx = {
  width: 48,
  height: 48,
  border: 1,
  borderColor: 'divider',
} as const
