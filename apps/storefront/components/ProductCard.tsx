'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '@dropship/types'
import { addToCart } from '@/lib/cart'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('products')
  const locale = useLocale()

  const name = locale === 'he' ? product.name_he : product.name_en
  const image = product.images?.[0]
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product)
    window.dispatchEvent(new Event('cart-updated'))
  }

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}
        {discount && discount > 0 && (
          <span className="absolute top-2 left-2 bg-slate-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.inventory_count === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-500">{t('out_of_stock')}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-slate-400 mb-1 capitalize">{product.category}</p>
        <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2 group-hover:text-slate-700">
          {name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-slate-900">₪{product.price.toLocaleString()}</span>
            {product.compare_price && (
              <span className="text-xs text-slate-400 line-through">₪{product.compare_price.toLocaleString()}</span>
            )}
          </div>

          {product.inventory_count > 0 && (
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              aria-label={t('add_to_cart')}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
