'use client'

import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import {
  Package,
  Users,
  Settings,
  ChevronRight,
  Building2,
  Target,
  Bell,
  Database,
  Shield,
  Download,
  Building,
  Link2,
  ClipboardCheck,
  Sliders,
} from 'lucide-react'

const adminMenus = [
  {
    title: '商品マスタ',
    description: '商品と坪単価を管理',
    icon: Package,
    href: '/admin/products',
  },
  {
    title: 'マスターデータ管理',
    description: '選択肢やマスターデータを管理',
    icon: Database,
    href: '/admin/master-data',
  },
  {
    title: 'ユーザー管理',
    description: 'ユーザーと権限を管理',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'セキュリティ設定',
    description: 'アクセス権限とセキュリティ',
    icon: Shield,
    href: '/admin/security',
  },
  {
    title: 'バックアップ・エクスポート',
    description: 'データのバックアップと出力',
    icon: Download,
    href: '/admin/backup',
  },
  {
    title: 'FC（フランチャイズ）管理',
    description: '加盟店・テナント管理',
    icon: Building,
    href: '/admin/franchise',
  },
  {
    title: '外部連携',
    description: 'kintone・Formbridge・スプレッドシート',
    icon: Link2,
    href: '/admin/integrations',
  },
  {
    title: 'パイプラインチェックリスト',
    description: '各ステージでやるべきことを設定',
    icon: ClipboardCheck,
    href: '/admin/checklists',
  },
  {
    title: 'ノーコード設定',
    description: 'パイプライン・ジャーニー・土地条件',
    icon: Sliders,
    href: '/admin/nocode-settings',
  },
  {
    title: '営業目標設定',
    description: '月次目標を設定',
    icon: Target,
    href: '/admin/targets',
    disabled: true,
  },
  {
    title: '通知設定',
    description: '通知タイミングを設定',
    icon: Bell,
    href: '/admin/notifications',
    disabled: true,
  },
]

export default function AdminPage() {
  const { user } = useAuthStore()

  // Check if user has admin role
  if (user?.role !== 'admin') {
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
        <div className="flex flex-wrap items-center gap-6 py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">商品数</span>
            <span className="text-xl font-bold text-gray-900">14</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ユーザー数</span>
            <span className="text-xl font-bold text-gray-900">24</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">テナント</span>
            <span className="text-xl font-bold text-gray-900">1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">システム状態</span>
            <span className="text-lg font-bold text-green-600">正常稼働中</span>
          </div>
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
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-gray-600" />
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
