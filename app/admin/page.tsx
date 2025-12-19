'use client'

import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import {
  Package,
  Users,
  Settings,
  BarChart3,
  ChevronRight,
  Building2,
  Target,
  Bell,
} from 'lucide-react'

const adminMenus = [
  {
    title: '商品マスタ',
    description: '商品と坪単価を管理',
    icon: Package,
    href: '/admin/products',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    title: 'ユーザー管理',
    description: 'ユーザーと権限を管理',
    icon: Users,
    href: '/admin/users',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: '営業目標設定',
    description: '月次目標を設定',
    icon: Target,
    href: '/admin/targets',
    color: 'from-green-500 to-emerald-500',
    disabled: true,
  },
  {
    title: '通知設定',
    description: '通知タイミングを設定',
    icon: Bell,
    href: '/admin/notifications',
    color: 'from-purple-500 to-indigo-500',
    disabled: true,
  },
]

export default function AdminPage() {
  const { user } = useAuthStore()

  // Check if user has admin or manager role
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">管理者または部門長の権限が必要です</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理画面</h1>
          <p className="text-gray-500 mt-1">システム設定とマスタデータを管理</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">商品数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">14</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">ユーザー数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">24</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">テナント</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">1</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">システム状態</p>
                  <p className="text-lg font-bold text-green-600 mt-1">正常稼働中</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminMenus.map((menu) => {
            const Icon = menu.icon
            const content = (
              <Card
                className={`border-0 shadow-lg transition-all duration-200 ${
                  menu.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-xl cursor-pointer group'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${menu.color} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {menu.title}
                        </h3>
                        <p className="text-gray-500">{menu.description}</p>
                      </div>
                    </div>
                    {!menu.disabled && (
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    )}
                    {menu.disabled && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )

            if (menu.disabled) {
              return <div key={menu.href}>{content}</div>
            }

            return (
              <Link key={menu.href} href={menu.href}>
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
