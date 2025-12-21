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

// 開発モード - 常に有効
const isDevMode = true

// 開発用デフォルトユーザー（営業として自動ログイン）
const devDefaultUser: DBUser = {
  id: '00000000-0000-0000-0000-000000000001',
  tenant_id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
  name: '開発ユーザー',
  phone: null,
  department: '営業部',
  role: 'admin', // adminで全機能アクセス可能
  is_active: true,
  created_at: new Date().toISOString(),
}

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

      // 開発モードではデフォルトユーザーを自動設定
      if (isDevMode && !isAuthenticated) {
        console.log('[Auth] Dev mode: Auto-login as dev user')
        setUser(devDefaultUser)
        setLoading(false)
        return
      }

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
              role: 'sales',
              is_active: true,
              created_at: new Date().toISOString(),
            }
            console.log('[Auth] Creating new user from session:', newUser.name)
            setUser(newUser)
          }
        } else if (isDevMode) {
          // 開発モードでセッションがない場合はデフォルトユーザーを設定
          console.log('[Auth] Dev mode: Using default user')
          setUser(devDefaultUser)
          setLoading(false)
        } else {
          // セッションがなく、ローカルストアにも認証がない場合
          if (!isAuthenticated) {
            console.log('[Auth] No session, not authenticated')
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error)
        // 開発モードではエラーでもデフォルトユーザーを設定
        if (isDevMode) {
          setUser(devDefaultUser)
        }
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
              role: 'sales',
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
