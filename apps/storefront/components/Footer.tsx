'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Shield, Truck, RefreshCw, Headphones } from 'lucide-react'

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  const trustItems = [
    { icon: Truck, key: 'trust_shipping' },
    { icon: Shield, key: 'trust_secure' },
    { icon: RefreshCw, key: 'trust_returns' },
    { icon: Headphones, key: 'trust_support' },
  ] as const

  return (
    <footer className="bg-white border-t border-slate-200 mt-0">
      {/* Trust strip */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustItems.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-xs font-medium text-slate-600">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">DS</span>
              </div>
              <span className="font-semibold text-slate-900">{t('company')}</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('tagline')}</p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {['𝕏', 'f', 'in', '▶'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('links_shop')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links_products'), href: `/${locale}/products` },
                { label: t('links_categories'), href: `/${locale}/products` },
                { label: t('links_deals'), href: `/${locale}/products` },
                { label: t('links_new'), href: `/${locale}/products` },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('links_company')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links_about'), href: '#' },
                { label: t('links_contact'), href: '#' },
                { label: t('links_blog'), href: '#' },
                { label: t('links_careers'), href: '#' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('links_support')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links_faq'), href: '#' },
                { label: t('links_shipping'), href: '#' },
                { label: t('links_returns'), href: '#' },
                { label: t('links_track'), href: '#' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">{t('copyright')}</p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a key={item} href="#" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
