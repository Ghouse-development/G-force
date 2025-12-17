'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Calendar, ChevronRight, Bell } from 'lucide-react'
import { formatDistanceToNow, differenceInDays, isPast, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DeadlineItem {
  id: string
  type: 'plan_request' | 'contract' | 'handover' | 'customer'
  title: string
  deadline: string
  customerName?: string
  href: string
}

interface DeadlineAlertsProps {
  items: DeadlineItem[]
  maxItems?: number
}

const typeConfig = {
  plan_request: {
    label: 'プラン依頼',
    color: 'bg-blue-100 text-blue-700',
    icon: '📋',
  },
  contract: {
    label: '契約書',
    color: 'bg-purple-100 text-purple-700',
    icon: '📄',
  },
  handover: {
    label: '引継書',
    color: 'bg-green-100 text-green-700',
    icon: '📝',
  },
  customer: {
    label: '顧客',
    color: 'bg-orange-100 text-orange-700',
    icon: '👤',
  },
}

function getUrgencyLevel(deadline: string): 'overdue' | 'today' | 'urgent' | 'normal' {
  const deadlineDate = new Date(deadline)
  const daysUntil = differenceInDays(deadlineDate, new Date())

  if (isPast(deadlineDate) && !isToday(deadlineDate)) return 'overdue'
  if (isToday(deadlineDate)) return 'today'
  if (daysUntil <= 3) return 'urgent'
  return 'normal'
}

const urgencyConfig = {
  overdue: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    label: '期限超過',
  },
  today: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: '本日期限',
  },
  urgent: {
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    label: '要対応',
  },
  normal: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    label: '',
  },
}

export function DeadlineAlerts({ items, maxItems = 5 }: DeadlineAlertsProps) {
  // 期限でソート（期限超過 → 本日 → 近い順）
  const sortedItems = [...items]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, maxItems)

  const overdueCount = items.filter(i => getUrgencyLevel(i.deadline) === 'overdue').length
  const todayCount = items.filter(i => getUrgencyLevel(i.deadline) === 'today').length

  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-orange-500" />
            期限アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>期限が近い項目はありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-orange-500" />
            期限アラート
          </CardTitle>
          <div className="flex gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount}件超過
              </Badge>
            )}
            {todayCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                {todayCount}件本日
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedItems.map((item) => {
          const urgency = getUrgencyLevel(item.deadline)
          const uConfig = urgencyConfig[urgency]
          const tConfig = typeConfig[item.type]
          const deadlineDate = new Date(item.deadline)

          return (
            <Link key={`${item.type}-${item.id}`} href={item.href}>
              <div className={`p-3 rounded-lg border ${uConfig.bg} hover:shadow-md transition-all cursor-pointer group`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg">{tConfig.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${tConfig.color} border-0`}>
                          {tConfig.label}
                        </Badge>
                        {uConfig.label && (
                          <Badge variant="outline" className={`text-xs ${uConfig.badge}`}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {uConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 truncate">{item.title}</p>
                      {item.customerName && (
                        <p className="text-xs text-gray-500">{item.customerName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${uConfig.text}`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {deadlineDate.toLocaleDateString('ja-JP')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {items.length > maxItems && (
          <div className="text-center pt-2">
            <Link href="/customers" className="text-sm text-orange-500 hover:text-orange-600">
              他{items.length - maxItems}件を表示
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
