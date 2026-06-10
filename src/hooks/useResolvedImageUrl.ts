import { useEffect, useState } from 'react'
import {
  DEFAULT_PRODUCT_IMAGE,
  isDataUrl,
  isStoredImageKey,
  resolveImageUrl,
} from '../services/imageStorage'

export function useResolvedImageUrl(image?: string): string {
  const [url, setUrl] = useState(() => {
    const trimmed = image?.trim()
    if (!trimmed || isStoredImageKey(trimmed)) {
      return DEFAULT_PRODUCT_IMAGE
    }
    if (isDataUrl(trimmed) || trimmed.startsWith('/')) {
      return trimmed
    }
    return DEFAULT_PRODUCT_IMAGE
  })

  useEffect(() => {
    let objectUrl: string | null = null
    let active = true

    async function load() {
      const resolved = await resolveImageUrl(image)

      if (!active) {
        if (resolved.startsWith('blob:')) {
          URL.revokeObjectURL(resolved)
        }
        return
      }

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }

      if (resolved.startsWith('blob:')) {
        objectUrl = resolved
      }

      setUrl(resolved)
    }

    void load()

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [image])

  return url
}
