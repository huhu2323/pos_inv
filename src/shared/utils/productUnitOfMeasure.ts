export const PRODUCT_UNITS_OF_MEASURE = ['kg', 'pc', 'liter'] as const

export type ProductUnitOfMeasure = (typeof PRODUCT_UNITS_OF_MEASURE)[number]

export const DEFAULT_PRODUCT_UNIT_OF_MEASURE: ProductUnitOfMeasure = 'pc'

export const PRODUCT_UNIT_LABELS: Record<ProductUnitOfMeasure, string> = {
  kg: 'kg',
  pc: 'pc',
  liter: 'L',
}

export function formatQtyWithUnit(qty: number, unit: ProductUnitOfMeasure): string {
  return `${qty} ${PRODUCT_UNIT_LABELS[unit]}`
}

export function isProductUnitOfMeasure(value: unknown): value is ProductUnitOfMeasure {
  return typeof value === 'string' && PRODUCT_UNITS_OF_MEASURE.includes(value as ProductUnitOfMeasure)
}

export function normalizeProductUnitOfMeasure(value: unknown): ProductUnitOfMeasure {
  return isProductUnitOfMeasure(value) ? value : DEFAULT_PRODUCT_UNIT_OF_MEASURE
}
