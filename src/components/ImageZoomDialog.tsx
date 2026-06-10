import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  Dialog,
  IconButton,
  Typography,
} from '@mui/material'

interface ImageZoomDialogProps {
  open: boolean
  src: string
  alt: string
  onClose: () => void
}

export function ImageZoomDialog({ open, src, alt, onClose }: ImageZoomDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box sx={{ position: 'relative', p: 2 }}>
        <IconButton
          onClick={onClose}
          aria-label="Close image preview"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ mb: 2, pr: 5 }}>
          {alt}
        </Typography>
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: 2,
            display: 'block',
            bgcolor: 'action.hover',
          }}
        />
      </Box>
    </Dialog>
  )
}
