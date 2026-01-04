'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const { getEventById, updateEvent, deleteEvent } = useEventStore()
  const event = getEventById(eventId)

  const [formData, setFormData] = useState({
    date: '',
    model_house_id: '',
    start_time: '',
    end_time: '',
    slots: 4,
    instructor_id: '',
    event_type: 'MH見学会' as EventType,
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        date: event.date,
        model_house_id: event.model_house_id,
        start_time: event.start_time,
        end_time: event.end_time,
        slots: event.slots,
        instructor_id: event.instructor_id || '',
        event_type: event.event_type,
        notes: event.notes || '',
      })
    }
  }, [event])

  if (!event) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-gray-500">イベントが見つかりません</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/events')}
        >
          イベント一覧へ戻る
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.model_house_id) {
      toast.error('モデルハウスを選択してください')
      return
    }

    setIsSubmitting(true)

    try {
      const modelHouse = MODEL_HOUSES.find(mh => mh.id === formData.model_house_id)
      const instructor = formData.instructor_id
        ? INSTRUCTORS.find(i => i.id === formData.instructor_id)
        : null

      updateEvent(eventId, {
        date: formData.date,
        model_house_id: formData.model_house_id,
        model_house_name: modelHouse?.name || '',
        start_time: formData.start_time,
        end_time: formData.end_time,
        slots: formData.slots,
        instructor_id: formData.instructor_id || null,
        instructor_name: instructor?.name || null,
        event_type: formData.event_type,
        notes: formData.notes || null,
      })

      toast.success('イベントを更新しました')
      router.push(`/events/${eventId}`)
    } catch {
      toast.error('イベントの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    deleteEvent(eventId)
    toast.success('イベントを削除しました')
    router.push('/events')
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            イベント編集
          </h1>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>イベントを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                このイベントと関連する予約がすべて削除されます。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            {isSubmitting ? '更新中...' : '変更を保存'}
          </Button>
        </div>
      </form>
    </div>
  )
}
