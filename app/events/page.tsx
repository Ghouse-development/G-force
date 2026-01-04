'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  XCircle,
  TrendingUp,
  Calendar,
  Plus,
} from 'lucide-react'
import { useEventStore } from '@/store/event-store'
import {
  MODEL_HOUSES,
  TIME_SLOTS,
  SLOT_CAPACITY,
} from '@/types/events'

export default function EventsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { bookings, getEventsByMonth } = useEventStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 今月のイベントを取得
  const monthEvents = useMemo(() => {
    if (!mounted) return []
    return getEventsByMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  }, [mounted, currentMonth, getEventsByMonth])

  // 土日の日付リストを生成
  const weekendDates = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dates: Date[] = []

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dates.push(date)
      }
    }
    return dates
  }, [currentMonth])

  // 統計データ計算
  const stats = useMemo(() => {
    if (!mounted) return { totalSlots: 0, booked: 0, attended: 0, cancelled: 0, occupancyRate: 0, cancelRate: 0, attendRate: 0 }

    const eventIds = new Set(monthEvents.map(e => e.id))
    const monthBookings = bookings.filter(b => eventIds.has(b.event_id))

    const totalSlots = monthEvents.length * SLOT_CAPACITY
    const booked = monthBookings.filter(b => b.status !== 'キャンセル').length
    const cancelled = monthBookings.filter(b => b.status === 'キャンセル').length
    const attended = monthBookings.filter(b => b.status === '参加').length
    const totalBookingsWithCancelled = monthBookings.length

    return {
      totalSlots,
      booked,
      attended,
      cancelled,
      occupancyRate: totalSlots > 0 ? Math.round((booked / totalSlots) * 100) : 0,
      cancelRate: totalBookingsWithCancelled > 0 ? Math.round((cancelled / totalBookingsWithCancelled) * 100) : 0,
      attendRate: booked > 0 ? Math.round((attended / booked) * 100) : 0,
    }
  }, [mounted, monthEvents, bookings])

  // イベントの予約状況を取得
  const getEventBookingInfo = (dateStr: string, modelHouseId: string, slotStart: string) => {
    const event = monthEvents.find(
      e => e.date === dateStr && e.model_house_id === modelHouseId && e.start_time === slotStart
    )
    if (!event) return null

    const eventBookings = bookings.filter(b => b.event_id === event.id)
    const activeBookings = eventBookings.filter(b => b.status !== 'キャンセル')
    const confirmedBookings = eventBookings.filter(b => b.status === '確認済' || b.status === '参加')

    return {
      event,
      booked: activeBookings.length,
      confirmed: confirmedBookings.length,
      capacity: event.slots,
      isFull: activeBookings.length >= event.slots,
    }
  }

  // 月を変更
  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + delta)
      return newDate
    })
  }

  // 日付フォーマット
  const formatDate = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return {
      day: date.getDate(),
      dayOfWeek: days[date.getDay()],
      isSunday: date.getDay() === 0,
    }
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
            <p className="text-gray-600 mt-1">土日 × 4会場 × 3部制（10:00〜 / 12:30〜 / 15:00〜）各4組</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => router.push('/events/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            イベント作成
          </Button>
        </div>

        {/* 月間統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">満席率</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.occupancyRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700">参加率</p>
                  <p className="text-2xl font-bold text-green-900">{stats.attendRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700">キャンセル率</p>
                  <p className="text-2xl font-bold text-red-900">{stats.cancelRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700">予約組数</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.booked}<span className="text-sm font-normal text-gray-500">/{stats.totalSlots}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 月選択 */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h2>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* イベント表 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b sticky left-0 bg-gray-100 z-10 min-w-[80px]">
                    日付
                  </th>
                  {MODEL_HOUSES.map(mh => (
                    <th
                      key={mh.id}
                      colSpan={TIME_SLOTS.length}
                      className="px-2 py-2 text-center font-semibold text-gray-700 border-b border-l"
                    >
                      {mh.name}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 border-b sticky left-0 bg-gray-50 z-10"></th>
                  {MODEL_HOUSES.map(mh => (
                    TIME_SLOTS.map(slot => (
                      <th
                        key={`${mh.id}-${slot.id}`}
                        className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-l min-w-[70px]"
                      >
                        {slot.label}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekendDates.map(date => {
                  const dateStr = date.toISOString().split('T')[0]
                  const { day, dayOfWeek, isSunday } = formatDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <tr
                      key={dateStr}
                      className={`hover:bg-gray-50 ${isToday ? 'bg-orange-50' : ''}`}
                    >
                      <td className={`px-3 py-3 font-medium border-b sticky left-0 z-10 ${isToday ? 'bg-orange-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-1">
                          <span className={`text-lg ${isSunday ? 'text-red-500' : 'text-blue-500'}`}>
                            {day}
                          </span>
                          <span className={`text-xs ${isSunday ? 'text-red-400' : 'text-blue-400'}`}>
                            ({dayOfWeek})
                          </span>
                          {isToday && (
                            <Badge className="ml-1 bg-orange-500 text-[10px] px-1 py-0">今日</Badge>
                          )}
                        </div>
                      </td>
                      {MODEL_HOUSES.map(mh => (
                        TIME_SLOTS.map(slot => {
                          const info = getEventBookingInfo(dateStr, mh.id, slot.start)

                          if (!info) {
                            return (
                              <td key={`${mh.id}-${slot.id}`} className="px-2 py-2 text-center border-b border-l bg-gray-100">
                                <span className="text-gray-400 text-xs">-</span>
                              </td>
                            )
                          }

                          const ratio = info.booked / info.capacity
                          let bgColor = 'bg-gray-50'
                          let textColor = 'text-gray-600'

                          if (info.isFull) {
                            bgColor = 'bg-red-100'
                            textColor = 'text-red-700'
                          } else if (ratio >= 0.75) {
                            bgColor = 'bg-orange-100'
                            textColor = 'text-orange-700'
                          } else if (ratio >= 0.5) {
                            bgColor = 'bg-yellow-100'
                            textColor = 'text-yellow-700'
                          } else if (ratio > 0) {
                            bgColor = 'bg-green-100'
                            textColor = 'text-green-700'
                          }

                          return (
                            <td
                              key={`${mh.id}-${slot.id}`}
                              className={`px-2 py-2 text-center border-b border-l cursor-pointer transition-all hover:shadow-inner ${bgColor}`}
                              onClick={() => router.push(`/events/${info.event.id}`)}
                            >
                              <div className={`font-bold ${textColor}`}>
                                {info.booked}/{info.capacity}
                              </div>
                              {info.confirmed > 0 && (
                                <div className="text-[10px] text-gray-500">
                                  確認済{info.confirmed}
                                </div>
                              )}
                            </td>
                          )
                        })
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">凡例:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-50 border"></div>
            <span>空き</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100"></div>
            <span>〜50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-100"></div>
            <span>50〜75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-100"></div>
            <span>75〜99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100"></div>
            <span>満席</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
