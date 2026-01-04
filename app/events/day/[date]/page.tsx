'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, User, Users, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEventStore } from '@/store/event-store'
import { EVENT_TYPE_CONFIG } from '@/types/events'

export default function EventDayPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string

  const { events, getBookingsByEvent } = useEventStore()

  // この日のイベントを取得
  const dayEvents = events.filter(e => e.date === dateStr)

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const dayOfWeek = days[date.getDay()]
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayOfWeek}）`
  }

  const getBookingSummary = (eventId: string) => {
    const bookings = getBookingsByEvent(eventId)
    const active = bookings.filter(b => b.status !== 'キャンセル')
    const confirmed = bookings.filter(b => b.status === '確認済' || b.status === '参加')
    return { total: active.length, confirmed: confirmed.length }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/events')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formatDate(dateStr)}
            </h1>
            <p className="text-sm text-gray-500">
              {dayEvents.length}件のイベント
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/events/new?date=${dateStr}`)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          イベント追加
        </Button>
      </div>

      {/* イベント一覧 */}
      {dayEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">この日のイベントはありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/events/new?date=${dateStr}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              イベントを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dayEvents
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map(event => {
              const typeConfig = EVENT_TYPE_CONFIG[event.event_type]
              const summary = getBookingSummary(event.id)

              return (
                <Card
                  key={event.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {event.start_time}
                        </div>
                        <div className="text-gray-400">〜</div>
                        <div className="text-lg text-gray-600">
                          {event.end_time}
                        </div>
                      </div>
                      <Badge className={`${typeConfig.bgColor} ${typeConfig.color}`}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{event.model_house_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{event.instructor_name || '未設定'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          予約 <span className="font-medium">{summary.total}</span>/{event.slots}枠
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          確認済 <span className="font-medium">{summary.confirmed}</span>件
                        </span>
                      </div>
                    </div>
                    {event.notes && (
                      <p className="mt-3 text-sm text-gray-500 border-t pt-3">
                        {event.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
