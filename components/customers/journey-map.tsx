'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Target,
  Lightbulb,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  type CustomerJourneyEvent,
  type JourneyEventType,
  type CustomerLandStatus,
  JOURNEY_EVENT_CONFIG,
  CUSTOMER_LAND_STATUS_CONFIG,
} from '@/types/database'

interface JourneyMapProps {
  customerId: string
  customerName: string
  landStatus: CustomerLandStatus
  events: CustomerJourneyEvent[]
  pipelineStatus: string
  onAddEvent?: () => void
  onEditLandStatus?: () => void
}

// キーマイルストーン（契約への道のり）
const KEY_MILESTONES: JourneyEventType[] = [
  'MH見学会参加',
  '初回面談',
  '構造見学会参加',
  'プラン提案',
  '建築申込',
  '契約',
]

export function JourneyMap({
  customerId,
  customerName,
  landStatus,
  events,
  pipelineStatus,
  onAddEvent,
  onEditLandStatus,
}: JourneyMapProps) {
  const [showAllEvents, setShowAllEvents] = useState(false)

  // イベントを日付順にソート
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  }, [events])

  // 完了したマイルストーンを取得
  const completedMilestones = useMemo(() => {
    const eventTypes = new Set(sortedEvents.map(e => e.event_type))
    return KEY_MILESTONES.filter(m => eventTypes.has(m))
  }, [sortedEvents])

  // 次のマイルストーンを取得
  const nextMilestone = useMemo(() => {
    const eventTypes = new Set(sortedEvents.map(e => e.event_type))
    return KEY_MILESTONES.find(m => !eventTypes.has(m))
  }, [sortedEvents])

  // 初回接触からの日数
  const daysSinceFirstContact = useMemo(() => {
    if (sortedEvents.length === 0) return 0
    const firstEvent = sortedEvents[0]
    const days = Math.floor(
      (new Date().getTime() - new Date(firstEvent.event_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }, [sortedEvents])

  // 進捗率
  const progressPercentage = useMemo(() => {
    return Math.round((completedMilestones.length / KEY_MILESTONES.length) * 100)
  }, [completedMilestones])

  // 土地状況の設定
  const landConfig = CUSTOMER_LAND_STATUS_CONFIG[landStatus] || CUSTOMER_LAND_STATUS_CONFIG['土地探し中']

  // 表示するイベント（最新5件または全件）
  const displayEvents = showAllEvents ? sortedEvents : sortedEvents.slice(-5)

  return (
    <div className="space-y-4">
      {/* ヘッダー：土地状況 + 進捗サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 土地状況 */}
        <Card
          className={cn('border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow', landConfig.bgColor)}
          onClick={onEditLandStatus}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {landStatus === '土地あり' && <CheckCircle2 className={cn('w-6 h-6', landConfig.color)} />}
                {landStatus === '土地探し中' && <Search className={cn('w-6 h-6', landConfig.color)} />}
                {landStatus === '土地契約済' && <MapPin className={cn('w-6 h-6', landConfig.color)} />}
                {landStatus === '土地決済済' && <CheckCircle2 className={cn('w-6 h-6', landConfig.color)} />}
                <div>
                  <p className="text-xs text-gray-600">土地状況</p>
                  <p className={cn('font-bold', landConfig.color)}>{landConfig.label}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 経過日数 */}
        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">初回接触から</p>
                <p className="font-bold text-blue-700">{daysSinceFirstContact}日</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 進捗率 */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-orange-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">契約への進捗</p>
                  <p className="font-bold text-orange-700">{progressPercentage}%</p>
                </div>
                <div className="mt-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* マイルストーンマップ */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              契約への道のり
            </CardTitle>
            {nextMilestone && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Lightbulb className="w-3 h-3 mr-1" />
                次の目標: {JOURNEY_EVENT_CONFIG[nextMilestone].label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* マイルストーンタイムライン */}
          <div className="flex items-center justify-between py-4 overflow-x-auto">
            {KEY_MILESTONES.map((milestone, index) => {
              const config = JOURNEY_EVENT_CONFIG[milestone]
              const isCompleted = completedMilestones.includes(milestone)
              const isNext = milestone === nextMilestone
              const event = sortedEvents.find(e => e.event_type === milestone)

              return (
                <div key={milestone} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted
                          ? `${config.bgColor} ${config.color} border-current`
                          : isNext
                            ? 'border-orange-400 bg-orange-50 text-orange-500 animate-pulse'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <p
                      className={cn(
                        'mt-2 text-xs font-medium text-center whitespace-nowrap',
                        isCompleted ? config.color : 'text-gray-400'
                      )}
                    >
                      {config.label}
                    </p>
                    {event && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(event.event_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {index < KEY_MILESTONES.length - 1 && (
                    <ArrowRight
                      className={cn(
                        'w-6 h-6 mx-2 flex-shrink-0',
                        completedMilestones.includes(KEY_MILESTONES[index + 1])
                          ? 'text-green-400'
                          : 'text-gray-200'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* イベント履歴 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              行動履歴
              <Badge variant="secondary" className="ml-2">
                {sortedEvents.length}件
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              onClick={onAddEvent}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              イベント追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>行動履歴がありません</p>
              <p className="text-sm mt-1">イベントを追加して契約への道のりを記録しましょう</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayEvents.map((event, index) => {
                  const config = JOURNEY_EVENT_CONFIG[event.event_type as JourneyEventType] || JOURNEY_EVENT_CONFIG['その他']
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors',
                        config.isKeyMilestone && 'bg-gradient-to-r from-orange-50/50 to-transparent'
                      )}
                    >
                      {/* アイコン */}
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', config.bgColor)}>
                        <CheckCircle2 className={cn('w-5 h-5', config.color)} />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-medium', config.color)}>{config.label}</span>
                          {config.isKeyMilestone && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-300 text-orange-600">
                              重要
                            </Badge>
                          )}
                        </div>
                        {event.location && (
                          <p className="text-sm text-gray-600 mt-0.5">{event.location}</p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.notes}</p>
                        )}
                        {event.next_action && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                            <Lightbulb className="w-3 h-3" />
                            次: {event.next_action}
                            {event.next_action_date && (
                              <span className="text-gray-400">
                                ({new Date(event.next_action_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 日付 */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(event.event_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </p>
                        {event.staff_name && (
                          <p className="text-xs text-gray-500">{event.staff_name}</p>
                        )}
                        {event.outcome && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'mt-1 text-[10px]',
                              event.outcome === '良好' && 'border-green-300 text-green-600',
                              event.outcome === '普通' && 'border-gray-300 text-gray-600',
                              event.outcome === '要フォロー' && 'border-red-300 text-red-600'
                            )}
                          >
                            {event.outcome}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* もっと見る */}
              {sortedEvents.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-gray-500"
                  onClick={() => setShowAllEvents(!showAllEvents)}
                >
                  {showAllEvents ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      すべて表示 ({sortedEvents.length - 5}件)
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
