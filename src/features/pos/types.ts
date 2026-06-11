export type CartLine = {
  lineId: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
}

export function lineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}
