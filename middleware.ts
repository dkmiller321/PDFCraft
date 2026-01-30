import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh auth session for all requests
  const { supabaseResponse, user } = await updateSession(request)

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/pricing', '/docs']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/docs/')
  )

  // API v1 routes allow both session and API key auth
  // API key validation is handled in the route handlers
  const isApiRoute = pathname.startsWith('/api/v1/')

  // Auth callback route
  const isAuthCallback = pathname.startsWith('/auth/callback')

  // Static assets and Next.js internals
  const isStaticOrInternal =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')

  // Skip auth check for public routes, API routes, auth callbacks, and static files
  if (isPublicRoute || isApiRoute || isAuthCallback || isStaticOrInternal) {
    return supabaseResponse
  }

  // Dashboard routes require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard')

  if (isDashboardRoute && !user) {
    // Redirect to login with return URL
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
