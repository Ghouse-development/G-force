'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useEventStore } from '@/store/event-store'
import { MODEL_HOUSES, INSTRUCTORS, type EventType } from '@/types/events'
import { toast } from 'sonner'

const EVENT_TYPES: EventType[] = [
  'MH見学会',
  '構造見学会',
  '完成見学会',
  'セミナー',
  '相談会',
  'その他',
]

function NewEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const { addEvent } = useEventStore()

  const [formData, setFormData] = useState({
    date: initialDate,
    model_house_id: '',
    start_time: '10:00',
    end_time: '12:00',
    slots: 4,
    instructor_id: '',
    event_type: 'MH見学会' as EventType,
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.model_house_id) {
      toast.error('モデルハウスを選択してください')
      return
    }

    setIsSubmitting(true)

    try {
      const newEvent = addEvent({
        date: formData.date,
        model_house_id: formData.model_house_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        slots: formData.slots,
        instructor_id: formData.instructor_id || undefined,
        event_type: formData.event_type,
        notes: formData.notes || undefined,
      })

      toast.success('イベントを作成しました')
      router.push(`/events/${newEvent.id}`)
    } catch {
      toast.error('イベントの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          イベント作成
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>イベント情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 日付 */}
            <div className="space-y-2">
              <Label htmlFor="date">開催日 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* モデルハウス */}
            <div className="space-y-2">
              <Label>モデルハウス *</Label>
              <Select
                value={formData.model_house_id}
                onValueChange={(value) => setFormData({ ...formData, model_house_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_HOUSES.map((mh) => (
                    <SelectItem key={mh.id} value={mh.id}>
                      {mh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 時間 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">開始時間 *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">終了時間 *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* イベント種別 */}
            <div className="space-y-2">
              <Label>イベント種別 *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value as EventType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 枠数 */}
            <div className="space-y-2">
              <Label htmlFor="slots">予約枠数 *</Label>
              <Input
                id="slots"
                type="number"
                min={1}
                max={20}
                value={formData.slots}
                onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            {/* 講師 */}
            <div className="space-y-2">
              <Label>担当講師</Label>
              <Select
                value={formData.instructor_id}
                onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未設定</SelectItem>
                  {INSTRUCTORS.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 備考 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="イベントに関するメモ"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? '作成中...' : 'イベントを作成'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    }>
      <NewEventForm />
    </Suspense>
  )
}
