'use client'

import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone } from 'lucide-react'

// Mock data
const mockUsers = [
  { id: '1', name: '田畑 美香', email: 'tabata@g-house.com', phone: '090-2280-4404', department: '営業部', role: 'staff' },
  { id: '2', name: '佐古 祐太', email: 'sako@g-house.com', phone: '080-6854-8207', department: '営業部', role: 'staff' },
  { id: '3', name: '德田 耕明', email: 'tokuda@g-house.com', phone: '090-8327-0698', department: '営業部', role: 'staff' },
  { id: '4', name: '西野 秀樹', email: 'nishino@g-house.com', phone: '070-3788-3295', department: '営業部', role: 'manager' },
  { id: '5', name: '管理者', email: 'admin@g-house.com', phone: '-', department: null, role: 'admin' },
]

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-orange-100 text-orange-700',
  staff: 'bg-blue-100 text-blue-700',
}

const roleLabels: Record<string, string> = {
  admin: '管理者',
  manager: '部門長',
  staff: '営業',
}

export default function UsersPage() {
  const router = useRouter()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="text-gray-500">ユーザーと権限を管理</p>
          </div>
        </div>

        {/* Users List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-600">ユーザー</th>
                    <th className="text-left p-4 font-medium text-gray-600">連絡先</th>
                    <th className="text-left p-4 font-medium text-gray-600">部署</th>
                    <th className="text-center p-4 font-medium text-gray-600">権限</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-2" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {user.department || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
