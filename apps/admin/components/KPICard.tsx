'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  prefix?: string
  suffix?: string
}

export default function KPICard({ title, value, change, icon, prefix = '', suffix = '' }: KPICardProps) {
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-slate-900 mb-2">
        {prefix}{value}{suffix}
      </p>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : isNeutral ? 'text-slate-400' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : isNeutral ? <Minus className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs last week</span>
      </div>
    </div>
  )
}
