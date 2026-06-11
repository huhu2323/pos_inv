const CURRENCY_LOCALE = 'en-PH'
const CURRENCY_CODE = 'PHP'

const formatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return formatter.format(value)
}
