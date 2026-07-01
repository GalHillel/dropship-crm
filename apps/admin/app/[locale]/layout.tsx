import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Sidebar from '@/components/Sidebar'
import '../globals.css'

const inter = Inter({ subsets: ['latin', 'hebrew'], variable: '--font-inter' })
const locales = ['en', 'he']

export const metadata: Metadata = {
  title: 'DropShip CRM — Admin',
  description: 'Admin panel and CRM',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()
  const isRtl = locale === 'he'

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-auto">
              <div className="max-w-screen-xl mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
