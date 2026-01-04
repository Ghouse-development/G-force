'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Phone,
  Mail,
  MessageSquare,
  Video,
  Users,
  Clock,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { type CustomerJourneyEvent, type JourneyEventType } from '@/types/database'
import { toast } from 'sonner'

interface CommunicationLogProps {
  customerId: string
  events?: CustomerJourneyEvent[]
  onAddEvent?: (event: Omit<CustomerJourneyEvent, 'id' | 'created_at' | 'updated_at'>) => void
  defaultOpen?: boolean
}

// コミュニケーション種別
type CommunicationType = 'phone' | 'email' | 'message' | 'video' | 'meeting'

const communicationConfig: Record<CommunicationType, {
  label: string
  journeyType: JourneyEventType
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  phone: {
    label: '電話',
    journeyType: '電話フォロー',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  email: {
    label: 'メール',
    journeyType: '電話フォロー', // 既存のタイプを利用
    icon: <Mail className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  message: {
    label: 'LINE/SMS',
    journeyType: '電話フォロー',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  video: {
    label: 'オンライン',
    journeyType: 'オンライン面談',
    icon: <Video className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  meeting: {
    label: '対面',
    journeyType: '面談',
    icon: <Users className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
}

// 結果ステータス
type OutcomeType = 'good' | 'normal' | 'need_followup' | 'no_answer'

const outcomeConfig: Record<OutcomeType, {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}> = {
  good: {
    label: '良好',
    value: '良好',
    icon: <Check className="w-3 h-3" />,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  normal: {
    label: '普通',
    value: '普通',
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  need_followup: {
    label: '要フォロー',
    value: '要フォロー',
    icon: <Clock className="w-3 h-3" />,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  no_answer: {
    label: '不通',
    value: '不通',
    icon: <X className="w-3 h-3" />,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
}

export function CommunicationLog({ customerId, events = [], onAddEvent, defaultOpen = true }: CommunicationLogProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [selectedType, setSelectedType] = useState<CommunicationType>('phone')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState<OutcomeType>('normal')
  const [nextAction, setNextAction] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // コミュニケーション関連のイベントのみフィルタ
  const communicationEvents = events.filter(e =>
    e.event_type === '電話フォロー' ||
    e.event_type === 'オンライン面談' ||
    e.event_type === '面談' ||
    e.event_type === '初回面談'
  )

  const displayEvents = showAll ? communicationEvents : communicationEvents.slice(0, 3)

  const handleQuickAdd = async (type: CommunicationType) => {
    setSelectedType(type)
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!onAddEvent) return

    setIsSubmitting(true)
    try {
      const config = communicationConfig[selectedType]
      const outcomeValue = outcomeConfig[outcome].value

      onAddEvent({
        customer_id: customerId,
        event_type: config.journeyType,
        event_date: new Date().toISOString().split('T')[0],
        notes: `[${config.label}] ${notes}`,
        outcome: outcomeValue,
        next_action: nextAction || undefined,
        next_action_date: nextAction ? getNextWeekday() : undefined,
      })

      toast.success(`${config.label}記録を追加しました`)
      setShowDialog(false)
      resetForm()
    } catch {
      toast.error('記録の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setNotes('')
    setOutcome('normal')
    setNextAction('')
    setSelectedType('phone')
  }

  // 次の平日を取得
  const getNextWeekday = () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1)
    }
    return date.toISOString().split('T')[0]
  }

  return (
    <>
      <Collapsible defaultOpen={defaultOpen}>
        <Card className="border-0 shadow-lg">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  コミュニケーション
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{communicationEvents.length}件</Badge>
                  <ChevronDown className="w-5 h-5 text-gray-400 transition-transform [&[data-state=open]]:rotate-180" />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {/* クイックアクションボタン */}
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(communicationConfig) as CommunicationType[]).map((type) => {
              const config = communicationConfig[type]
              return (
                <button
                  key={type}
                  onClick={() => handleQuickAdd(type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg ${config.bgColor} hover:shadow-md transition-all`}
                >
                  <div className={config.color}>{config.icon}</div>
                  <span className="text-[10px] font-medium text-gray-700">{config.label}</span>
                </button>
              )
            })}
          </div>

          {/* コミュニケーション履歴 */}
          <div className="space-y-2">
            {displayEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                コミュニケーション履歴がありません
              </p>
            ) : (
              <>
                {displayEvents.map((event) => (
                  <CommunicationItem key={event.id} event={event} />
                ))}
                {communicationEvents.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        すべて表示（{communicationEvents.length}件）
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 記録追加ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {communicationConfig[selectedType].icon}
              {communicationConfig[selectedType].label}記録
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* コミュニケーション種別 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                種別
              </label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(communicationConfig) as CommunicationType[]).map((type) => {
                  const config = communicationConfig[type]
                  const isSelected = selectedType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                        isSelected
                          ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-gray-300`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 結果 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                結果
              </label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(outcomeConfig) as OutcomeType[]).map((o) => {
                  const config = outcomeConfig[o]
                  const isSelected = outcome === o
                  return (
                    <button
                      key={o}
                      onClick={() => setOutcome(o)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? `${config.color} ring-2 ring-offset-1`
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                内容
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="お話した内容やメモを入力..."
                rows={3}
              />
            </div>

            {/* 次のアクション */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                次のアクション（任意）
              </label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="例: 再度お電話、資料送付など"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !notes.trim()}
            >
              {isSubmitting ? '記録中...' : '記録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CommunicationItem({ event }: { event: CustomerJourneyEvent }) {
  const date = new Date(event.event_date)
  const formattedDate = date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })

  // イベントタイプからアイコンを取得
  const getIcon = () => {
    if (event.event_type === 'オンライン面談') return communicationConfig.video.icon
    if (event.event_type === '面談' || event.event_type === '初回面談') return communicationConfig.meeting.icon
    // ノートから種別を推測
    if (event.notes?.includes('[メール]')) return communicationConfig.email.icon
    if (event.notes?.includes('[LINE/SMS]')) return communicationConfig.message.icon
    return communicationConfig.phone.icon
  }

  // 結果からバッジ色を取得
  const getOutcomeStyle = () => {
    switch (event.outcome) {
      case '良好':
      case '契約意欲高い':
        return outcomeConfig.good.color
      case '要フォロー':
        return outcomeConfig.need_followup.color
      case '不通':
        return outcomeConfig.no_answer.color
      default:
        return outcomeConfig.normal.color
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="mt-0.5 text-gray-400">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{formattedDate}</span>
          {event.outcome && (
            <Badge className={`text-[10px] px-1.5 py-0 ${getOutcomeStyle()}`}>
              {event.outcome}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
          {event.notes?.replace(/^\[.*?\]\s*/, '') || 'メモなし'}
        </p>
        {event.next_action && (
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            次: {event.next_action}
          </div>
        )}
      </div>
    </div>
  )
}
