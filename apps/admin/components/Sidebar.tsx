'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Users, Package, BarChart2, Settings, Globe } from 'lucide-react'

export default function Sidebar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const other = locale === 'en' ? 'he' : 'en'

  const links = [
    { href: `/${locale}`, icon: LayoutDashboard, label: t('dashboard') },
    { href: `/${locale}/orders`, icon: ShoppingBag, label: t('orders') },
    { href: `/${locale}/crm`, icon: Users, label: t('crm') },
    { href: `/${locale}/products`, icon: Package, label: t('products') },
    { href: `/${locale}/analytics`, icon: BarChart2, label: t('analytics') },
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">DS</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">DropShip</p>
            <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <Link
          href={`/${other}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Globe className="h-4 w-4" />
          {other === 'he' ? 'עברית' : 'English'}
        </Link>
        <Link
          href={`/${locale}/settings`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Settings className="h-4 w-4" />
          {t('settings')}
        </Link>
      </div>
    </aside>
  )
}
