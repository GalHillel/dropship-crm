'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import type { Order, OrderStatus } from '@dropship/types'
import { createBrowserClient, getOrders, updateOrderStatus } from '@dropship/database'
import DataTable, { Column } from '@/components/DataTable'
import OrderStatusBadge from '@/components/OrderStatusBadge'

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrdersPage() {
  const t = useTranslations('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = async () => {
    setLoading(true)
    const client = createBrowserClient()
    const res = await getOrders(client, {
      search: search || undefined,
      status: status || undefined,
      page,
      pageSize: 20,
    })
    setOrders(res.data)
    setTotal(res.count)
    setTotalPages(res.totalPages)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, status, page])

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selected) return
    setUpdatingStatus(true)
    const client = createBrowserClient()
    await updateOrderStatus(client, selected.id, newStatus)
    setSelected({ ...selected, status: newStatus })
    await load()
    setUpdatingStatus(false)
  }

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      label: t('order_number'),
      sortable: true,
      render: (row) => <span className="font-medium text-slate-900">#{row.order_number}</span>,
    },
    {
      key: 'customer',
      label: t('customer'),
      render: (row) => (
        <div>
          <p className="text-sm text-slate-900">{(row.customer as { full_name?: string })?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{(row.customer as { email?: string })?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: t('date'),
      sortable: true,
      render: (row) => (
        <span className="text-slate-600">{new Date(row.created_at as string).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'status',
      label: t('status'),
      render: (row) => <OrderStatusBadge status={row.status as OrderStatus} />,
    },
    {
      key: 'total',
      label: t('total'),
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-900">₪{Number(row.total).toLocaleString()}</span>,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('search')}
            className="h-9 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 w-56"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1) }}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">{t('filter_status')}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={orders as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText={t('no_orders')}
          onRowClick={(row) => setSelected(row as unknown as Order)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Order #{selected.order_number}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Current Status</p>
                  <OrderStatusBadge status={selected.status} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="font-semibold text-slate-900">₪{selected.total.toLocaleString()}</p>
                </div>
              </div>
              {selected.shipping_address && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Shipping Address</p>
                  <p className="text-sm text-slate-700">
                    {selected.shipping_address.full_name}<br />
                    {selected.shipping_address.line1}{selected.shipping_address.line2 ? `, ${selected.shipping_address.line2}` : ''}<br />
                    {selected.shipping_address.city} {selected.shipping_address.postal_code}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">{t('update_status')}</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={updatingStatus || s === selected.status}
                      className={`h-7 px-3 text-xs rounded-lg font-medium transition-colors ${
                        s === selected.status
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
