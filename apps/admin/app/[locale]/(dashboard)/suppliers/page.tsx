'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Plus, X, Pencil, Star, Globe, Mail, Phone, Clock } from 'lucide-react'
import { createBrowserClient } from '@dropship/database'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  country: string | null
  lead_time_days: number
  rating: number | null
  minimum_order: number
  is_active: boolean
  notes: string | null
  created_at: string
}

const empty = (): Partial<Supplier> => ({
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  country: '',
  lead_time_days: 7,
  rating: null,
  minimum_order: 0,
  is_active: true,
  notes: '',
})

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-white/25 text-xs">—</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? 'fill-white/70 text-white/70' : 'text-white/15'}`}
        />
      ))}
    </div>
  )
}

export default function SuppliersPage() {
  const t = useTranslations('suppliers')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const client = createBrowserClient()
    let query = client.from('suppliers').select('*').order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setSuppliers((data as Supplier[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  const handleSave = async () => {
    if (!editing?.name) return
    setSaving(true)
    try {
      const client = createBrowserClient()
      const payload = {
        name: editing.name,
        contact_name: editing.contact_name || null,
        email: editing.email || null,
        phone: editing.phone || null,
        website: editing.website || null,
        country: editing.country || null,
        lead_time_days: editing.lead_time_days ?? 7,
        rating: editing.rating ?? null,
        minimum_order: editing.minimum_order ?? 0,
        is_active: editing.is_active ?? true,
        notes: editing.notes || null,
      }
      if (editing.id) {
        await client.from('suppliers').update(payload).eq('id', editing.id)
      } else {
        await client.from('suppliers').insert(payload)
      }
      await load()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (s: Supplier) => {
    const client = createBrowserClient()
    await client.from('suppliers').update({ is_active: !s.is_active }).eq('id', s.id)
    await load()
  }

  const inputCls = 'w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20'
  const labelCls = 'block text-xs text-white/40 mb-1'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{suppliers.length} suppliers</p>
        </div>
        <button
          onClick={() => setEditing(empty())}
          className="flex items-center gap-2 h-9 px-4 bg-white text-zinc-950 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('add_supplier')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-white/25">{t('no_suppliers')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[t('name'), t('contact'), t('lead_time'), t('rating'), t('min_order'), t('status'), ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium text-white/35">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.name}</p>
                    {s.country && <p className="text-xs text-white/35 mt-0.5">{s.country}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {s.contact_name && <p className="text-white/70">{s.contact_name}</p>}
                    {s.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-white/25 shrink-0" />
                        <span className="text-xs text-white/40 truncate max-w-[150px]">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-white/25 shrink-0" />
                        <span className="text-xs text-white/40">{s.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-white/60">{s.lead_time_days}d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RatingStars rating={s.rating} />
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {s.minimum_order > 0 ? `₪${s.minimum_order.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`h-6 px-2.5 rounded-full text-xs font-medium transition-colors ${
                        s.is_active
                          ? 'bg-white/10 text-white/70 hover:bg-white/15'
                          : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.07]'
                      }`}
                    >
                      {s.is_active ? t('active') : t('inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(s)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white">
                {editing.id ? t('edit_supplier') : t('add_supplier')}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>{t('name')} *</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className={inputCls}
                  placeholder="Supplier name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('contact_name')}</label>
                  <input
                    value={editing.contact_name ?? ''}
                    onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })}
                    className={inputCls}
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('country')}</label>
                  <input
                    value={editing.country ?? ''}
                    onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. China"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('email')}</label>
                  <input
                    value={editing.email ?? ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className={inputCls}
                    placeholder="supplier@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('phone')}</label>
                  <input
                    value={editing.phone ?? ''}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('website')}</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                  <input
                    value={editing.website ?? ''}
                    onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="https://supplier.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{t('lead_time')} (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={editing.lead_time_days ?? 7}
                    onChange={(e) => setEditing({ ...editing, lead_time_days: parseInt(e.target.value) || 7 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('rating')} (1–5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={editing.rating ?? ''}
                    onChange={(e) => setEditing({ ...editing, rating: e.target.value ? parseFloat(e.target.value) : null })}
                    className={inputCls}
                    placeholder="4.5"
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('min_order')} (₪)</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.minimum_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, minimum_order: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('notes')}</label>
                <textarea
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                  placeholder="Internal notes about this supplier…"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                    className={`h-5 w-9 rounded-full transition-colors cursor-pointer ${
                      editing.is_active ? 'bg-white/30' : 'bg-white/[0.08]'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white mt-0.5 shadow transition-transform ${
                      editing.is_active ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <span className="text-sm text-white/60">{editing.is_active ? t('active') : t('inactive')}</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="h-9 px-4 text-sm font-medium border border-white/10 text-white/60 rounded-xl hover:bg-white/[0.06] transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editing.name}
                    className="h-9 px-4 text-sm font-medium bg-white text-zinc-950 rounded-xl disabled:opacity-40 hover:bg-white/90 transition-colors"
                  >
                    {saving ? 'Saving…' : t('save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
