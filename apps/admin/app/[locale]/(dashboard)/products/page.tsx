'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '@dropship/types'
import { createBrowserClient, getProducts, upsertProduct, deleteProduct } from '@dropship/database'

const emptyProduct = (): Partial<Product> => ({
  name_en: '', name_he: '', description_en: '', description_he: '',
  slug: '', sku: '', price: 0, compare_price: undefined, cost_price: undefined,
  inventory_count: 0, category: '', is_active: true, images: [],
})

export default function ProductsPage() {
  const t = useTranslations('products')
  const locale = useLocale()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const client = createBrowserClient()
    const res = await getProducts(client, { search: search || undefined, page, pageSize: 15, activeOnly: false })
    setProducts(res.data)
    setTotal(res.count)
    setTotalPages(res.totalPages)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, page])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const client = createBrowserClient()
      if (!editing.slug && editing.name_en) {
        editing.slug = editing.name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      await upsertProduct(client, editing)
      await load()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return
    const client = createBrowserClient()
    await deleteProduct(client, id)
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} products</p>
        </div>
        <button
          onClick={() => setEditing(emptyProduct())}
          className="flex items-center gap-2 h-9 px-4 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {t('add_product')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t('search')}
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">{t('no_products')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const name = locale === 'he' ? product.name_he : product.name_en
            const image = product.images?.[0]
            return (
              <div key={product.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
                <div className="relative aspect-[4/3] bg-slate-50">
                  {image ? (
                    <Image src={image.url} alt={name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-200 text-3xl">📦</div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">Inactive</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                  <p className="text-xs text-slate-400 mb-2">{product.sku ?? '—'} · {product.category ?? '—'}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">₪{product.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-2">{product.inventory_count} in stock</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(product)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-xs font-medium ${p === page ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-semibold text-slate-900">{editing.id ? t('edit') : t('add_product')}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 grid sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {[
                { key: 'name_en', label: 'Name (EN)' },
                { key: 'name_he', label: 'Name (HE)' },
                { key: 'slug', label: 'Slug' },
                { key: 'sku', label: 'SKU' },
                { key: 'category', label: 'Category' },
                { key: 'price', label: 'Price', type: 'number' },
                { key: 'compare_price', label: 'Compare Price', type: 'number' },
                { key: 'cost_price', label: 'Cost Price', type: 'number' },
                { key: 'inventory_count', label: 'Inventory', type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={String(editing[field.key as keyof typeof editing] ?? '')}
                    onChange={(e) => setEditing(p => ({ ...p!, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description (EN)</label>
                <textarea
                  rows={2}
                  value={String(editing.description_en ?? '')}
                  onChange={(e) => setEditing(p => ({ ...p!, description_en: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description (HE)</label>
                <textarea
                  rows={2}
                  value={String(editing.description_he ?? '')}
                  onChange={(e) => setEditing(p => ({ ...p!, description_he: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing(p => ({ ...p!, is_active: e.target.checked }))}
                  className="accent-slate-900"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
