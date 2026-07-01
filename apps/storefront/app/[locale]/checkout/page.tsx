'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle, ChevronRight, ShoppingCart } from 'lucide-react'
import type { CartItem } from '@dropship/types'
import { getCart, getCartSubtotal, getCartItemCount, clearCart } from '@/lib/cart'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const addressSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  postal_code: z.string().min(4),
  country: z.string().min(2),
})

const checkoutSchema = z.object({
  shipping: addressSchema,
  same_as_shipping: z.boolean(),
  notes: z.string().optional(),
  payment_method: z.enum(['credit_card', 'paypal', 'bank_transfer']),
})

type CheckoutForm = z.infer<typeof checkoutSchema>
type Step = 'cart' | 'info' | 'payment' | 'confirm'

export default function CheckoutPage() {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const [step, setStep] = useState<Step>('cart')
  const [items, setItems] = useState<CartItem[]>([])
  const [orderNumber, setOrderNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setItems(getCart())
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { same_as_shipping: true, payment_method: 'credit_card' },
  })

  const subtotal = getCartSubtotal(items)
  const shipping = subtotal >= 300 ? 0 : 30
  const tax = Math.round(subtotal * 0.17)
  const total = subtotal + shipping + tax

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const orderNum = `ORD-${Date.now()}`
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          customer_id: user?.id ?? null,
          status: 'pending',
          subtotal,
          discount: 0,
          shipping_cost: shipping,
          tax,
          total,
          currency: 'ILS',
          shipping_address: {
            full_name: data.shipping.full_name,
            line1: data.shipping.line1,
            line2: data.shipping.line2,
            city: data.shipping.city,
            postal_code: data.shipping.postal_code,
            country: data.shipping.country,
            phone: data.shipping.phone,
          },
          notes: data.notes ?? null,
          metadata: { payment_method: data.payment_method },
        })
        .select()
        .single()

      if (error) throw error

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: { name_en: item.product.name_en, name_he: item.product.name_he, sku: item.product.sku },
      }))
      await supabase.from('order_items').insert(orderItems)

      clearCart()
      window.dispatchEvent(new Event('cart-updated'))
      setOrderNumber(orderNum)
      setStep('confirm')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'cart', label: t('step_cart') },
    { key: 'info', label: t('step_info') },
    { key: 'payment', label: t('step_payment') },
    { key: 'confirm', label: t('step_confirm') },
  ]

  const stepIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${i <= stepIdx ? 'text-slate-900' : 'text-slate-400'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${i < stepIdx ? 'bg-slate-900 text-white' : i === stepIdx ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
            </div>
          ))}
        </div>

        {step === 'confirm' ? (
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">{t('success_title')}</h1>
            <p className="text-slate-500 mb-4">{t('success_message')}</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-400 mb-1">{t('order_number')}</p>
              <p className="font-semibold text-slate-900">{orderNumber}</p>
            </div>
            <a
              href={`/${locale}`}
              className="inline-flex h-11 px-6 bg-slate-900 text-white rounded-xl items-center font-medium hover:bg-slate-800 transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Cart review */}
                {step === 'cart' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">{t('step_cart')}</h2>
                    {items.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.product.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {locale === 'he' ? item.product.name_he : item.product.name_en}
                              </p>
                              <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              ₪{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setStep('info')}
                        className="mt-4 w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        {t('continue')}
                      </button>
                    )}
                  </div>
                )}

                {/* Shipping info */}
                {step === 'info' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">{t('shipping_address')}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { name: 'shipping.full_name' as const, label: t('full_name') },
                        { name: 'shipping.email' as const, label: t('email'), type: 'email' },
                        { name: 'shipping.phone' as const, label: t('phone'), type: 'tel' },
                        { name: 'shipping.line1' as const, label: t('address_line1') },
                        { name: 'shipping.line2' as const, label: t('address_line2') },
                        { name: 'shipping.city' as const, label: t('city') },
                        { name: 'shipping.postal_code' as const, label: t('postal_code') },
                        { name: 'shipping.country' as const, label: t('country') },
                      ].map((field) => (
                        <div key={field.name}>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">{field.label}</label>
                          <input
                            {...register(field.name)}
                            type={field.type ?? 'text'}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep('cart')}
                        className="h-11 px-5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                      >
                        {t('back')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('payment')}
                        className="flex-1 h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                      >
                        {t('continue')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment */}
                {step === 'payment' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">{t('payment_method')}</h2>
                    <div className="space-y-2">
                      {[
                        { value: 'credit_card', label: t('credit_card') },
                        { value: 'paypal', label: t('paypal') },
                        { value: 'bank_transfer', label: t('bank_transfer') },
                      ].map((pm) => (
                        <label
                          key={pm.value}
                          className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 transition-colors has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50"
                        >
                          <input
                            {...register('payment_method')}
                            type="radio"
                            value={pm.value}
                            className="accent-slate-900"
                          />
                          <span className="text-sm font-medium text-slate-900">{pm.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">{t('notes')}</label>
                      <textarea
                        {...register('notes')}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep('info')}
                        className="h-11 px-5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                      >
                        {t('back')}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {t('place_order')}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Order summary sidebar */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
                <h3 className="font-semibold text-slate-900 mb-4">{t('order_summary')}</h3>
                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {locale === 'he' ? item.product.name_he : item.product.name_en} × {item.quantity}
                      </span>
                      <span className="text-slate-900">₪{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('subtotal')}</span>
                    <span className="text-slate-900">₪{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('shipping')}</span>
                    <span className="text-slate-900">{shipping === 0 ? t('shipping_free') : `₪${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('tax')}</span>
                    <span className="text-slate-900">₪{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>{t('total')}</span>
                    <span>₪{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
