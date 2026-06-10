import { Capacitor } from '@capacitor/core'
import { db } from '../db/database'

export const DEFAULT_PRODUCT_IMAGE = `${import.meta.env.BASE_URL}default-product.svg`
export const IMAGE_KEY_PREFIX = 'img:'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const OPFS_DIR = 'product-images'

interface StoredImageRecord {
  id: string
  blob: Blob
  mimeType: string
  createdAt: Date
}

function getImageId(imageKey: string): string {
  return imageKey.slice(IMAGE_KEY_PREFIX.length)
}

export function isStoredImageKey(value: string): boolean {
  return value.startsWith(IMAGE_KEY_PREFIX)
}

export function isDataUrl(value: string): boolean {
  return value.startsWith('data:')
}

export function isOpfsSupported(): boolean {
  return (
    !Capacitor.isNativePlatform() &&
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in navigator.storage
  )
}

function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 2 MB or smaller')
  }
}

async function saveToOpfs(id: string, file: File): Promise<void> {
  const root = await navigator.storage.getDirectory()
  const dir = await root.getDirectoryHandle(OPFS_DIR, { create: true })
  const fileHandle = await dir.getFileHandle(id, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(file)
  await writable.close()
}

async function readFromOpfs(id: string): Promise<Blob | null> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle(OPFS_DIR)
    const fileHandle = await dir.getFileHandle(id)
    return fileHandle.getFile()
  } catch {
    return null
  }
}

async function deleteFromOpfs(id: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle(OPFS_DIR)
    await dir.removeEntry(id)
  } catch {
    // File may already be gone.
  }
}

async function saveToIndexedDb(id: string, file: File): Promise<void> {
  const record: StoredImageRecord = {
    id,
    blob: file,
    mimeType: file.type,
    createdAt: new Date(),
  }
  await db.images.put(record)
}

async function readFromIndexedDb(id: string): Promise<Blob | null> {
  const record = await db.images.get(id)
  return record?.blob ?? null
}

async function deleteFromIndexedDb(id: string): Promise<void> {
  await db.images.delete(id)
}

export async function saveImage(file: File): Promise<string> {
  validateImageFile(file)

  const id = crypto.randomUUID()

  if (isOpfsSupported()) {
    await saveToOpfs(id, file)
  } else {
    await saveToIndexedDb(id, file)
  }

  return `${IMAGE_KEY_PREFIX}${id}`
}

export async function getImageBlob(imageKey: string): Promise<Blob | null> {
  if (!isStoredImageKey(imageKey)) {
    return null
  }

  const id = getImageId(imageKey)

  if (isOpfsSupported()) {
    const opfsBlob = await readFromOpfs(id)
    if (opfsBlob) {
      return opfsBlob
    }
  }

  return readFromIndexedDb(id)
}

export async function getImageObjectUrl(imageKey: string): Promise<string | null> {
  const blob = await getImageBlob(imageKey)
  if (!blob) {
    return null
  }

  return URL.createObjectURL(blob)
}

export async function deleteStoredImage(imageKey: string | undefined): Promise<void> {
  if (!imageKey || !isStoredImageKey(imageKey)) {
    return
  }

  const id = getImageId(imageKey)

  if (isOpfsSupported()) {
    await deleteFromOpfs(id)
  }

  await deleteFromIndexedDb(id)
}

export async function resolveImageUrl(image?: string): Promise<string> {
  const trimmed = image?.trim()

  if (!trimmed) {
    return DEFAULT_PRODUCT_IMAGE
  }

  if (isDataUrl(trimmed) || trimmed.startsWith('/')) {
    return trimmed
  }

  if (isStoredImageKey(trimmed)) {
    const objectUrl = await getImageObjectUrl(trimmed)
    return objectUrl ?? DEFAULT_PRODUCT_IMAGE
  }

  return DEFAULT_PRODUCT_IMAGE
}

export function getImageStorageLabel(): string {
  if (isOpfsSupported()) {
    return 'Stored locally on this device (OPFS)'
  }

  return 'Stored locally in browser storage'
}
