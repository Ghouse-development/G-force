'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
  FileSignature,
  FileEdit,
  Users,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNotificationStore, type NotificationCategory, type NotificationType } from '@/store'
import { cn } from '@/lib/utils'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PlanRequestListSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'

// 通知タイプに応じたアイコン
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />
  }
}

// カテゴリに応じたアイコン
const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'contract':
      return <FileSignature className="w-4 h-4" />
    case 'plan_request':
      return <FileEdit className="w-4 h-4" />
    case 'customer':
      return <Users className="w-4 h-4" />
    case 'system':
    default:
      return <Settings className="w-4 h-4" />
  }
}

// カテゴリ名
const categoryLabels: Record<NotificationCategory, string> = {
  contract: '契約',
  plan_request: 'プラン依頼',
  customer: '顧客',
  system: 'システム',
}

// 相対時間の表示
const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  return date.toLocaleDateString('ja-JP')
}

export default function NotificationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Layout>
        <PlanRequestListSkeleton count={4} />
      </Layout>
    )
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    toast.success('すべて既読にしました')
  }

  const handleClearAll = () => {
    clearAll()
    toast.success('すべての通知を削除しました')
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: '通知' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">通知</h1>
              {unreadCount > 0 && (
                <Badge className="bg-red-500">{unreadCount}件未読</Badge>
              )}
              <HelpTooltip content="承認フローやシステムからの通知を確認できます。クリックで詳細ページへ移動します。" />
            </div>
            <p className="text-gray-600 text-sm mt-1">
              承認フローやシステムからの通知
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              すべて既読
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              すべて削除
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            すべて ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            未読 ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 text-base">
                  {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  新しい通知が届くとここに表示されます
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                      !notification.read && 'bg-orange-50/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={cn(
                            'font-semibold text-gray-900',
                            !notification.read && 'text-orange-700'
                          )}>
                            {notification.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(notification.category)}
                            <span className="ml-1">{categoryLabels[notification.category]}</span>
                          </Badge>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {notification.linkUrl && (
                            <span className="text-sm text-orange-500 flex items-center">
                              {notification.linkLabel || '詳細'}
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center space-x-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        {notifications.length > 0 && (
          <p className="text-center text-sm text-gray-600">
            通知は最大100件まで保存されます
          </p>
        )}
      </div>
    </Layout>
  )
}
