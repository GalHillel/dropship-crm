'use client'

import React from 'react'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin ${className}`}
    />
  )
}
