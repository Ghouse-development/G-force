'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserPlus,
  MapPin,
  Clock,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useEventStore } from '@/store/event-store'
import {
  EVENT_TYPE_CONFIG,
  MODEL_HOUSES,
  type EventType,
} from '@/types/events'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function EventsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterModelHouse, setFilterModelHouse] = useState<string>('all')
  const [filterEventType, setFilterEventType] = useState<string>('all')

  const {
    getEventsByMonth,
    getBookingsByEvent,
    getMonthSummary,
  } = useEventStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // 月のイベントを取得
  const monthEvents = useMemo(() => {
    if (!mounted) return []
    return getEventsByMonth(currentYear, currentMonth)
  }, [mounted, currentYear, currentMonth, getEventsByMonth])

  // フィルター適用
  const filteredEvents = useMemo(() => {
    return monthEvents.filter(event => {
      if (filterModelHouse !== 'all' && event.model_house_id !== filterModelHouse) return false
      if (filterEventType !== 'all' && event.event_type !== filterEventType) return false
      return true
    })
  }, [monthEvents, filterModelHouse, filterEventType])

  // 月間サマリー
  const monthSummary = useMemo(() => {
    if (!mounted) return { totalEvents: 0, totalBookings: 0, totalAttended: 0, totalConverted: 0, conversionRate: 0 }
    return getMonthSummary(currentYear, currentMonth)
  }, [mounted, currentYear, currentMonth, getMonthSummary])

  // カレンダーデータを生成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: { date: Date | null; events: typeof filteredEvents }[] = []

    // 前月の空白
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, events: [] })
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = filteredEvents.filter(e => e.date === dateStr)
      days.push({ date, events: dayEvents })
    }

    return days
  }, [currentYear, currentMonth, filteredEvents])

  // 日付ごとの予約サマリーを取得
  const getDateSummary = (events: typeof filteredEvents) => {
    let booked = 0
    let slots = 0
    events.forEach(event => {
      const bookings = getBookingsByEvent(event.id)
      booked += bookings.filter(b => b.status !== 'キャンセル').length
      slots += event.slots
    })
    return { booked, slots, events: events.length }
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'イベント管理' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">イベント管理</h1>
            <p className="text-gray-600 mt-1">見学会・セミナーの予約管理</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            イベント作成
          </Button>
        </div>

        {/* 月間サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">イベント数</p>
                  <p className="text-xl font-bold">{monthSummary.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">予約数</p>
                  <p className="text-xl font-bold">{monthSummary.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">参加者</p>
                  <p className="text-xl font-bold">{monthSummary.totalAttended}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">会員化</p>
                  <p className="text-xl font-bold">{monthSummary.totalConverted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">会員化率</p>
                  <p className="text-xl font-bold">{monthSummary.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター & 月選択 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* 月選択 */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-xl font-bold min-w-[140px] text-center">
                  {currentYear}年{currentMonth + 1}月
                </div>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
                  今月
                </Button>
              </div>

              {/* フィルター */}
              <div className="flex items-center gap-3">
                <Select value={filterModelHouse} onValueChange={setFilterModelHouse}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="会場" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての会場</SelectItem>
                    {MODEL_HOUSES.map(mh => (
                      <SelectItem key={mh.id} value={mh.id}>{mh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterEventType} onValueChange={setFilterEventType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="種別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての種別</SelectItem>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* カレンダーヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((day, index) => (
                <div
                  key={day}
                  className={`text-center py-2 text-sm font-medium ${
                    index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダー本体 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day.date) {
                  return <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50 rounded-lg" />
                }

                const isToday = day.date.toDateString() === new Date().toDateString()
                const dayOfWeek = day.date.getDay()
                const isSunday = dayOfWeek === 0
                const isSaturday = dayOfWeek === 6
                const summary = getDateSummary(day.events)
                const hasEvents = day.events.length > 0

                return (
                  <div
                    key={day.date.toISOString()}
                    onClick={() => {
                      if (hasEvents && day.date) {
                        router.push(`/events/day/${day.date.toISOString().split('T')[0]}`)
                      }
                    }}
                    className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                      hasEvents ? 'cursor-pointer hover:shadow-md hover:border-orange-300' : ''
                    } ${
                      isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'
                    }`}>
                      {day.date.getDate()}
                      {isToday && <span className="ml-1 text-xs text-orange-500">今日</span>}
                    </div>

                    {hasEvents && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          {summary.events}件
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className={summary.booked >= summary.slots * 0.8 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            {summary.booked}/{summary.slots}
                          </span>
                        </div>
                        {/* イベント種別バッジ（最大2つ） */}
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(day.events.map(e => e.event_type))].slice(0, 2).map(type => {
                            const config = EVENT_TYPE_CONFIG[type as EventType]
                            return (
                              <Badge
                                key={type}
                                variant="outline"
                                className={`text-[10px] px-1 py-0 ${config.bgColor} ${config.color} border-0`}
                              >
                                {config.label.substring(0, 3)}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 今日以降のイベント一覧 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">今後のイベント</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEvents
                .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 10)
                .map(event => {
                  const bookings = getBookingsByEvent(event.id)
                  const bookedCount = bookings.filter(b => b.status !== 'キャンセル').length
                  const config = EVENT_TYPE_CONFIG[event.event_type]
                  const eventDate = new Date(event.date)

                  return (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-gray-900">
                            {eventDate.getDate()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {eventDate.getMonth() + 1}月 ({DAY_NAMES[eventDate.getDay()]})
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
                              {config.label}
                            </Badge>
                            <span className="font-medium text-gray-900">{event.model_house_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.start_time}〜{event.end_time}
                            </span>
                            {event.instructor_name && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.instructor_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          bookedCount >= event.slots ? 'text-red-600' :
                          bookedCount >= event.slots * 0.8 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {bookedCount}/{event.slots}
                        </div>
                        <div className="text-xs text-gray-500">予約</div>
                      </div>
                    </div>
                  )
                })}
              {filteredEvents.filter(e => new Date(e.date) >= new Date(new Date().toDateString())).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  今後のイベントはありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
