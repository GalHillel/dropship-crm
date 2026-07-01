import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight, Truck, Shield, RefreshCw, Star, Package, Headphones, RotateCcw, Zap } from 'lucide-react'
import { createServerClient, getProducts } from '@dropship/database'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import LeadCaptureForm from '@/components/LeadCaptureForm'
import AnnouncementBar from '@/components/AnnouncementBar'

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tProducts = await getTranslations({ locale, namespace: 'products' })
  const tLeadForm = await getTranslations({ locale, namespace: 'lead_form' })
  const tSocial = await getTranslations({ locale, namespace: 'social_proof' })
  const tCats = await getTranslations({ locale, namespace: 'categories' })
  const tWhyUs = await getTranslations({ locale, namespace: 'why_us' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  const supabase = createServerClient()
  const { data: products } = await getProducts(supabase, { activeOnly: true, pageSize: 4 })

  const stats = [
    { value: '500+', label: t('stat_products') },
    { value: '12K+', label: t('stat_customers') },
    { value: '2-3d', label: t('stat_delivery') },
  ]

  const testimonials = [
    {
      name: tSocial('testimonial_1_name'),
      role: tSocial('testimonial_1_role'),
      text: tSocial('testimonial_1_text'),
      rating: 5,
    },
    {
      name: tSocial('testimonial_2_name'),
      role: tSocial('testimonial_2_role'),
      text: tSocial('testimonial_2_text'),
      rating: 5,
    },
    {
      name: tSocial('testimonial_3_name'),
      role: tSocial('testimonial_3_role'),
      text: tSocial('testimonial_3_text'),
      rating: 5,
    },
  ]

  const categories = [
    { key: 'electronics', emoji: '💻', label: tCats('electronics'), cat: 'Electronics' },
    { key: 'fashion', emoji: '👗', label: tCats('fashion'), cat: 'Fashion' },
    { key: 'home', emoji: '🏠', label: tCats('home'), cat: 'Home' },
    { key: 'beauty', emoji: '✨', label: tCats('beauty'), cat: 'Beauty' },
    { key: 'bags', emoji: '👜', label: tCats('bags'), cat: 'Bags' },
    { key: 'sports', emoji: '⚽', label: tCats('sports'), cat: 'Sports' },
  ]

  const whyUs = [
    { icon: Package, title: tWhyUs('quality_title'), text: tWhyUs('quality_text') },
    { icon: Zap, title: tWhyUs('fast_title'), text: tWhyUs('fast_text') },
    { icon: Headphones, title: tWhyUs('support_title'), text: tWhyUs('support_text') },
    { icon: RotateCcw, title: tWhyUs('returns_title'), text: tWhyUs('returns_text') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar hasAnnouncement />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {t('badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-semibold text-slate-900 leading-[1.08] tracking-tight mb-5 whitespace-pre-line">
              {t('title')}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 h-12 px-7 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
              >
                {t('cta_primary')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center h-12 px-6 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {t('cta_secondary')}
              </Link>
            </div>

            {/* Social proof inline */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex -space-x-2">
                {['bg-slate-200', 'bg-slate-300', 'bg-slate-400', 'bg-slate-300'].map((c, i) => (
                  <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white`} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{tSocial('reviews_count')}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-slate-100">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lead capture card */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-slate-500">{tSocial('rating')}</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{tLeadForm('title')}</h2>
            <p className="text-sm text-slate-500 mb-6">{tLeadForm('subtitle')}</p>
            <LeadCaptureForm />
            <p className="text-xs text-slate-400 mt-4 text-center">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Truck, text: tFooter('trust_shipping') },
              { icon: Shield, text: tFooter('trust_secure') },
              { icon: RefreshCw, text: tFooter('trust_returns') },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2">
                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-600 font-medium hidden sm:block">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">{tCats('section_title')}</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/products?category=${cat.cat}`}
              className="flex flex-col items-center gap-2.5 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-sm transition-all group"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-slate-700 text-center group-hover:text-slate-900">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{tProducts('featured_title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{tProducts('featured_subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            {tProducts('view_all')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} badge={i === 0 ? 'best_seller' : i === 2 ? 'new' : undefined} />
          ))}
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-16 bg-slate-50 mt-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-slate-900">{tWhyUs('section_title')}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">{tSocial('section_title')}</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-slate-500">{tSocial('rating')} · {tSocial('reviews_count')}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-slate-600">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-16 bg-slate-900 mt-6">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">{tFooter('newsletter_title')}</h2>
          <p className="text-slate-400 text-sm mb-6">{tFooter('newsletter_subtitle')}</p>
          <form className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder={tFooter('newsletter_placeholder')}
              className="flex-1 h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="h-11 px-5 bg-white text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors shrink-0"
            >
              {tFooter('newsletter_cta')}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
