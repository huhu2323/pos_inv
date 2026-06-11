import { useMemo, useState } from 'react'
import type { Product, ProductVariant } from '@/lib/db/types'
import type { CartLine } from '@/features/pos/types'
import { lineKey } from '@/features/pos/types'

export function usePosCart() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [amountPaid, setAmountPaid] = useState('')

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  )

  const paidAmount = useMemo(() => {
    const parsed = Number.parseFloat(amountPaid)
    return Number.isFinite(parsed) ? parsed : 0
  }, [amountPaid])

  const change = paidAmount - total
  const canComplete = cart.length > 0 && paidAmount >= total

  function addToCart(product: Product, unitPrice: number, variant?: ProductVariant) {
    const key = lineKey(product.id, variant?.id)

    setCart((current) => {
      const existing = current.find(
        (line) => lineKey(line.productId, line.variantId) === key,
      )

      if (existing) {
        return current.map((line) =>
          line.lineId === existing.lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }

      return [
        ...current,
        {
          lineId: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPrice,
          quantity: 1,
        },
      ]
    })
  }

  function updateQuantity(lineId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.lineId === lineId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  function removeLine(lineId: string) {
    setCart((current) => current.filter((line) => line.lineId !== lineId))
  }

  function clearCart() {
    setCart([])
    setAmountPaid('')
  }

  return {
    cart,
    amountPaid,
    setAmountPaid,
    total,
    paidAmount,
    change,
    canComplete,
    addToCart,
    updateQuantity,
    removeLine,
    clearCart,
  }
}
