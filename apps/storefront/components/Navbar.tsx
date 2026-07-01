'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ShoppingCart, Menu, X, Globe } from 'lucide-react'
import { getCartItemCount, getCart } from '@/lib/cart'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const other = locale === 'en' ? 'he' : 'en'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const updateCart = () => setCartCount(getCartItemCount(getCart()))
    updateCart()
    window.addEventListener('storage', updateCart)
    window.addEventListener('cart-updated', updateCart)
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const navLinks = [
    { label: t('home'), href: `/${locale}` },
    { label: t('products'), href: `/${locale}/products` },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DS</span>
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">DropShip CRM</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Locale switcher */}
            <Link
              href={`/${other}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {other.toUpperCase()}
            </Link>

            {/* Cart */}
            <Link
              href={`/${locale}/checkout`}
              className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 min-w-[18px] bg-slate-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Dashboard */}
            <Link
              href={`/${locale}/dashboard`}
              className="hidden md:flex items-center h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {t('dashboard')}
            </Link>

            {/* Mobile menu */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/dashboard`}
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              {t('dashboard')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
