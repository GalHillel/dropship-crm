'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { DollarSign, ShoppingBag, Users, TrendingUp, ChevronRight } from 'lucide-react'
import type { DashboardKPIs, RevenueDataPoint, Order, Lead } from '@dropship/types'
import { createBrowserClient, getDashboardKPIs, getRevenueChart, getOrders, getLeads } from '@dropship/database'
import KPICard from '@/components/KPICard'
import RevenueChart from '@/components/Charts/RevenueChart'
import OrderStatusBadge from '@/components/OrderStatusBadge'

export default function AdminDashboard() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [chart, setChart] = useState<RevenueDataPoint[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const client = createBrowserClient()
      const [kpiData, chartData, ordersData, leadsData] = await Promise.all([
        getDashboardKPIs(client),
        getRevenueChart(client, 30),
        getOrders(client, { pageSize: 5 }),
        getLeads(client, { pageSize: 5 }),
      ])
      setKpis(kpiData)
      setChart(chartData)
      setOrders(ordersData.data)
      setLeads(leadsData.data)
      setLoading(false)
    }
    load()
  }, [])

  const kpiCards = kpis
    ? [
        { title: t('total_revenue'), value: `₪${kpis.total_revenue.toLocaleString()}`, change: kpis.revenue_change_pct, icon: <DollarSign className="h-4.5 w-4.5" /> },
        { title: t('active_orders'), value: String(kpis.active_orders), change: kpis.orders_change_pct, icon: <ShoppingBag className="h-4.5 w-4.5" /> },
        { title: t('leads_week'), value: String(kpis.leads_this_week), change: kpis.leads_change_pct, icon: <Users className="h-4.5 w-4.5" /> },
        { title: t('conversion'), value: `${kpis.conversion_rate.toFixed(1)}%`, change: kpis.conversion_change_pct, icon: <TrendingUp className="h-4.5 w-4.5" /> },
      ]
    : []

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">{t('title')}</h1>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))
          : kpiCards.map((card) => (
              <KPICard key={card.title} {...card} />
            ))}
      </div>

      {/* Revenue chart */}
      <div className="mb-6">
        <RevenueChart data={chart} title={t('revenue_chart')} />
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">{t('recent_orders')}</h3>
            <Link href={`/${locale}/orders`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
              {t('view_all')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-slate-50 m-2 rounded-lg" />)
              : orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">#{order.order_number}</p>
                      <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-slate-900">₪{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">{t('recent_leads')}</h3>
            <Link href={`/${locale}/crm`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
              {t('view_all')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-slate-50 m-2 rounded-lg" />)
              : leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.full_name ?? lead.email}</p>
                      <p className="text-xs text-slate-400">{lead.source}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      lead.status === 'new' ? 'bg-blue-50 text-blue-700' :
                      lead.status === 'converted' ? 'bg-green-50 text-green-700' :
                      lead.status === 'lost' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
