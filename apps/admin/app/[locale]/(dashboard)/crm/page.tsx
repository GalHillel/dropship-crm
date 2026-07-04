'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X, Plus, Clock, Mail, Phone, FileText } from 'lucide-react'
import type { Lead, LeadActivity, LeadActivityType } from '@dropship/types'
import { createBrowserClient, getLeads, upsertLead, addLeadActivity } from '@dropship/database'
import LeadKanban from '@/components/LeadKanban'

const ACTIVITY_ICONS: Record<LeadActivityType, React.ReactNode> = {
  note: <FileText className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  meeting: <Clock className="h-3.5 w-3.5" />,
  status_change: <Clock className="h-3.5 w-3.5" />,
  purchase: <Clock className="h-3.5 w-3.5" />,
}

export default function CRMPage() {
  const t = useTranslations('crm')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [activityContent, setActivityContent] = useState('')
  const [activityType, setActivityType] = useState<LeadActivityType>('note')
  const [addingActivity, setAddingActivity] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)
  const [newLead, setNewLead] = useState({ email: '', full_name: '', phone: '', source: 'manual' })

  const load = async () => {
    const client = createBrowserClient()
    const res = await getLeads(client, { search: search || undefined, pageSize: 100 })
    setLeads(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  const handleAddActivity = async () => {
    if (!selected || !activityContent.trim()) return
    setAddingActivity(true)
    const client = createBrowserClient()
    const activity = await addLeadActivity(client, {
      lead_id: selected.id,
      type: activityType,
      content: activityContent,
      performed_by: null,
    })
    setSelected({ ...selected, activities: [...(selected.activities ?? []), activity] })
    setActivityContent('')
    setAddingActivity(false)
  }

  const handleAddLead = async () => {
    if (!newLead.email) return
    const client = createBrowserClient()
    const lead = await upsertLead(client, { ...newLead, status: 'new', score: 0 })
    setLeads(prev => [lead, ...prev])
    setShowAddLead(false)
    setNewLead({ email: '', full_name: '', phone: '', source: 'manual' })
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
        <button
          onClick={() => setShowAddLead(true)}
          className="flex items-center gap-2 h-9 px-4 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('add_lead')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-64 h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <LeadKanban leads={leads} onLeadClick={setSelected} />
      )}

      {/* Lead detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-end sm:items-center justify-end">
          <div className="bg-white border-l border-slate-200 shadow-xl h-full w-full max-w-md flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{t('lead_detail')}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Lead info */}
            <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{selected.full_name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[selected.status] ?? 'bg-slate-100 text-slate-700'}`}>
                  {selected.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.phone && <div><span className="text-slate-400 text-xs">Phone</span><p className="text-slate-700">{selected.phone}</p></div>}
                <div><span className="text-slate-400 text-xs">Source</span><p className="text-slate-700">{selected.source}</p></div>
                <div><span className="text-slate-400 text-xs">Score</span><p className="text-slate-700 font-medium">★ {selected.score}</p></div>
                <div><span className="text-slate-400 text-xs">Created</span><p className="text-slate-700">{new Date(selected.created_at).toLocaleDateString()}</p></div>
              </div>
              {selected.tags && selected.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Activity timeline */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('activity_timeline')}</h3>
              {(selected.activities ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No activities yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...(selected.activities ?? [])].reverse().map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                        {ACTIVITY_ICONS[activity.type]}
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">{activity.content}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {activity.type} · {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add activity */}
            <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
              <div className="flex gap-2 mb-2">
                {(['note', 'email', 'call', 'meeting'] as LeadActivityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivityType(type)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      activityType === type ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={addingActivity || !activityContent.trim()}
                  className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 self-end"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{t('add_lead')}</h2>
              <button onClick={() => setShowAddLead(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'full_name', label: 'Full Name', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'source', label: 'Source', type: 'text' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={newLead[field.key as keyof typeof newLead]}
                    onChange={(e) => setNewLead(l => ({ ...l, [field.key]: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddLead(false)}
                  className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLead}
                  disabled={!newLead.email}
                  className="flex-1 h-10 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-40"
                >
                  Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
