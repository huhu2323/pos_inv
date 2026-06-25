import { db } from '@/lib/db/database'
import type { Product, ProductVariant } from '@/lib/db/types'
import { DEFAULT_PRODUCT_UNIT_OF_MEASURE } from '@/shared/utils/productUnitOfMeasure'
import {
  DEFAULT_LOW_STOCK_ALERT_MODE,
  normalizeProductVariant,
  resolveStockAlertFields,
  validateLowStockAlert,
} from '@/shared/utils/lowStockAlert'
import { deleteStoredImage } from './imageStorage'

async function cleanupProductImages(product: Product): Promise<void> {
  await deleteStoredImage(product.image)

  for (const variant of product.variants) {
    await deleteStoredImage(variant.image)
  }
}

async function cleanupReplacedImages(
  existing: Product,
  input: ProductInput,
): Promise<void> {
  if (existing.image !== input.image.trim()) {
    await deleteStoredImage(existing.image)
  }

  const nextVariantsById = new Map(input.variants.map((variant) => [variant.id, variant]))

  for (const existingVariant of existing.variants) {
    const nextVariant = nextVariantsById.get(existingVariant.id)

    if (!nextVariant) {
      await deleteStoredImage(existingVariant.image)
      continue
    }

    if (nextVariant.image !== existingVariant.image) {
      await deleteStoredImage(existingVariant.image)
    }
  }
}

export type ProductInput = {
  barcode: string
  shortName: string
  name: string
  defaultPrice: number
  image: string
  description: string
  qty: number
  initialQty?: number
  lowStockAlertMode?: Product['lowStockAlertMode']
  lowStockAlertValue?: number | null
  unitOfMeasure: Product['unitOfMeasure']
  variants: ProductVariant[]
}

function normalizeShortName(shortName: string): string {
  return shortName.trim().toLowerCase()
}

function normalizeBarcode(barcode: string): string {
  return barcode.trim()
}

export async function listProducts(): Promise<Product[]> {
  return db.products.orderBy('createdAt').reverse().toArray()
}

export async function listActiveProducts(): Promise<Product[]> {
  const products = await listProducts()
  return products.filter((product) => product.active === 1)
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return db.products.get(id)
}

export async function isShortNameTaken(
  shortName: string,
  excludeId?: string,
): Promise<boolean> {
  const normalized = normalizeShortName(shortName)
  const existing = await db.products.where('shortName').equals(normalized).first()
  return Boolean(existing && existing.id !== excludeId)
}

