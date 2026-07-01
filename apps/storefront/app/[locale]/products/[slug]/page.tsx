'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ShoppingCart, Minus, Plus, ArrowLeft, CheckCircle, Truck, Shield, RefreshCw } from 'lucide-react'
import type { Product } from '@dropship/types'
import { createBrowserClient, getProductBySlug } from '@dropship/database'
import { addToCart } from '@/lib/cart'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ProductDetailPage({ params }: { params: { slug: string; locale: string } }) {
  const t = useTranslations('product')
  const locale = useLocale()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    const load = async () => {
      const client = createBrowserClient()
      const p = await getProductBySlug(client, params.slug)
      setProduct(p)
      setLoading(false)
    }
    load()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-3/4" />
              <div className="h-6 bg-slate-100 rounded-lg animate-pulse w-1/4" />
              <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Product not found</p>
      </div>
    )
  }

  const name = locale === 'he' ? product.name_he : product.name_en
  const description = locale === 'he' ? product.description_he : product.description_en

  const handleAddToCart = () => {
    addToCart(product, quantity)
    window.dispatchEvent(new Event('cart-updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <a href={`/${locale}`} className="hover:text-slate-700">Home</a>
          <span>/</span>
          <a href={`/${locale}/products`} className="hover:text-slate-700">Products</a>
          <span>/</span>
          <span className="text-slate-700">{name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                  <ShoppingCart className="h-20 w-20" />
                </div>
              )}
              {discount && discount > 0 && (
                <span className="absolute top-4 left-4 bg-slate-900 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-slate-900' : 'border-slate-200'
                    }`}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-2">{product.category}</p>
            )}
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">{name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-semibold text-slate-900">₪{product.price.toLocaleString()}</span>
              {product.compare_price && (
                <span className="text-lg text-slate-400 line-through">₪{product.compare_price.toLocaleString()}</span>
              )}
              {discount && discount > 0 && (
                <span className="text-sm font-medium text-green-600">Save {discount}%</span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-slate-600 leading-relaxed mb-6">{description}</p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {product.inventory_count > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-600">{product.inventory_count} {t('in_stock')}</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-sm text-red-500">Out of stock</span>
                </>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('quantity')}</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-slate-900 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory_count, quantity + 1))}
                  className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.inventory_count === 0}
              className={`w-full h-12 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Added to cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  {t('add_to_cart')}
                </>
              )}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
              {[
                { icon: Truck, text: t('free_shipping') },
                { icon: RefreshCw, text: t('returns') },
                { icon: Shield, text: t('secure') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center text-center gap-1.5">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span className="text-xs text-slate-500">{text}</span>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              {product.sku && (
                <p className="text-xs text-slate-400">{t('sku')}: {product.sku}</p>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
