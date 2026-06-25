import type { Product, ProductVariant } from '@/lib/db/types'

export type PosSellableItem = {
  key: string
  product: Product
  variant?: ProductVariant
  label: string
  image: string
  price: number
  qty: number
}

export function buildSellableItems(products: Product[]): PosSellableItem[] {
  return products.flatMap((product) => {
    if (product.variants.length === 0) {
      return [
        {
          key: product.id,
          product,
          label: product.name,
          image: product.image,
          price: product.defaultPrice,
          qty: product.qty,
        },
      ]
    }

    return product.variants.map((variant) => ({
      key: `${product.id}:${variant.id}`,
      product,
      variant,
      label: `${product.name} · ${variant.name}`,
      image: variant.image || product.image,
      price: variant.price,
      qty: variant.qty,
    }))
  })
}

export function sortSellableItemsByPopularity(
  items: PosSellableItem[],
  purchaseCounts: Map<string, number>,
): PosSellableItem[] {
  return [...items].sort((a, b) => {
    const countDiff = (purchaseCounts.get(b.key) ?? 0) - (purchaseCounts.get(a.key) ?? 0)
    if (countDiff !== 0) {
      return countDiff
    }

    return a.label.localeCompare(b.label)
  })
}

export function filterSellableItems(
  items: PosSellableItem[],
  query: string,
): PosSellableItem[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter((item) => {
    const haystack = [
      item.label,
      item.product.name,
      item.product.shortName,
      item.product.barcode,
      item.variant?.name ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}

export function findProductByBarcode(
  products: Product[],
  barcode: string,
): Product | undefined {
  const normalized = barcode.trim()
  if (!normalized) {
    return undefined
  }

  return products.find((product) => product.barcode === normalized)
}

export function toSellableItem(
  product: Product,
  variant?: ProductVariant,
): PosSellableItem {
  if (variant) {
    return {
      key: `${product.id}:${variant.id}`,
      product,
      variant,
      label: `${product.name} · ${variant.name}`,
      image: variant.image || product.image,
      price: variant.price,
      qty: variant.qty,
    }
  }

  return {
    key: product.id,
    product,
    label: product.name,
    image: product.image,
    price: product.defaultPrice,
    qty: product.qty,
  }
}
