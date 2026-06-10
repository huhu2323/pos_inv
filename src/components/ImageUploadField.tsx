import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import {
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useResolvedImageUrl } from '../hooks/useResolvedImageUrl'
import {
  getImageStorageLabel,
  isStoredImageKey,
  saveImage,
} from '../services/imageStorage'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  size?: number
}

export function ImageUploadField({
  label,
  value,
  onChange,
  size = 72,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const previewSrc = useResolvedImageUrl(value)
  const hasCustomImage = Boolean(value.trim())

  async function handleFileChange(file: File | undefined) {
    if (!file) {
      return
    }

    setError(null)
    setUploading(true)

    try {
      const imageKey = await saveImage(file)
      onChange(imageKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Avatar
          src={previewSrc}
          alt={label}
          variant="rounded"
          sx={{ width: size, height: size, bgcolor: 'action.hover' }}
        >
          <ImageOutlinedIcon />
        </Avatar>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Saving...' : hasCustomImage ? 'Change image' : 'Upload image'}
            </Button>
            {hasCustomImage && (
              <Button
                size="small"
                color="inherit"
                onClick={() => onChange('')}
                disabled={uploading}
              >
                Use default
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {hasCustomImage
              ? isStoredImageKey(value)
                ? getImageStorageLabel()
                : 'Legacy image'
              : 'Uses the default placeholder when empty'}
          </Typography>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => void handleFileChange(event.target.files?.[0])}
        />
      </Stack>
    </Box>
  )
}
