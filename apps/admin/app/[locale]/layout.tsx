import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' })
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
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
