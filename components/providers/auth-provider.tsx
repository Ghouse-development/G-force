'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuthStore } from '@/store'
import { userDb } from '@/lib/db'
import type { User as DBUser } from '@/types/database'

interface AuthProviderProps {
  children: React.ReactNode
}

// 開発モードかどうか
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// 認証不要のパス
const publicPaths = ['/login', '/api']

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = getSupabaseClient()

    // 初期認証状態の確認
    const initAuth = async () => {
      setLoading(true)

      try {
        // Supabaseのセッションを確認
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Supabaseユーザーがある場合、DBからユーザー情報を取得
          const dbUser = await userDb.getByEmail(session.user.email || '')

          if (dbUser) {
            console.log('[Auth] User found in database:', dbUser.name)
            setUser(dbUser)
          } else {
            // DBにユーザーがない場合は基本情報でユーザーを作成
            const newUser: DBUser = {
              id: session.user.id,
              tenant_id: '00000000-0000-0000-0000-000000000001',
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              phone: null,
              department: null,
              role: 'staff',
              is_active: true,
              created_at: new Date().toISOString(),
            }
            console.log('[Auth] Creating new user from session:', newUser.name)
            setUser(newUser)
          }
        } else {
          // セッションがなく、ローカルストアにも認証がない場合
          if (!isAuthenticated) {
            console.log('[Auth] No session, not authenticated')
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error)
        setLoading(false)
      }
    }

    initAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          // ログイン時
          const dbUser = await userDb.getByEmail(session.user.email || '').catch(() => null)

          if (dbUser) {
            setUser(dbUser)
          } else {
            const newUser: DBUser = {
              id: session.user.id,
              tenant_id: '00000000-0000-0000-0000-000000000001',
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              phone: null,
              department: null,
              role: 'staff',
              is_active: true,
              created_at: new Date().toISOString(),
            }
            setUser(newUser)
          }

          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          // ログアウト時
          setUser(null)
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, setUser, setLoading, isAuthenticated])

  // 開発モードでない場合、未認証ユーザーをログインページにリダイレクト
  useEffect(() => {
    if (isDevMode) return // 開発モードではリダイレクトしない

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    if (!isAuthenticated && !isPublicPath) {
      console.log('[Auth] Redirecting to login (not authenticated)')
      router.push('/login')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}
