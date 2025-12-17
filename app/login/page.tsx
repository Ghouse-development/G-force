'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { getSupabaseClient } from '@/lib/supabase'
import { ArrowRight, User, Shield, Chrome } from 'lucide-react'
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

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

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
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-8">
            <Image
              src="/logo.jpg"
              alt="G House"
              width={120}
              height={120}
              className="rounded-2xl shadow-xl"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            G-force
          </h1>
          <p className="text-lg text-muted-foreground">
            業務効率を最大化する
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-10 bg-white/90 backdrop-blur-2xl border-0 shadow-2xl rounded-3xl animate-slide-in">
          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3" />
                ログイン中...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                Googleでログイン
                <ArrowRight className="w-5 h-5 ml-3" />
              </div>
            )}
          </Button>

          {/* Development Quick Login */}
          {isDevMode && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-sm font-medium text-center text-gray-500 mb-5">
                開発用クイックログイン
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('sales')}
                  disabled={isLoading}
                  className="h-12 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium">営業</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('manager')}
                  disabled={isLoading}
                  className="h-12 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <User className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium">部門長</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDevLogin('admin')}
                  disabled={isLoading}
                  className="h-12 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">管理者</span>
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-gray-400">
            © 2024 G-force by G-house
          </p>
          <p className="text-xs text-gray-400">
            業務システム v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
