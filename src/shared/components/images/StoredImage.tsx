import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { Avatar, type AvatarProps } from '@mui/material'
import { useResolvedImageUrl } from '@/shared/hooks/useResolvedImageUrl'

interface StoredImageProps extends AvatarProps {
  image?: string
}

export function StoredImage({ image, alt, children, ...props }: StoredImageProps) {
  const src = useResolvedImageUrl(image)

  return (
    <Avatar src={src} alt={alt} {...props}>
      {children ?? <ImageOutlinedIcon />}
    </Avatar>
  )
}
