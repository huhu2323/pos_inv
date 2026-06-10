export type VatBreakdown = {
  netAmount: number
  vatAmount: number
  totalAmount: number
  vatPercentage: number
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateVatBreakdown(
  totalAmount: number,
  vatPercentage: number,
): VatBreakdown {
  const vatAmount = roundCurrency(totalAmount * (vatPercentage / 100))
  const netAmount = roundCurrency(totalAmount - vatAmount)

  return {
    netAmount,
    vatAmount,
    totalAmount: roundCurrency(totalAmount),
    vatPercentage,
  }
}
