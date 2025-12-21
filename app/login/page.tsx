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

// Development mock users - matches schema.sql
const mockUsers: Record<string, DBUser> = {
  sales: {
    id: '00000000-0000-0000-0000-000000000101',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'sales@g-house.com',
    name: '田畑 美香',
    phone: null,
    department: '営業部',
    role: 'sales',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  sales_leader: {
    id: '00000000-0000-0000-0000-000000000102',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'leader@g-house.com',
    name: '山田 リーダー',
    phone: null,
    department: '営業部',
    role: 'sales_leader',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  sales_office: {
    id: '00000000-0000-0000-0000-000000000103',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'office@g-house.com',
    name: '鈴木 事務',
    phone: null,
    department: '営業事務部',
    role: 'sales_office',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  design_manager: {
    id: '00000000-0000-0000-0000-000000000104',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'design-mgr@g-house.com',
    name: '高橋 設計部門長',
    phone: null,
    department: '設計部',
    role: 'design_manager',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  construction_manager: {
    id: '00000000-0000-0000-0000-000000000105',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'construction-mgr@g-house.com',
    name: '伊藤 工事部門長',
    phone: null,
    department: '工事部',
    role: 'construction_manager',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000106',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@g-house.com',
    name: '本部 管理者',
    phone: null,
    department: '本部',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
}

// Show dev login buttons always during development
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

  const handleDevLogin = (role: 'sales' | 'sales_leader' | 'sales_office' | 'design_manager' | 'construction_manager' | 'admin') => {
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
                  onClick={() => handleDevLogin('sales_leader')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium">営業L</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('sales_office')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-purple-500 hover:bg-purple-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-medium">事務</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('design_manager')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-medium">設計長</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('construction_manager')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-5 h-5 text-yellow-600" />
                  <span className="text-xs font-medium">工事長</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('admin')}
                  disabled={isLoading}
                  className="h-14 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-xs font-medium">本部</span>
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
