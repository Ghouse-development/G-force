'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import {
  type JourneyEventType,
  type JourneyEventCategory,
  JOURNEY_EVENT_CONFIG,
} from '@/types/database'

interface JourneyEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  onSave: (event: {
    event_type: JourneyEventType
    event_date: string
    location?: string
    notes?: string
    outcome?: string
    next_action?: string
    next_action_date?: string
  }) => Promise<void>
}

// イベントをカテゴリ別にグループ化
const eventsByCategory: Record<JourneyEventCategory, JourneyEventType[]> = {
  '初期接触': ['資料請求', 'HP問合せ', 'TEL問合せ', 'Instagram問合せ'],
  'イベント': ['MH見学会予約', 'MH見学会参加', '構造見学会予約', '構造見学会参加', 'OB見学会予約', 'OB見学会参加', '完成見学会予約', '完成見学会参加'],
  '商談': ['初回面談', '面談', 'オンライン面談', '電話フォロー'],
  '土地': ['土地紹介', '土地案内', '土地決定'],
  '契約プロセス': ['限定会員登録', 'プラン提案', '見積提示', '資金計画提示', '建築申込', '内定', '契約'],
  '着工後': ['着工', '上棟', '引渡'],
  'その他': ['紹介受領', 'その他'],
}

const categories: JourneyEventCategory[] = [
  'イベント',
  '商談',
  '土地',
  '契約プロセス',
  '初期接触',
  '着工後',
  'その他',
]

export function JourneyEventDialog({
  open,
  onOpenChange,
  customerId,
  onSave,
}: JourneyEventDialogProps) {
  const [selectedType, setSelectedType] = useState<JourneyEventType | null>(null)
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState<string>('')
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedType) return

    setSaving(true)
    try {
      await onSave({
        event_type: selectedType,
        event_date: eventDate,
        location: location || undefined,
        notes: notes || undefined,
        outcome: outcome || undefined,
        next_action: nextAction || undefined,
        next_action_date: nextActionDate || undefined,
      })
      // リセット
      setSelectedType(null)
      setEventDate(new Date().toISOString().split('T')[0])
      setLocation('')
      setNotes('')
      setOutcome('')
      setNextAction('')
      setNextActionDate('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setSaving(false)
    }
  }

  const selectedConfig = selectedType ? JOURNEY_EVENT_CONFIG[selectedType] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            イベントを追加
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* イベント種別選択 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">イベントの種類</Label>
            <div className="space-y-4">
              {categories.map(category => (
                <div key={category}>
                  <p className="text-sm text-gray-500 mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {eventsByCategory[category].map(eventType => {
                      const config = JOURNEY_EVENT_CONFIG[eventType]
                      const isSelected = selectedType === eventType
                      return (
                        <Button
                          key={eventType}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-8 transition-all',
                            isSelected
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-0'
                              : `${config.bgColor} ${config.color} border-transparent hover:border-orange-300`
                          )}
                          onClick={() => setSelectedType(eventType)}
                        >
                          {config.label}
                          {config.isKeyMilestone && (
                            <Badge variant="outline" className="ml-1 text-[8px] h-3 px-1 border-current">
                              重要
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedType && (
            <>
              {/* 日付 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    日付 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                {/* 場所（イベント系の場合） */}
                {selectedConfig?.category === 'イベント' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      場所
                    </Label>
                    <Input
                      placeholder="例: 高槻MH"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* メモ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  メモ・詳細
                </Label>
                <Textarea
                  placeholder="お客様の反応や重要なポイントを記録..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* 結果・感触 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  結果・感触
                </Label>
                <div className="flex gap-2">
                  {['良好', '普通', '要フォロー'].map(o => (
                    <Button
                      key={o}
                      type="button"
                      variant={outcome === o ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        outcome === o && o === '良好' && 'bg-green-500 hover:bg-green-600',
                        outcome === o && o === '普通' && 'bg-gray-500 hover:bg-gray-600',
                        outcome === o && o === '要フォロー' && 'bg-red-500 hover:bg-red-600'
                      )}
                      onClick={() => setOutcome(outcome === o ? '' : o)}
                    >
                      {o}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 次のアクション */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-orange-500" />
                  次のアクション
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input
                      placeholder="例: 構造見学会への案内"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 保存ボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedType || saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {saving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
