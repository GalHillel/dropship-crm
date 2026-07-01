import { type CartItem, type Product } from '@dropship/types'

const CART_KEY = 'dropship_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(product: Product, quantity = 1): CartItem[] {
  const cart = getCart()
  const existing = cart.find((i) => i.product.id === product.id)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ product, quantity })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter((i) => i.product.id !== productId)
  saveCart(cart)
  return cart
}

export function updateQuantity(productId: string, quantity: number): CartItem[] {
  const cart = getCart().map((i) =>
    i.product.id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
  )
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  saveCart([])
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
