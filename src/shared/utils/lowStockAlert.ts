import type { Product, ProductUnitOfMeasure, ProductVariant } from '@/lib/db/types'

export const LOW_STOCK_ALERT_MODES = ['off', 'unit'] as const

export type LowStockAlertMode = (typeof LOW_STOCK_ALERT_MODES)[number]

export const DEFAULT_LOW_STOCK_ALERT_MODE: LowStockAlertMode = 'off'

export interface StockAlertTarget {
  qty: number
  initialQty: number
  lowStockAlertMode: LowStockAlertMode
  lowStockAlertValue: number | null
}

export interface LowStockAlertItem {
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  qty: number
  initialQty: number
  threshold: number
  unitOfMeasure: ProductUnitOfMeasure
}

export function normalizeLowStockAlertMode(value: unknown): LowStockAlertMode {
  if (value === 'unit') {
    return 'unit'
  }

  return 'off'
}

export function validateLowStockAlert(
  initialQty: number,
  mode: LowStockAlertMode,
  value: number | null | undefined,
): string | null {
  if (mode === 'off') {
    return null
  }

  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Low stock alert threshold is required'
  }

  if (!Number.isInteger(value) || value < 0) {
    return 'Unit threshold must be a whole number zero or greater'
  }

  if (initialQty <= 0) {
    return 'Initial quantity must be greater than zero for unit alerts'
  }

  if (value > initialQty - 1) {
    return `Unit threshold cannot exceed ${initialQty - 1} (initial qty minus 1)`
  }

  return null
}

export function getLowStockThreshold(target: StockAlertTarget): number | null {
  if (target.lowStockAlertMode === 'off' || target.lowStockAlertValue === null) {
    return null
  }

  return target.lowStockAlertValue
}

export function isLowStock(target: StockAlertTarget): boolean {
  const threshold = getLowStockThreshold(target)

  if (threshold === null) {
    return false
  }

  return target.qty <= threshold
}

export function resolveStockAlertFields(input: {
  qty: number
  initialQty?: number
  lowStockAlertMode?: LowStockAlertMode
  lowStockAlertValue?: number | null
}): Pick<Product, 'initialQty' | 'lowStockAlertMode' | 'lowStockAlertValue'> {
  const initialQty = input.initialQty ?? input.qty
  const lowStockAlertMode = input.lowStockAlertMode ?? DEFAULT_LOW_STOCK_ALERT_MODE
  const lowStockAlertValue =
    lowStockAlertMode === 'off' ? null : (input.lowStockAlertValue ?? null)

  return {
    initialQty,
    lowStockAlertMode,
    lowStockAlertValue,
  }
}

export function normalizeProductVariant(variant: ProductVariant): ProductVariant {
  const qty = variant.qty ?? 0

  return {
    ...variant,
    qty,
    initialQty: variant.initialQty ?? qty,
    lowStockAlertMode: normalizeLowStockAlertMode(variant.lowStockAlertMode),
    lowStockAlertValue:
      normalizeLowStockAlertMode(variant.lowStockAlertMode) === 'off'
        ? null
        : (variant.lowStockAlertValue ?? null),
  }
}

function toAlertItem(
  product: Product,
  target: StockAlertTarget,
  variantId?: string,
  variantName?: string,
): LowStockAlertItem | null {
  if (!isLowStock(target)) {
    return null
  }

  const threshold = getLowStockThreshold(target)

  if (threshold === null) {
    return null
  }

  return {
    productId: product.id,
    productName: product.name,
    variantId,
    variantName,
    qty: target.qty,
    initialQty: target.initialQty,
    threshold,
    unitOfMeasure: product.unitOfMeasure,
  }
}

export function collectLowStockAlerts(products: Product[]): LowStockAlertItem[] {
  const alerts: LowStockAlertItem[] = []

  for (const product of products) {
    if (product.active !== 1) {
      continue
    }

    const baseAlert = toAlertItem(product, {
      qty: product.qty,
      initialQty: product.initialQty ?? product.qty,
      lowStockAlertMode: normalizeLowStockAlertMode(product.lowStockAlertMode),
      lowStockAlertValue: product.lowStockAlertValue ?? null,
    })

    if (baseAlert) {
      alerts.push(baseAlert)
    }

    for (const variant of product.variants.map(normalizeProductVariant)) {
      const variantAlert = toAlertItem(
        product,
        {
          qty: variant.qty,
          initialQty: variant.initialQty,
          lowStockAlertMode: variant.lowStockAlertMode,
          lowStockAlertValue: variant.lowStockAlertValue,
        },
        variant.id,
        variant.name,
      )

      if (variantAlert) {
        alerts.push(variantAlert)
      }
    }
  }

  return sortLowStockAlertsBySeverity(alerts)
}

export function sortLowStockAlertsBySeverity(alerts: LowStockAlertItem[]): LowStockAlertItem[] {
  return [...alerts].sort((left, right) => {
    if (left.qty !== right.qty) {
      return left.qty - right.qty
    }

    if (left.threshold !== right.threshold) {
      return left.threshold - right.threshold
    }

    return formatLowStockAlertLabel(left).localeCompare(formatLowStockAlertLabel(right))
  })
}

export function formatLowStockAlertLabel(item: LowStockAlertItem): string {
  if (item.variantName) {
    return `${item.productName} (${item.variantName})`
  }

  return item.productName
}
