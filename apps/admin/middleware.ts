import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['en', 'he']
const defaultLocale = 'en'
const publicPaths = ['/login']

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const pathnameWithoutLocale = locales.reduce(
    (p, locale) => p.replace(new RegExp(`^/${locale}`), '') || '/',
    pathname
  )
  const isPublicPath = publicPaths.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + '/')
  )

  const intlResponse = intlMiddleware(request)

  if (isPublicPath) {
    return intlResponse ?? NextResponse.next()
  }

  let response = intlResponse ?? NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = locales.find((l) => pathname.startsWith(`/${l}`)) ?? defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
