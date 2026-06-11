import { db } from '@/lib/db/database'
import type { AuthUser, Product, Sale, SaleLine } from '@/lib/db/types'

export type SaleCreateLineInput = {
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
}

export type SaleCreateInput = {
  lines: SaleCreateLineInput[]
  amountPaid: number
}

export type TodaySalesStats = {
  totalSales: number
  orderCount: number
  itemsSold: number
}

function getTodayRange(): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return { start, end }
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

function applyQtyDelta(
  product: Product,
  variantId: string | undefined,
  delta: number,
): Product {
  const beforeQty = getTargetQty(product, variantId)
  const afterQty = beforeQty + delta

  if (afterQty < 0) {
    throw new Error('Insufficient stock for this sale')
  }

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

export async function listSales(): Promise<Sale[]> {
  return db.sales.orderBy('createdAt').reverse().toArray()
}

export async function getTodaySalesStats(): Promise<TodaySalesStats> {
  const { start, end } = getTodayRange()
  const sales = await db.sales
    .where('createdAt')
    .between(start, end, true, true)
    .toArray()

  const completed = sales.filter(
    (sale) => sale.type === 'sale' && sale.status === 'completed',
  )

  return {
    totalSales: completed.reduce((sum, sale) => sum + sale.subtotal, 0),
    orderCount: completed.length,
    itemsSold: completed.reduce((sum, sale) => sum + sale.itemCount, 0),
  }
}

export async function createSale(
  input: SaleCreateInput,
  createdBy: AuthUser,
): Promise<Sale> {
  if (input.lines.length === 0) {
    throw new Error('Sale must include at least one item')
  }

  if (!Number.isFinite(input.amountPaid) || input.amountPaid < 0) {
    throw new Error('Amount paid must be zero or greater')
  }

  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error('Each line quantity must be a whole number greater than zero')
    }

    if (line.unitPrice < 0) {
      throw new Error('Line price must be zero or greater')
    }
  }

  const productIds = [...new Set(input.lines.map((line) => line.productId))]
  const products = await db.products.bulkGet(productIds)
  const productMap = new Map<string, Product>()

  for (const product of products) {
    if (product) {
      productMap.set(product.id, product)
    }
  }

  for (const line of input.lines) {
    const product = productMap.get(line.productId)

    if (!product) {
      throw new Error('Product not found')
    }

    const variantId = line.variantId?.trim() || undefined

    if (variantId && !product.variants.some((variant) => variant.id === variantId)) {
      throw new Error('Variant not found on this product')
    }

    const availableQty = getTargetQty(product, variantId)

    if (line.quantity > availableQty) {
      const label = variantId
        ? `${product.name} (${product.variants.find((variant) => variant.id === variantId)?.name})`
        : product.name
      throw new Error(`Insufficient stock for ${label} (available: ${availableQty})`)
    }
  }

  const saleLines: SaleLine[] = input.lines.map((line) => {
    const product = productMap.get(line.productId)!
    const variantId = line.variantId?.trim() || undefined
    const variant = variantId
      ? product.variants.find((item) => item.id === variantId)
      : undefined

    return {
      productId: product.id,
      productName: product.name,
      variantId,
      variantName: variant?.name,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.unitPrice * line.quantity,
    }
  })

  const subtotal = saleLines.reduce((sum, line) => sum + line.lineTotal, 0)
  const itemCount = saleLines.reduce((sum, line) => sum + line.quantity, 0)

  if (input.amountPaid < subtotal) {
    throw new Error('Amount paid is less than the sale total')
  }

  const sale: Sale = {
    id: crypto.randomUUID(),
    type: 'sale',
    lines: saleLines,
    subtotal,
    amountPaid: input.amountPaid,
    change: input.amountPaid - subtotal,
    itemCount,
    status: 'completed',
    createdById: createdBy.id,
    createdByName: createdBy.displayName,
    createdAt: new Date(),
  }

  await db.transaction('rw', db.products, db.sales, async () => {
    for (const line of input.lines) {
      const product = productMap.get(line.productId)!
      const variantId = line.variantId?.trim() || undefined
      const updated = applyQtyDelta(product, variantId, -line.quantity)
      productMap.set(product.id, updated)
      await db.products.put(updated)
    }

    await db.sales.add(sale)
  })

  return sale
}

export type VoidSaleResult = {
  original: Sale
  restoration: Sale
}

export async function voidSale(id: string, voidedBy: AuthUser): Promise<VoidSaleResult> {
  const sale = await db.sales.get(id)

  if (!sale) {
    throw new Error('Sale not found')
  }

  if (sale.type === 'void') {
    throw new Error('Void records cannot be voided')
  }

  if (sale.status === 'voided') {
    throw new Error('Sale is already voided')
  }

  const productIds = [...new Set(sale.lines.map((line) => line.productId))]
  const products = await db.products.bulkGet(productIds)
  const productMap = new Map<string, Product>()

  for (const product of products) {
    if (product) {
      productMap.set(product.id, product)
    }
  }

  const voidedAt = new Date()

  const voided: Sale = {
    ...sale,
    status: 'voided',
    voidedById: voidedBy.id,
    voidedByName: voidedBy.displayName,
    voidedAt,
  }

  const restoration: Sale = {
    id: crypto.randomUUID(),
    type: 'void',
    originalSaleId: sale.id,
    lines: sale.lines,
    subtotal: sale.subtotal,
    amountPaid: sale.amountPaid,
    change: sale.change,
    itemCount: sale.itemCount,
    status: 'completed',
    createdById: voidedBy.id,
    createdByName: voidedBy.displayName,
    createdAt: voidedAt,
  }

  await db.transaction('rw', db.products, db.sales, async () => {
    for (const line of sale.lines) {
      const product = productMap.get(line.productId)

      if (!product) {
        continue
      }

      const updated = applyQtyDelta(product, line.variantId, line.quantity)
      productMap.set(product.id, updated)
      await db.products.put(updated)
    }

    await db.sales.put(voided)
    await db.sales.add(restoration)
  })

  return { original: voided, restoration }
}
