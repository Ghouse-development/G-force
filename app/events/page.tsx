'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  ChevronLeft,
  ChevronRight,
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
    if (!mounted) return { totalSlots: 0, booked: 0, occupancyRate: 0, cancelRate: 0 }

    const eventIds = new Set(monthEvents.map(e => e.id))
    const monthBookings = bookings.filter(b => eventIds.has(b.event_id))

    const totalSlots = monthEvents.length * SLOT_CAPACITY
    const booked = monthBookings.filter(b => b.status !== 'キャンセル').length
    const cancelled = monthBookings.filter(b => b.status === 'キャンセル').length
    const total = monthBookings.length

    return {
      totalSlots,
      booked,
      occupancyRate: totalSlots > 0 ? Math.round((booked / totalSlots) * 100) : 0,
      cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
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

    return {
      event,
      booked: activeBookings.length,
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
      <div className="space-y-4">
        <Breadcrumb items={[{ label: 'イベント管理' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">イベント管理</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>予約率 <strong className="text-gray-900">{stats.occupancyRate}%</strong></span>
              <span>キャンセル率 <strong className="text-gray-900">{stats.cancelRate}%</strong></span>
              <span>予約 <strong className="text-gray-900">{stats.booked}</strong>/{stats.totalSlots}組</span>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => router.push('/events/new')}
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>

        {/* 月選択 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-bold min-w-[120px] text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* イベント表 */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th rowSpan={2} className="px-2 py-2 text-left font-medium text-gray-500 border-r w-16 sticky left-0 bg-gray-50 z-10">
                    日付
                  </th>
                  {MODEL_HOUSES.map((mh, idx) => (
                    <th
                      key={mh.id}
                      colSpan={3}
                      className={`px-1 py-1.5 text-center font-bold text-gray-700 ${idx < MODEL_HOUSES.length - 1 ? 'border-r' : ''}`}
                    >
                      {mh.name}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 border-b text-[10px]">
                  {MODEL_HOUSES.map((mh, mhIdx) => (
                    TIME_SLOTS.map((slot, slotIdx) => (
                      <th
                        key={`${mh.id}-${slot.id}`}
                        className={`px-1 py-1 text-center font-normal text-gray-400 ${slotIdx === 2 && mhIdx < MODEL_HOUSES.length - 1 ? 'border-r' : ''}`}
                      >
                        {slot.start.replace(':00', '')}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekendDates.map((date, rowIdx) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const day = date.getDate()
                  const isSunday = date.getDay() === 0
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <tr
                      key={dateStr}
                      className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${isToday ? '!bg-orange-50' : ''} hover:bg-blue-50/50`}
                    >
                      <td className={`px-2 py-1.5 font-medium border-r sticky left-0 z-10 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${isToday ? '!bg-orange-50' : ''}`}>
                        <span className={isSunday ? 'text-red-500' : 'text-blue-600'}>
                          {day}
                        </span>
                        <span className={`ml-0.5 text-[10px] ${isSunday ? 'text-red-400' : 'text-blue-400'}`}>
                          {isSunday ? '日' : '土'}
                        </span>
                      </td>
                      {MODEL_HOUSES.map((mh, mhIdx) => (
                        TIME_SLOTS.map((slot, slotIdx) => {
                          const info = getEventBookingInfo(dateStr, mh.id, slot.start)

                          if (!info) {
                            return (
                              <td
                                key={`${mh.id}-${slot.id}`}
                                className={`px-1 py-1.5 text-center text-gray-300 ${slotIdx === 2 && mhIdx < MODEL_HOUSES.length - 1 ? 'border-r' : ''}`}
                              >
                                -
                              </td>
                            )
                          }

                          const ratio = info.booked / info.capacity
                          let cellClass = 'text-gray-400'
                          let bgClass = ''

                          if (info.isFull) {
                            cellClass = 'text-red-600 font-bold'
                            bgClass = 'bg-red-100'
                          } else if (ratio >= 0.75) {
                            cellClass = 'text-orange-600 font-semibold'
                            bgClass = 'bg-orange-50'
                          } else if (ratio >= 0.5) {
                            cellClass = 'text-yellow-600'
                            bgClass = 'bg-yellow-50'
                          } else if (ratio > 0) {
                            cellClass = 'text-green-600'
                            bgClass = 'bg-green-50'
                          }

                          return (
                            <td
                              key={`${mh.id}-${slot.id}`}
                              className={`px-1 py-1.5 text-center cursor-pointer hover:!bg-blue-100 transition-colors ${bgClass} ${slotIdx === 2 && mhIdx < MODEL_HOUSES.length - 1 ? 'border-r' : ''}`}
                              onClick={() => router.push(`/events/${info.event.id}`)}
                            >
                              <span className={cellClass}>
                                {info.booked}
                              </span>
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
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>凡例:</span>
          <span className="text-gray-400">0 空き</span>
          <span className="text-green-600">1-2</span>
          <span className="text-yellow-600">3</span>
          <span className="text-orange-600 font-semibold">残1</span>
          <span className="text-red-600 font-bold">満席</span>
        </div>
      </div>
    </Layout>
  )
}
