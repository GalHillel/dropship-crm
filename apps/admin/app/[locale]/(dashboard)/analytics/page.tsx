'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { RevenueDataPoint, Product } from '@dropship/types'
import { createBrowserClient, getRevenueChart } from '@dropship/database'

const PERIODS = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
]

const MARGIN_COLORS = [
  'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.65)',
  'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.38)',
  'rgba(255,255,255,0.32)', 'rgba(255,255,255,0.26)', 'rgba(255,255,255,0.20)',
  'rgba(255,255,255,0.15)',
]

const DarkTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold text-white">
          {p.name === 'revenue' ? '₪' : ''}
          {p.value.toLocaleString()}
          {p.name === 'orders' ? ' orders' : ''}
          {p.name === 'margin' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

type MarginProduct = { name: string; margin: number; price: number; cost: number }
type EventCount = { name: string; value: number }

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [marginProducts, setMarginProducts] = useState<MarginProduct[]>([])
  const [eventCounts, setEventCounts] = useState<EventCount[]>([])
  const [marginLoading, setMarginLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const client = createBrowserClient()
      const result = await getRevenueChart(client, period)
      setData(result)
      setLoading(false)
    }
    load()
  }, [period])

  useEffect(() => {
    const loadMargin = async () => {
      setMarginLoading(true)
      const client = createBrowserClient()

      // Real product margin data
      const { data: products } = await client
        .from('products')
        .select('name_en, price, cost_price')
        .not('cost_price', 'is', null)
        .gt('price', 0)
        .gt('cost_price', 0)
        .eq('is_active', true)
        .order('price', { ascending: false })
        .limit(20)

      if (products) {
        const withMargin = (products as Pick<Product, 'name_en' | 'price' | 'cost_price'>[])
          .map((p) => ({
            name: p.name_en.length > 20 ? p.name_en.slice(0, 18) + '…' : p.name_en,
            margin: Math.round(((p.price - (p.cost_price ?? 0)) / p.price) * 100),
            price: p.price,
            cost: p.cost_price ?? 0,
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 10)
        setMarginProducts(withMargin)
      }

      // Real analytics events
      const { data: events } = await client
        .from('analytics_events')
        .select('event_type')
        .limit(2000)

      if (events && events.length > 0) {
        const grouped: Record<string, number> = {}
        events.forEach((e: { event_type: string }) => {
          grouped[e.event_type] = (grouped[e.event_type] ?? 0) + 1
        })
        setEventCounts(
          Object.entries(grouped)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }))
        )
      }

      setMarginLoading(false)
    }
    loadMargin()
  }, [])

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const avgMargin = marginProducts.length > 0
    ? Math.round(marginProducts.reduce((s, p) => s + p.margin, 0) / marginProducts.length)
    : null

  const kpis = [
    { label: 'Total Revenue', value: `₪${totalRevenue.toLocaleString()}` },
    { label: 'Total Orders', value: totalOrders.toLocaleString() },
    { label: 'Avg Order Value', value: `₪${avgOrderValue.toFixed(0)}` },
    ...(avgMargin !== null ? [{ label: 'Avg Product Margin', value: `${avgMargin}%` }] : []),
  ]

  const cardCls = 'bg-white/[0.03] border border-white/10 rounded-xl p-5'
  const skeletonCls = 'bg-white/[0.05] rounded-xl animate-pulse'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-white text-zinc-950'
                  : 'border border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cardCls}>
            <p className="text-xs text-white/40 mb-1">{kpi.label}</p>
            <p className="text-2xl font-semibold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Line Chart */}
      <div className={`${cardCls} mb-6`}>
        <h3 className="text-sm font-semibold text-white mb-5">{t('revenue_daily')}</h3>
        {loading ? (
          <div className={`h-52 ${skeletonCls}`} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="rgba(255,255,255,0.85)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }} name="revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Orders per Day */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white mb-5">Orders per Day</h3>
          {loading ? (
            <div className={`h-44 ${skeletonCls}`} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="orders" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Analytics Events */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white mb-4">{t('events_by_type')}</h3>
          {marginLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className={`h-7 ${skeletonCls}`} />)}
            </div>
          ) : eventCounts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-white/30">No events recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventCounts.map((e, i) => {
                const max = eventCounts[0]?.value ?? 1
                const pct = Math.round((e.value / max) * 100)
                return (
                  <div key={e.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-white/60">{e.name.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-semibold text-white">{e.value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: MARGIN_COLORS[i] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product Margin Chart */}
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-white mb-5">{t('product_margin')}</h3>
        {marginLoading ? (
          <div className={`h-56 ${skeletonCls}`} />
        ) : marginProducts.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-white/30">Add cost prices to products to see margin data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={marginProducts.length * 36 + 20}>
            <BarChart
              layout="vertical"
              data={marginProducts}
              margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="margin" radius={[0, 4, 4, 0]} name="margin">
                {marginProducts.map((_, i) => (
                  <Cell key={i} fill={MARGIN_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
