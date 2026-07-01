'use client'

import { useTranslations } from 'next-intl'
import type { Lead, LeadStatus } from '@dropship/types'

interface LeadKanbanProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

const STAGES: { key: LeadStatus; color: string; dot: string }[] = [
  { key: 'new', color: 'border-blue-200 bg-blue-50', dot: 'bg-blue-400' },
  { key: 'contacted', color: 'border-yellow-200 bg-yellow-50', dot: 'bg-yellow-400' },
  { key: 'qualified', color: 'border-purple-200 bg-purple-50', dot: 'bg-purple-400' },
  { key: 'converted', color: 'border-green-200 bg-green-50', dot: 'bg-green-400' },
  { key: 'lost', color: 'border-red-200 bg-red-50', dot: 'bg-red-400' },
]

export default function LeadKanban({ leads, onLeadClick }: LeadKanbanProps) {
  const t = useTranslations('crm')

  const stageLabels: Record<LeadStatus, string> = {
    new: t('stage_new'),
    contacted: t('stage_contacted'),
    qualified: t('stage_qualified'),
    converted: t('stage_converted'),
    lost: t('stage_lost'),
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map(({ key, color, dot }) => {
        const stageLeads = leads.filter((l) => l.status === key)
        return (
          <div key={key} className="w-64 shrink-0">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border ${color} border-b-0`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold text-slate-700">{stageLabels[key]}</span>
              </div>
              <span className="text-xs font-medium text-slate-400">{stageLeads.length}</span>
            </div>

            {/* Cards */}
            <div className={`min-h-32 rounded-b-xl border ${color} p-2 space-y-2`}>
              {stageLeads.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{t('no_leads')}</p>
              ) : (
                stageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onLeadClick(lead)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {lead.full_name ?? lead.email}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{lead.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">{lead.source}</span>
                      {lead.score > 0 && (
                        <span className="text-xs font-semibold text-slate-600">★ {lead.score}</span>
                      )}
                    </div>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {lead.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