export async function isBarcodeTaken(
  barcode: string,
  excludeId?: string,
): Promise<boolean> {
  const normalized = normalizeBarcode(barcode)
  const existing = await db.products.where('barcode').equals(normalized).first()
  return Boolean(existing && existing.id !== excludeId)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const shortName = normalizeShortName(input.shortName)
  const barcode = normalizeBarcode(input.barcode)

  if (!input.name.trim()) {
    throw new Error('Name is required')
  }

  if (!barcode) {
    throw new Error('Barcode is required')
  }

  if (!shortName) {
    throw new Error('Short name is required')
  }

  if (await isBarcodeTaken(barcode)) {
    throw new Error('Barcode is already in use')
  }

  if (await isShortNameTaken(shortName)) {
    throw new Error('Short name is already in use')
  }

  if (input.defaultPrice < 0) {
    throw new Error('Default price must be zero or greater')
  }

  if (input.qty < 0 || !Number.isInteger(input.qty)) {
    throw new Error('Product quantity must be a whole number zero or greater')
  }

  const invalidVariantQty = input.variants.find(
    (variant) => variant.qty < 0 || !Number.isInteger(variant.qty),
  )
  if (invalidVariantQty) {
    throw new Error('Each variant quantity must be a whole number zero or greater')
  }

  const alertFields = resolveStockAlertFields({
    qty: input.qty,
    initialQty: input.initialQty,
    lowStockAlertMode: input.lowStockAlertMode,
    lowStockAlertValue: input.lowStockAlertValue,
  })
  const alertError = validateLowStockAlert(
    alertFields.initialQty,
    alertFields.lowStockAlertMode,
    alertFields.lowStockAlertValue,
  )
  if (alertError) {
    throw new Error(alertError)
  }

  const variants = input.variants.map((variant) => {
    const normalized = normalizeProductVariant(variant)
    const variantAlertError = validateLowStockAlert(
      normalized.initialQty,
      normalized.lowStockAlertMode,
      normalized.lowStockAlertValue,
    )

    if (variantAlertError) {
      throw new Error(`Variant "${normalized.name}": ${variantAlertError}`)
    }

    return normalized
  })

  const now = new Date()
  const product: Product = {
    id: crypto.randomUUID(),
    barcode,
    shortName,
    name: input.name.trim(),
    defaultPrice: input.defaultPrice,
    image: input.image.trim(),
    description: input.description.trim(),
    qty: input.qty,
    initialQty: alertFields.initialQty,
    lowStockAlertMode: alertFields.lowStockAlertMode,
    lowStockAlertValue: alertFields.lowStockAlertValue,
    unitOfMeasure: input.unitOfMeasure ?? DEFAULT_PRODUCT_UNIT_OF_MEASURE,
    active: 1,
    variants,
    createdAt: now,
    updatedAt: now,
  }

  await db.products.add(product)
  return product
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const existing = await db.products.get(id)

  if (!existing) {
    throw new Error('Product not found')
  }

  const shortName = normalizeShortName(input.shortName)
  const barcode = normalizeBarcode(input.barcode)

  if (!input.name.trim()) {
    throw new Error('Name is required')
  }

  if (!barcode) {
    throw new Error('Barcode is required')
  }

  if (!shortName) {
    throw new Error('Short name is required')
  }

  if (await isBarcodeTaken(barcode, id)) {
    throw new Error('Barcode is already in use')
  }

  if (await isShortNameTaken(shortName, id)) {
    throw new Error('Short name is already in use')
  }

  if (input.defaultPrice < 0) {
    throw new Error('Default price must be zero or greater')
  }

  if (input.qty < 0 || !Number.isInteger(input.qty)) {
    throw new Error('Product quantity must be a whole number zero or greater')
  }

  const invalidVariantQty = input.variants.find(
    (variant) => variant.qty < 0 || !Number.isInteger(variant.qty),
  )
  if (invalidVariantQty) {
    throw new Error('Each variant quantity must be a whole number zero or greater')
  }

  const alertFields = resolveStockAlertFields({
    qty: input.qty,
    initialQty: input.initialQty ?? existing.initialQty ?? existing.qty,
    lowStockAlertMode: input.lowStockAlertMode ?? existing.lowStockAlertMode,
    lowStockAlertValue:
      input.lowStockAlertValue !== undefined
        ? input.lowStockAlertValue
        : existing.lowStockAlertValue,
  })
  const alertError = validateLowStockAlert(
    alertFields.initialQty,
    alertFields.lowStockAlertMode,
    alertFields.lowStockAlertValue,
  )
  if (alertError) {
    throw new Error(alertError)
  }

  const variants = input.variants.map((variant) => {
    const normalized = normalizeProductVariant(variant)
    const variantAlertError = validateLowStockAlert(
      normalized.initialQty,
      normalized.lowStockAlertMode,
      normalized.lowStockAlertValue,
    )

    if (variantAlertError) {
      throw new Error(`Variant "${normalized.name}": ${variantAlertError}`)
    }

    return normalized
  })

  const updated: Product = {
    ...existing,
    barcode,
    shortName,
    name: input.name.trim(),
    defaultPrice: input.defaultPrice,
    image: input.image.trim(),
    description: input.description.trim(),
    qty: input.qty,
    initialQty: alertFields.initialQty,
    lowStockAlertMode: alertFields.lowStockAlertMode,
    lowStockAlertValue: alertFields.lowStockAlertValue,
    unitOfMeasure: input.unitOfMeasure ?? existing.unitOfMeasure ?? DEFAULT_PRODUCT_UNIT_OF_MEASURE,
    variants,
    updatedAt: new Date(),
  }

  await cleanupReplacedImages(existing, input)
  await db.products.put(updated)
  return updated
}

export async function setProductActive(id: string, active: 0 | 1): Promise<Product> {
  const existing = await db.products.get(id)

  if (!existing) {
    throw new Error('Product not found')
  }

  const updated: Product = {
    ...existing,
    active,
    updatedAt: new Date(),
  }

  await db.products.put(updated)
  return updated
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await db.products.get(id)

  if (existing) {
    await cleanupProductImages(existing)
  }

  await db.products.delete(id)
}

export function createEmptyVariant(): ProductVariant {
  return {
    id: crypto.randomUUID(),
    name: '',
    price: 0,
    image: '',
    qty: 0,
    initialQty: 0,
    lowStockAlertMode: DEFAULT_LOW_STOCK_ALERT_MODE,
    lowStockAlertValue: null,
  }
}
