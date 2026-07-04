'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X, Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Order, OrderStatus } from '@dropship/types'
import { createBrowserClient, getOrders, updateOrderStatus } from '@dropship/database'
import DataTable, { Column } from '@/components/DataTable'
import OrderStatusBadge from '@/components/OrderStatusBadge'

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const FLOW_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  confirmed: <CheckCircle2 className="h-3 w-3" />,
  processing: <Package className="h-3 w-3" />,
  shipped: <Truck className="h-3 w-3" />,
  delivered: <CheckCircle2 className="h-3 w-3" />,
}

function StatusTimeline({ current }: { current: OrderStatus }) {
  const isTerminal = current === 'cancelled' || current === 'refunded'
  const currentIdx = FLOW.indexOf(current)

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 py-3">
        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
        <span className="text-sm text-red-400 font-medium capitalize">{current}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 py-3 overflow-x-auto">
      {FLOW.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                active
                  ? 'bg-white text-zinc-950 shadow-[0_0_0_3px_rgba(255,255,255,0.2)]'
                  : done
                  ? 'bg-white/20 text-white'
                  : 'bg-white/[0.06] text-white/25'
              }`}>
                {FLOW_ICONS[step]}
              </div>
              <span className={`text-[10px] mt-1 capitalize ${
                active ? 'text-white font-semibold' : done ? 'text-white/50' : 'text-white/20'
              }`}>
                {step}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-4 ${i < currentIdx ? 'bg-white/30' : 'bg-white/[0.08]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

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
  const [trackingInput, setTrackingInput] = useState('')
  const [savingTracking, setSavingTracking] = useState(false)

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

  const openOrder = (order: Order) => {
    setSelected(order)
    setTrackingInput(order.tracking_number ?? '')
  }

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selected) return
    setUpdatingStatus(true)
    const client = createBrowserClient()
    await updateOrderStatus(client, selected.id, newStatus)
    const updated = { ...selected, status: newStatus }
    setSelected(updated)
    await load()
    setUpdatingStatus(false)
  }

  const handleSaveTracking = async () => {
    if (!selected) return
    setSavingTracking(true)
    const client = createBrowserClient()
    await client.from('orders').update({ tracking_number: trackingInput || null }).eq('id', selected.id)
    setSelected({ ...selected, tracking_number: trackingInput || null })
    setSavingTracking(false)
  }

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      label: t('order_number'),
      sortable: true,
      render: (row) => <span className="font-medium text-white">#{row.order_number}</span>,
    },
    {
      key: 'customer',
      label: t('customer'),
      render: (row) => (
        <div>
          <p className="text-sm text-white">{(row.customer as { full_name?: string })?.full_name ?? '—'}</p>
          <p className="text-xs text-white/35">{(row.customer as { email?: string })?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: t('date'),
      sortable: true,
      render: (row) => (
        <span className="text-white/50">{new Date(row.created_at as string).toLocaleDateString()}</span>
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
      render: (row) => <span className="font-semibold text-white">₪{Number(row.total).toLocaleString()}</span>,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('search')}
            className="h-9 pl-9 pr-4 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 w-56"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1) }}
          className="h-9 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="">{t('filter_status')}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={orders as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText={t('no_orders')}
          onRowClick={(row) => openOrder(row as unknown as Order)}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs font-medium border border-white/10 text-white/60 rounded-lg disabled:opacity-30 hover:bg-white/[0.06]"
            >
              ← Prev
            </button>
            <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs font-medium border border-white/10 text-white/60 rounded-lg disabled:opacity-30 hover:bg-white/[0.06]"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-semibold text-white">Order #{selected.order_number}</h2>
                <p className="text-xs text-white/35 mt-0.5">
                  {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Fulfillment Timeline */}
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-1">Fulfillment Status</p>
                <StatusTimeline current={selected.status} />
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-xs text-white/35 mb-0.5">Total</p>
                  <p className="font-semibold text-white">₪{selected.total.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-xs text-white/35 mb-0.5">Customer</p>
                  <p className="text-sm text-white truncate">
                    {(selected.customer as { full_name?: string })?.full_name ?? '—'}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-xs text-white/35 mb-0.5">Items</p>
                  <p className="text-sm text-white">{selected.items?.length ?? '—'}</p>
                </div>
              </div>

              {/* Tracking number */}
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Tracking Number</p>
                <div className="flex gap-2">
                  <input
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number…"
                    className="flex-1 h-9 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                  <button
                    onClick={handleSaveTracking}
                    disabled={savingTracking || trackingInput === (selected.tracking_number ?? '')}
                    className="h-9 px-4 text-xs font-medium bg-white text-zinc-950 rounded-lg disabled:opacity-30 hover:bg-white/90 transition-colors"
                  >
                    {savingTracking ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Shipping address */}
              {selected.shipping_address && (
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Ship To</p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-sm text-white">{selected.shipping_address.full_name}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {selected.shipping_address.line1}
                      {selected.shipping_address.line2 ? `, ${selected.shipping_address.line2}` : ''}
                    </p>
                    <p className="text-xs text-white/40">
                      {selected.shipping_address.city} {selected.shipping_address.postal_code}
                    </p>
                  </div>
                </div>
              )}

              {/* Move status */}
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{t('update_status')}</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={updatingStatus || s === selected.status}
                      className={`h-7 px-3 text-xs rounded-lg font-medium transition-colors ${
                        s === selected.status
                          ? 'bg-white text-zinc-950'
                          : 'border border-white/10 text-white/50 hover:border-white/25 hover:text-white disabled:opacity-30'
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
