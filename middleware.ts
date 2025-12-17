import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/callback']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // In development mode, allow access without auth
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // For now, in dev mode, we skip auth check entirely
  // Auth will be handled client-side via Zustand store
  if (isDevMode) {
    return response
  }

  // Check for Supabase auth cookie
  const supabaseAuthToken = request.cookies.get('sb-eftwoxknsaulyptnswxe-auth-token')
  const hasAuth = !!supabaseAuthToken

  // Redirect to login if not authenticated and not on a public route
  if (!hasAuth && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if authenticated and on login page
  if (hasAuth && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
