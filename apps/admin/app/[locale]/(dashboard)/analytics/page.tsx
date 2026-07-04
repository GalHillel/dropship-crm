'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { RevenueDataPoint } from '@dropship/types'
import { createBrowserClient, getRevenueChart } from '@dropship/database'

const PERIODS = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
]

const PIE_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-sm font-semibold text-slate-900">
            {p.name === 'revenue' ? '₪' : ''}{p.value.toLocaleString()}
            {p.name === 'orders' ? ' orders' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const eventTypeMock = [
    { name: 'page_view', value: 1240 },
    { name: 'product_view', value: 830 },
    { name: 'add_to_cart', value: 310 },
    { name: 'checkout', value: 145 },
    { name: 'purchase', value: 89 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                period === p.key ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `₪${totalRevenue.toLocaleString()}` },
          { label: 'Total Orders', value: totalOrders.toString() },
          { label: 'Avg Order Value', value: `₪${avgOrderValue.toFixed(0)}` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Line Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">{t('revenue_daily')}</h3>
        {loading ? (
          <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#0f172a', strokeWidth: 0 }} name="revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Orders per Day</h3>
          {loading ? (
            <div className="h-44 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#334155" radius={[4, 4, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">{t('events_by_type')}</h3>
          <div className="flex gap-6 items-center">
            <PieChart width={160} height={160}>
              <Pie data={eventTypeMock} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {eventTypeMock.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {eventTypeMock.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-xs text-slate-600">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
