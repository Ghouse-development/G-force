'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  History,
  Plus,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  FileText,
  Home,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

// 活動タイプ
export type ActivityType =
  | '電話'
  | 'メール'
  | '来店'
  | '訪問'
  | 'MH見学'
  | '打合せ'
  | 'プラン提案'
  | '見積提出'
  | '契約'
  | 'その他'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  date: string
  createdBy?: string
  nextAction?: string
  nextActionDate?: string
}

const activityTypeConfig: Record<ActivityType, { icon: typeof Phone; color: string; bgColor: string }> = {
  '電話': { icon: Phone, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'メール': { icon: Mail, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  '来店': { icon: MapPin, color: 'text-green-600', bgColor: 'bg-green-100' },
  '訪問': { icon: Home, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'MH見学': { icon: Home, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  '打合せ': { icon: MessageSquare, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'プラン提案': { icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  '見積提出': { icon: FileText, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  '契約': { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  'その他': { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

interface ActivityTimelineProps {
  activities: Activity[]
  customerId: string
  onAddActivity?: (activity: Omit<Activity, 'id'>) => void
  maxItems?: number
  showAddForm?: boolean
}

export function ActivityTimeline({
  activities,
  customerId: _customerId,
  onAddActivity,
  maxItems = 5,
  showAddForm = true,
}: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newActivity, setNewActivity] = useState<{
    type: ActivityType
    title: string
    description: string
    nextAction: string
    nextActionDate: string
  }>({
    type: '電話',
    title: '',
    description: '',
    nextAction: '',
    nextActionDate: '',
  })

  const displayedActivities = isExpanded ? activities : activities.slice(0, maxItems)
  const hasMore = activities.length > maxItems

  const handleSubmit = () => {
    if (!newActivity.title.trim()) return

    onAddActivity?.({
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      date: new Date().toISOString(),
      nextAction: newActivity.nextAction || undefined,
      nextActionDate: newActivity.nextActionDate || undefined,
    })

    setNewActivity({
      type: '電話',
      title: '',
      description: '',
      nextAction: '',
      nextActionDate: '',
    })
    setIsAddingNew(false)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-lg">
          <History className="w-5 h-5 mr-2 text-orange-500" />
          活動履歴
        </CardTitle>
        {showAddForm && (
          <Button
            size="sm"
            variant={isAddingNew ? 'outline' : 'default'}
            onClick={() => setIsAddingNew(!isAddingNew)}
            className={!isAddingNew ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isAddingNew ? 'キャンセル' : '活動記録'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新規活動フォーム */}
        {isAddingNew && (
          <div className="p-4 bg-orange-50 rounded-lg space-y-3 border border-orange-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">活動種別</label>
                <Select
                  value={newActivity.type}
                  onValueChange={(v) => setNewActivity({ ...newActivity, type: v as ActivityType })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(activityTypeConfig) as ActivityType[]).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="例：初回電話ヒアリング"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">内容</label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder="活動の詳細..."
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">次のアクション</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="例：資料送付"
                  value={newActivity.nextAction}
                  onChange={(e) => setNewActivity({ ...newActivity, nextAction: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">次回日程</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  value={newActivity.nextActionDate}
                  onChange={(e) => setNewActivity({ ...newActivity, nextActionDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newActivity.title.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                記録する
              </Button>
            </div>
          </div>
        )}

        {/* タイムライン */}
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>活動履歴がありません</p>
            <p className="text-sm mt-1">上のボタンから活動を記録しましょう</p>
          </div>
        ) : (
          <div className="relative">
            {/* タイムラインの縦線 */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {displayedActivities.map((activity) => {
                const config = activityTypeConfig[activity.type]
                const Icon = config.icon

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 pl-2">
                    {/* アイコン */}
                    <div className={`relative z-10 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: ja })}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      {activity.nextAction && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-md text-sm">
                          <span className="text-yellow-700 font-medium">次回: </span>
                          <span className="text-gray-700">{activity.nextAction}</span>
                          {activity.nextActionDate && (
                            <span className="text-gray-500 ml-2">
                              ({new Date(activity.nextActionDate).toLocaleDateString('ja-JP')})
                            </span>
                          )}
                        </div>
                      )}
                      {activity.createdBy && (
                        <p className="text-xs text-gray-400 mt-2">記録: {activity.createdBy}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* もっと見る/閉じる */}
            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-orange-500"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      他{activities.length - maxItems}件を表示
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
