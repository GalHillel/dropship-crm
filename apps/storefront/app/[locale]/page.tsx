import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react'
import { createServerClient } from '@dropship/database'
import { getProducts } from '@dropship/database'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import LeadCaptureForm from '@/components/LeadCaptureForm'

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tProducts = await getTranslations({ locale, namespace: 'products' })
  const tLeadForm = await getTranslations({ locale, namespace: 'lead_form' })

  const supabase = createServerClient()
  const { data: products } = await getProducts(supabase, { activeOnly: true, pageSize: 4 })

  const stats = [
    { value: '500+', label: t('stat_products') },
    { value: '12K+', label: t('stat_customers') },
    { value: '2-3d', label: t('stat_delivery') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {t('badge')}
            </span>
            <h1 className="text-5xl sm:text-6xl font-semibold text-slate-900 leading-tight tracking-tight mb-5 whitespace-pre-line">
              {t('title')}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 h-12 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                {t('cta_primary')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center h-12 px-6 bg-white text-slate-900 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {t('cta_secondary')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-slate-100">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: lead capture */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{tLeadForm('title')}</h2>
            <p className="text-sm text-slate-500 mb-6">{tLeadForm('subtitle')}</p>
            <LeadCaptureForm />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-slate-100 bg-slate-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Truck, text: 'Free shipping over ₪300' },
              { icon: Shield, text: 'Secure payments' },
              { icon: RefreshCw, text: '30-day returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600 hidden sm:block">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{tProducts('title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{tProducts('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
