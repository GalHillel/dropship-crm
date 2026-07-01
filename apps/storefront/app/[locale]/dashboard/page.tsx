'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { User, Package, LogOut, ChevronRight } from 'lucide-react'
import type { Order, Profile } from '@dropship/types'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Tab = 'orders' | 'profile'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: '', preferred_language: 'en' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*, items:order_items(*)').eq('customer_id', user.id).order('created_at', { ascending: false }),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        setProfileForm({ full_name: profileRes.data.full_name ?? '', preferred_language: profileRes.data.preferred_language })
      }
      if (ordersRes.data) setOrders(ordersRes.data as Order[])
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update(profileForm).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = `/${locale}`
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">{t('title')}</h1>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 h-fit">
            {[
              { key: 'orders' as Tab, icon: Package, label: t('orders') },
              { key: 'profile' as Tab, icon: User, label: t('profile') },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2 pt-2 border-t border-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : tab === 'orders' ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">{t('orders')}</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">{t('no_orders')}</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-900">#{order.order_number}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[order.status] ?? 'bg-slate-100 text-slate-700'}`}>
                            {tStatus(order.status as Parameters<typeof tStatus>[0])}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">₪{order.total.toLocaleString()}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-semibold text-slate-900 mb-5">{t('profile')}</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
                    <input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                    <input
                      value={profile?.email ?? ''}
                      disabled
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-400 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Language</label>
                    <select
                      value={profileForm.preferred_language}
                      onChange={(e) => setProfileForm(f => ({ ...f, preferred_language: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="en">English</option>
                      <option value="he">עברית</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className={`h-10 px-5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'}`}
                  >
                    {saved ? t('profile_saved') : saving ? 'Saving...' : t('save_profile')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
