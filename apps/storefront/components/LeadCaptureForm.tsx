'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
})
type FormData = z.infer<typeof schema>

export default function LeadCaptureForm() {
  const t = useTranslations('lead_form')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      await supabase.from('leads').insert({
        email: data.email,
        full_name: data.full_name,
        source: 'homepage_form',
        status: 'new',
      })
      setSubmitted(true)
    } catch {
      setError(t('error'))
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-6 gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-slate-900 font-medium">{t('success')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <input
          {...register('full_name')}
          placeholder={t('name_placeholder')}
          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        />
        {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          {...register('email')}
          type="email"
          placeholder={t('email_placeholder')}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {t('cta')}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}
