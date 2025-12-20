'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { getSupabaseClient } from '@/lib/supabase'
import { User, Shield, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import type { User as DBUser } from '@/types/database'

// Development mock users
const mockUsers: Record<string, DBUser> = {
  sales: {
    id: 'dev-sales-001',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'sales@g-house.com',
    name: '田畑 美香',
    phone: null,
    department: '営業部',
    role: 'staff',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  manager: {
    id: 'dev-manager-001',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'manager@g-house.com',
    name: '佐藤 部長',
    phone: null,
    department: '営業部',
    role: 'manager',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  admin: {
    id: 'dev-admin-001',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@g-house.com',
    name: '管理者',
    phone: null,
    department: null,
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
}

// Show dev login buttons (enabled during development phase)
const showDevLogin = true

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Login error:', error)
      toast.error('ログインに失敗しました')
      setIsLoading(false)
    }
  }

  const handleDevLogin = (role: 'sales' | 'manager' | 'admin') => {
    setIsLoading(true)
    const user = mockUsers[role]

    setTimeout(() => {
      setUser(user)
      toast.success(`${user.name}としてログインしました`)
      router.push('/dashboard')
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            G-force
          </h1>
          <p className="text-lg text-muted-foreground">
            業務効率を最大化する
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-10 bg-white/90 backdrop-blur-2xl border-0 shadow-2xl rounded-3xl animate-slide-in">
          {/* Quick Login - Development only */}
          {showDevLogin && (
            <div className="mb-8">
              <p className="text-sm font-medium text-center text-gray-500 mb-5">
                開発モード：テストアカウント
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('sales')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-medium">営業</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('manager')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-medium">部門長</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('admin')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-xs font-medium">管理者</span>
                </Button>
              </div>
            </div>
          )}

          {/* Google Login */}
          <div className={showDevLogin ? "pt-6 border-t border-gray-100" : ""}>
            {showDevLogin ? (
              <p className="text-xs text-center text-gray-400 mb-4">
                または
              </p>
            ) : (
              <p className="text-sm font-medium text-center text-gray-500 mb-5">
                アカウントでログイン
              </p>
            )}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl transition-all duration-300 hover:bg-gray-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                  ログイン中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Chrome className="w-4 h-4 mr-2 text-blue-500" />
                  Googleでログイン
                </div>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
