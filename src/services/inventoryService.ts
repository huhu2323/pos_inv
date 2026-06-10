import { db } from '../db/database'
import type { AuthUser, InventoryLog, InventoryMovementType, Product } from '../db/types'

export type InventoryCreateInput = {
  productId: string
  variantId?: string
  type: InventoryMovementType
  qty: number
  reference: string
}

function getTargetQty(product: Product, variantId?: string): number {
  if (variantId) {
    const variant = product.variants.find((item) => item.id === variantId)
    if (!variant) {
      throw new Error('Variant not found on this product')
    }
    return variant.qty
  }

  return product.qty
}

function applyQtyUpdate(
  product: Product,
  variantId: string | undefined,
  afterQty: number,
): Product {
  if (variantId) {
    return {
      ...product,
      variants: product.variants.map((variant) =>
        variant.id === variantId ? { ...variant, qty: afterQty } : variant,
      ),
      updatedAt: new Date(),
    }
  }

  return {
    ...product,
    qty: afterQty,
    updatedAt: new Date(),
  }
}

export async function listInventoryLogs(): Promise<InventoryLog[]> {
  return db.inventoryLogs.orderBy('createdAt').reverse().toArray()
}

export async function createInventoryLog(
  input: InventoryCreateInput,
  createdBy: AuthUser,
): Promise<InventoryLog> {
  if (!input.productId) {
    throw new Error('Product is required')
  }

  if (!Number.isInteger(input.qty) || input.qty <= 0) {
    throw new Error('Quantity must be a whole number greater than zero')
  }

  const product = await db.products.get(input.productId)

  if (!product) {
    throw new Error('Product not found')
  }

  const variantId = input.variantId?.trim() || undefined

  if (variantId) {
    const variantExists = product.variants.some((variant) => variant.id === variantId)
    if (!variantExists) {
      throw new Error('Variant not found on this product')
    }
  }

  const beforeQty = getTargetQty(product, variantId)

  if (input.type === 'outbound') {
    if (beforeQty <= 0) {
      throw new Error('Cannot outbound stock when quantity is zero')
    }

    if (input.qty > beforeQty) {
      throw new Error(`Cannot outbound more than available stock (${beforeQty})`)
    }
  }

  const afterQty =
    input.type === 'inbound' ? beforeQty + input.qty : beforeQty - input.qty

  const variant = variantId
    ? product.variants.find((item) => item.id === variantId)
    : undefined

  const log: InventoryLog = {
    id: crypto.randomUUID(),
    productId: product.id,
    productName: product.name,
    variantId,
    variantName: variant?.name,
    type: input.type,
    qty: input.qty,
    reference: input.reference.trim(),
    beforeQty,
    afterQty,
    createdById: createdBy.id,
    createdByName: createdBy.displayName,
    createdAt: new Date(),
  }

  const updatedProduct = applyQtyUpdate(product, variantId, afterQty)

  await db.transaction('rw', db.products, db.inventoryLogs, async () => {
    await db.products.put(updatedProduct)
    await db.inventoryLogs.add(log)
  })

  return log
}
