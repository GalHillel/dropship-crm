'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function AnnouncementBar() {
  const t = useTranslations('announcement')
  const locale = useLocale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('announcement-dismissed-v1')
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('announcement-dismissed-v1', '1')
    window.dispatchEvent(new Event('announcement-dismissed'))
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-9 bg-slate-900 text-white flex items-center justify-center px-10">
      <p className="text-xs font-medium flex items-center gap-2">
        {t('text')}
        <Link
          href={`/${locale}/products`}
          className="font-semibold underline underline-offset-2 hover:no-underline ml-1"
        >
          {t('cta')} →
        </Link>
      </p>
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
