import { Box } from '@mui/material'
import { useResolvedImageUrl } from '../hooks/useResolvedImageUrl'

interface ZoomableImageProps {
  image?: string
  alt: string
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  onZoom: (src: string, alt: string) => void
}

export function ZoomableImage({
  image,
  alt,
  width = 120,
  height = 120,
  borderRadius = 2,
  onZoom,
}: ZoomableImageProps) {
  const src = useResolvedImageUrl(image)

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onZoom(src, alt)}
      aria-label={`Zoom ${alt}`}
      sx={{
        border: 'none',
        padding: 0,
        background: 'none',
        cursor: 'zoom-in',
        borderRadius,
        display: 'inline-flex',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width,
          height,
          objectFit: 'cover',
          borderRadius,
          display: 'block',
          bgcolor: 'action.hover',
        }}
      />
    </Box>
  )
}
