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
  level: Exclude<StockAlertLevel, 'ok'>
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

export const STOCK_ALERT_LEVELS = ['ok', 'low', 'critical', 'out_of_stock'] as const

export type StockAlertLevel = (typeof STOCK_ALERT_LEVELS)[number]

/** Stock at or below this fraction of initial qty is treated as critical. */
export const CRITICAL_STOCK_RATIO = 0.25

export function getStockAlertLevel(input: {
  qty: number
  initialQty: number
  threshold: number
}): StockAlertLevel {
  if (input.qty === 0) {
    return 'out_of_stock'
  }

  if (input.qty > input.threshold) {
    return 'ok'
  }

  const ratio = input.initialQty > 0 ? input.qty / input.initialQty : 1
  const criticalPoint = Math.max(1, Math.ceil(input.threshold / 2))

  if (ratio <= CRITICAL_STOCK_RATIO || input.qty <= criticalPoint) {
    return 'critical'
  }

  return 'low'
}

export function stockAlertLevelLabel(level: StockAlertLevel): string {
  switch (level) {
    case 'out_of_stock':
      return 'Out of stock'
    case 'critical':
      return 'Critical'
    case 'low':
      return 'Low stock'
    default:
      return 'In stock'
  }
}

export function stockAlertLevelToChipStatus(
  level: StockAlertLevel,
): 'success' | 'error' | 'warning' | 'neutral' {
  switch (level) {
    case 'out_of_stock':
    case 'critical':
      return 'error'
    case 'low':
      return 'warning'
    default:
      return 'success'
  }
}

const STOCK_ALERT_SEVERITY: Record<StockAlertLevel, number> = {
  out_of_stock: 0,
  critical: 1,
  low: 2,
  ok: 3,
}

export function compareStockAlertSeverity(left: StockAlertLevel, right: StockAlertLevel): number {
  return STOCK_ALERT_SEVERITY[left] - STOCK_ALERT_SEVERITY[right]
}

export function countCriticalStockAlerts(alerts: LowStockAlertItem[]): number {
  return alerts.filter((alert) => alert.level === 'critical' || alert.level === 'out_of_stock')
    .length
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
  const qty = Number(variant.qty ?? 0)

  return {
    ...variant,
    qty,
    initialQty: variant.initialQty != null ? Number(variant.initialQty) : qty,
    lowStockAlertMode: normalizeLowStockAlertMode(variant.lowStockAlertMode),
    lowStockAlertValue:
      normalizeLowStockAlertMode(variant.lowStockAlertMode) === 'off'
        ? null
        : variant.lowStockAlertValue != null
          ? Number(variant.lowStockAlertValue)
          : null,
  }
}

function isProductActive(product: Product): boolean {
  return Number(product.active) === 1
}

function coerceStockTarget(target: StockAlertTarget): StockAlertTarget {
  return {
    qty: Number(target.qty),
    initialQty: Number(target.initialQty),
    lowStockAlertMode: target.lowStockAlertMode,
    lowStockAlertValue:
      target.lowStockAlertValue === null ? null : Number(target.lowStockAlertValue),
  }
}

function resolveVariantStockAlertTarget(
  product: Product,
  variant: ProductVariant,
): StockAlertTarget {
  const normalized = normalizeProductVariant(variant)

  if (normalized.lowStockAlertMode === 'unit') {
    return coerceStockTarget({
      qty: normalized.qty,
      initialQty: normalized.initialQty,
      lowStockAlertMode: normalized.lowStockAlertMode,
      lowStockAlertValue: normalized.lowStockAlertValue,
    })
  }

  return coerceStockTarget({
    qty: normalized.qty,
    initialQty: normalized.initialQty,
    lowStockAlertMode: normalizeLowStockAlertMode(product.lowStockAlertMode),
    lowStockAlertValue: product.lowStockAlertValue ?? null,
  })
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

  const level = getStockAlertLevel({
    qty: target.qty,
    initialQty: target.initialQty,
    threshold,
  })

  if (level === 'ok') {
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
    level,
  }
}

export function collectLowStockAlerts(products: Product[]): LowStockAlertItem[] {
  const alerts: LowStockAlertItem[] = []

  for (const product of products) {
    if (!isProductActive(product)) {
      continue
    }

    const variants = product.variants.map(normalizeProductVariant)

    if (variants.length === 0) {
      const baseAlert = toAlertItem(
        product,
        coerceStockTarget({
          qty: product.qty,
          initialQty: product.initialQty ?? product.qty,
          lowStockAlertMode: normalizeLowStockAlertMode(product.lowStockAlertMode),
          lowStockAlertValue: product.lowStockAlertValue ?? null,
        }),
      )

      if (baseAlert) {
        alerts.push(baseAlert)
      }

      continue
    }

    for (const variant of variants) {
      const variantAlert = toAlertItem(
        product,
        resolveVariantStockAlertTarget(product, variant),
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
    const severity = compareStockAlertSeverity(left.level, right.level)
    if (severity !== 0) {
      return severity
    }

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
