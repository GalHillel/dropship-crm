'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem } from '@dropship/types'
import { getCart, removeFromCart, updateQuantity, getCartSubtotal } from '@/lib/cart'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const t = useTranslations('cart')
  const locale = useLocale()
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const refresh = () => setItems(getCart())
    refresh()
    window.addEventListener('cart-updated', refresh)
    return () => window.removeEventListener('cart-updated', refresh)
  }, [open])

  const handleRemove = (id: string) => {
    setItems(removeFromCart(id))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleQty = (id: string, qty: number) => {
    setItems(updateQuantity(id, qty))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const subtotal = getCartSubtotal(items)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t('title')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-200" />
              <p className="text-sm text-slate-500">{t('empty')}</p>
              <button
                onClick={onClose}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                {t('empty_cta')}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const name = locale === 'he' ? item.product.name_he : item.product.name_en
              const image = item.product.images?.[0]
              return (
                <div key={item.product.id} className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-lg bg-slate-50 overflow-hidden shrink-0">
                    {image && (
                      <Image src={image.url} alt={name} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <p className="text-sm text-slate-500">₪{item.product.price.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => handleQty(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQty(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      ₪{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t('subtotal')}</span>
              <span className="font-semibold text-slate-900">₪{subtotal.toLocaleString()}</span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              onClick={onClose}
              className="block w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors text-center leading-[44px]"
            >
              {t('checkout')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
