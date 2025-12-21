import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 開発モードかどうか
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// 認証不要のパス
const publicPaths = ['/login', '/api/auth']

// 静的アセットのパス
const staticPaths = ['/_next', '/favicon.ico', '/logo.jpg']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静的アセットはスキップ
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 開発モードではミドルウェアをスキップ
  if (isDevMode) {
    return NextResponse.next()
  }

  // 公開パスはスキップ
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Supabaseセッションを確認
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
