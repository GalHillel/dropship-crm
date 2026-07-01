'use client'

import type { OrderStatus } from '@dropship/types'

const config: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  shipped: { label: 'Shipped', classes: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  delivered: { label: 'Delivered', classes: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border-red-200' },
  refunded: { label: 'Refunded', classes: 'bg-slate-50 text-slate-600 border-slate-200' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, classes } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  )
}
