'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  UserPlus,
  FileEdit,
  FileSignature,
  Phone,
  Calendar,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import type { Customer, PlanRequest, UserRole, ContractStatus } from '@/types/database'

interface SimpleContract {
  id?: string
  status?: ContractStatus
}

interface TodayTasksGuideProps {
  customers: Partial<Customer>[]
  contracts: SimpleContract[]
  planRequests: Partial<PlanRequest>[]
  userRole?: UserRole
  userName?: string
}

interface TaskItem {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  href: string
  icon: React.ReactNode
  count?: number
  actionLabel: string
}

export function TodayTasksGuide({
  customers,
  contracts,
  planRequests,
  userRole = 'sales',
  userName: _userName,
}: TodayTasksGuideProps) {
  const tasks = useMemo(() => {
    const taskList: TaskItem[] = []

    // 高優先度: 期限が今日・明日のプラン依頼
    const urgentPlanRequests = planRequests.filter(p => {
      if (!p.deadline || p.status === '完了') return false
      const deadline = new Date(p.deadline)
      const today = new Date()
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 2
    })
    if (urgentPlanRequests.length > 0) {
      taskList.push({
        id: 'urgent-plans',
        priority: 'high',
        title: '期限間近のプラン依頼',
        description: `${urgentPlanRequests.length}件のプラン依頼が期限間近です`,
        href: '/plan-requests?status=確認待ち',
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        count: urgentPlanRequests.length,
        actionLabel: '確認する',
      })
    }

    // 中優先度: 承認待ちの契約書（リーダー・管理者向け）
    if (userRole === 'sales_leader' || userRole === 'admin') {
      const pendingContracts = contracts.filter(c =>
        c.status === '上長承認待ち' || c.status === '書類確認'
      )
      if (pendingContracts.length > 0) {
        taskList.push({
          id: 'pending-contracts',
          priority: 'high',
          title: '承認待ちの契約書',
          description: `${pendingContracts.length}件の契約書が承認を待っています`,
          href: '/contracts?status=承認待ち',
          icon: <FileSignature className="w-5 h-5 text-purple-500" />,
          count: pendingContracts.length,
          actionLabel: '承認する',
        })
      }
    }

    // 中優先度: 確認待ちのプラン依頼（設計部門向け）
    if (userRole === 'design' || userRole === 'design_manager' || userRole === 'admin') {
      const pendingPlans = planRequests.filter(p => p.status === '確認待ち')
      if (pendingPlans.length > 0) {
        taskList.push({
          id: 'pending-plans',
          priority: 'medium',
          title: '確認待ちのプラン依頼',
          description: `${pendingPlans.length}件のプラン依頼が確認を待っています`,
          href: '/plan-requests?status=確認待ち',
          icon: <FileEdit className="w-5 h-5 text-orange-500" />,
          count: pendingPlans.length,
          actionLabel: '確認する',
        })
      }
    }

    // 営業向け: 今週の面談予定
    const thisWeekMeetings = customers.filter(c => {
      if (!c.meeting_date) return false
      const meetingDate = new Date(c.meeting_date)
      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return meetingDate >= today && meetingDate <= weekFromNow
    })
    if (thisWeekMeetings.length > 0) {
      taskList.push({
        id: 'this-week-meetings',
        priority: 'medium',
        title: '今週の面談予定',
        description: `${thisWeekMeetings.length}件の面談が予定されています`,
        href: '/customers?status=面談',
        icon: <Calendar className="w-5 h-5 text-cyan-500" />,
        count: thisWeekMeetings.length,
        actionLabel: '確認する',
      })
    }

    // 営業向け: フォローが必要な限定会員
    const followUpNeeded = customers.filter(c => {
      if (c.pipeline_status !== '限定会員') return false
      if (!c.created_at) return false
      const createdAt = new Date(c.created_at)
      const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreated >= 7 // 7日以上経過
    })
    if (followUpNeeded.length > 0) {
      taskList.push({
        id: 'follow-up',
        priority: 'low',
        title: 'フォローアップが必要',
        description: `${followUpNeeded.length}名の限定会員にフォローが必要です`,
        href: '/customers?status=限定会員',
        icon: <Phone className="w-5 h-5 text-blue-500" />,
        count: followUpNeeded.length,
        actionLabel: '確認する',
      })
    }

    // タスクがない場合の提案
    if (taskList.length === 0) {
      if (customers.length === 0) {
        taskList.push({
          id: 'first-customer',
          priority: 'medium',
          title: '最初の反響を登録しましょう',
          description: '新規のお問い合わせを登録して、お客様管理を始めましょう',
          href: '/customers/new',
          icon: <UserPlus className="w-5 h-5 text-orange-500" />,
          actionLabel: '登録する',
        })
      } else {
        taskList.push({
          id: 'all-done',
          priority: 'low',
          title: '今日のタスクは完了です',
          description: '素晴らしい！すべてのタスクが完了しています',
          href: '/customers',
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          actionLabel: 'お客様を見る',
        })
      }
    }

    return taskList.slice(0, 3) // 最大3件表示
  }, [customers, contracts, planRequests, userRole])

  const priorityConfig = {
    high: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    medium: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    low: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' },
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
          今日やること
          {tasks.length > 0 && tasks[0].priority !== 'low' && (
            <Badge className="ml-2 bg-orange-500 text-white">
              {tasks.filter(t => t.priority === 'high').length > 0
                ? `${tasks.filter(t => t.priority === 'high').length}件の緊急タスク`
                : `${tasks.length}件のタスク`
              }
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const config = priorityConfig[task.priority]
          return (
            <Link key={task.id} href={task.href}>
              <div className={`p-4 rounded-xl ${config.bg} border ${config.border} hover:shadow-md transition-all group`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{task.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-gray-900">{task.title}</h4>
                        {task.count && (
                          <Badge className={config.badge}>{task.count}件</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white hover:bg-gray-50 text-gray-700 border shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors"
                  >
                    {task.actionLabel}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
