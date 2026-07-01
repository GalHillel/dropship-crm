'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-20">
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
            <p className="text-sm text-slate-500">{t('tagline')}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('links_shop')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links_products'), href: `/${locale}/products` },
                { label: t('links_categories'), href: `/${locale}/products` },
                { label: t('links_deals'), href: `/${locale}/products` },
              ].map((l) => (
                <li key={l.href}>
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

        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
