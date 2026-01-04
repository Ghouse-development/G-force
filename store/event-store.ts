import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Event,
  type EventBooking,
  type EventSummary,
  type CreateEventInput,
  type CreateBookingInput,
  type BookingStatus,
  type MemberConversionStatus,
  MODEL_HOUSES,
  INSTRUCTORS,
  TIME_SLOTS,
  SLOT_CAPACITY,
} from '@/types/events'

// モックイベントデータ生成
const generateMockEvents = (): Event[] => {
  const events: Event[] = []
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // 今月と来月のイベントを生成
  for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
    const month = currentMonth + monthOffset
    const year = month > 11 ? currentYear + 1 : currentYear
    const adjustedMonth = month > 11 ? month - 12 : month

    // 毎週土日にイベントを設定
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, adjustedMonth, day)
      // 月が変わった場合はスキップ
      if (date.getMonth() !== adjustedMonth) continue

      const dayOfWeek = date.getDay()

      // 土日のみ
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const dateStr = date.toISOString().split('T')[0]

        // 各モデルハウスにイベントを設定
        MODEL_HOUSES.forEach((mh, mhIndex) => {
          // 3部制（10:00〜, 12:30〜, 15:00〜）
          TIME_SLOTS.forEach((slot, slotIndex) => {
            const instructor = INSTRUCTORS[(mhIndex + slotIndex) % INSTRUCTORS.length]
            events.push({
              id: `evt-${dateStr}-${mh.id}-${slotIndex}`,
              date: dateStr,
              model_house_id: mh.id,
              model_house_name: mh.name,
              start_time: slot.start,
              end_time: slot.end,
              slots: SLOT_CAPACITY,
              instructor_id: instructor.id,
              instructor_name: instructor.name,
              event_type: 'MH見学会',
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          })
        })
      }
    }
  }

  return events
}

// モック予約データ生成
const generateMockBookings = (events: Event[]): EventBooking[] => {
  const bookings: EventBooking[] = []
  const mockCustomers = [
    { name: '田中 太郎', phone: '090-1234-5678', email: 'tanaka@example.com' },
    { name: '鈴木 花子', phone: '080-2345-6789', email: 'suzuki@example.com' },
    { name: '佐藤 一郎', phone: '070-3456-7890', email: 'sato@example.com' },
    { name: '高橋 美咲', phone: '090-4567-8901', email: 'takahashi@example.com' },
    { name: '伊藤 健太', phone: '080-5678-9012', email: 'ito@example.com' },
  ]

  // 過去のイベントには予約を入れる
  const today = new Date()
  events.forEach((event, eventIndex) => {
    const eventDate = new Date(event.date)
    const isPast = eventDate < today

    // ランダムに予約を追加（50%の確率）
    if (Math.random() > 0.3) {
      const numBookings = Math.floor(Math.random() * Math.min(event.slots, 3)) + 1

      for (let i = 0; i < numBookings; i++) {
        const customer = mockCustomers[(eventIndex + i) % mockCustomers.length]
        let status: BookingStatus = '予約済'
        let memberConversion: MemberConversionStatus = '未確認'

        if (isPast) {
          // 過去のイベントはステータスを進める
          const statusRandom = Math.random()
          if (statusRandom < 0.1) {
            status = 'キャンセル'
          } else if (statusRandom < 0.2) {
            status = '不参加'
          } else {
            status = '参加'
            // 参加者の会員化ステータス
            memberConversion = Math.random() > 0.6 ? '会員化' : Math.random() > 0.5 ? '見送り' : '未確認'
          }
        } else {
          // 未来のイベントは予約済or確認済
          status = Math.random() > 0.5 ? '確認済' : '予約済'
        }

        bookings.push({
          id: `bkg-${event.id}-${i}`,
          event_id: event.id,
          customer_id: null,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          party_size: Math.floor(Math.random() * 3) + 1,
          status,
          confirmed_at: status !== '予約済' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          confirmed_by: status !== '予約済' ? INSTRUCTORS[0].name : null,
          attended_at: status === '参加' ? event.date + 'T' + event.start_time + ':00Z' : null,
          member_conversion: memberConversion,
          converted_customer_id: memberConversion === '会員化' ? `cust-${eventIndex}-${i}` : null,
          notes: null,
          created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }
  })

  return bookings
}

interface EventState {
  events: Event[]
  bookings: EventBooking[]

  // イベント操作
  addEvent: (input: CreateEventInput) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  getEventsByMonth: (year: number, month: number) => Event[]
  getEventsByDate: (date: string) => Event[]
  getEventById: (id: string) => Event | undefined

  // 予約操作
  addBooking: (input: CreateBookingInput) => EventBooking
  updateBooking: (id: string, updates: Partial<EventBooking>) => void
  deleteBooking: (id: string) => void
  getBookingsByEvent: (eventId: string) => EventBooking[]
  updateBookingStatus: (id: string, status: BookingStatus) => void
  updateMemberConversion: (id: string, conversion: MemberConversionStatus, customerId?: string) => void
  confirmBooking: (id: string, confirmedBy: string) => void

  // サマリー
  getEventSummary: (eventId: string) => EventSummary | undefined
  getMonthSummary: (year: number, month: number) => {
    totalEvents: number
    totalBookings: number
    totalAttended: number
    totalConverted: number
    conversionRate: number
  }
}

const initialEvents = generateMockEvents()
const initialBookings = generateMockBookings(initialEvents)

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: initialEvents,
      bookings: initialBookings,

      // イベント操作
      addEvent: (input) => {
        const modelHouse = MODEL_HOUSES.find(mh => mh.id === input.model_house_id)
        const instructor = input.instructor_id ? INSTRUCTORS.find(i => i.id === input.instructor_id) : null

        const newEvent: Event = {
          id: `evt-${Date.now()}`,
          date: input.date,
          model_house_id: input.model_house_id,
          model_house_name: modelHouse?.name || '',
          start_time: input.start_time,
          end_time: input.end_time,
          slots: input.slots,
          instructor_id: input.instructor_id || null,
          instructor_name: instructor?.name || null,
          event_type: input.event_type,
          notes: input.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set(state => ({ events: [...state.events, newEvent] }))
        return newEvent
      },

      updateEvent: (id, updates) => {
        set(state => ({
          events: state.events.map(e =>
            e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
          ),
        }))
      },

      deleteEvent: (id) => {
        set(state => ({
          events: state.events.filter(e => e.id !== id),
          bookings: state.bookings.filter(b => b.event_id !== id),
        }))
      },

      getEventsByMonth: (year, month) => {
        const { events } = get()
        return events.filter(e => {
          const eventDate = new Date(e.date)
          return eventDate.getFullYear() === year && eventDate.getMonth() === month
        })
      },

      getEventsByDate: (date) => {
        const { events } = get()
        return events.filter(e => e.date === date)
      },

      getEventById: (id) => {
        return get().events.find(e => e.id === id)
      },

      // 予約操作
      addBooking: (input) => {
        const newBooking: EventBooking = {
          id: `bkg-${Date.now()}`,
          event_id: input.event_id,
          customer_id: input.customer_id || null,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          customer_email: input.customer_email || null,
          party_size: input.party_size,
          status: '予約済',
          confirmed_at: null,
          confirmed_by: null,
          attended_at: null,
          member_conversion: '未確認',
          converted_customer_id: null,
          notes: input.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set(state => ({ bookings: [...state.bookings, newBooking] }))
        return newBooking
      },

      updateBooking: (id, updates) => {
        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
        }))
      },

      deleteBooking: (id) => {
        set(state => ({
          bookings: state.bookings.filter(b => b.id !== id),
        }))
      },

      getBookingsByEvent: (eventId) => {
        return get().bookings.filter(b => b.event_id === eventId)
      },

      updateBookingStatus: (id, status) => {
        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === id
              ? {
                  ...b,
                  status,
                  attended_at: status === '参加' ? new Date().toISOString() : b.attended_at,
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      updateMemberConversion: (id, conversion, customerId) => {
        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === id
              ? {
                  ...b,
                  member_conversion: conversion,
                  converted_customer_id: customerId || null,
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      confirmBooking: (id, confirmedBy) => {
        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === id
              ? {
                  ...b,
                  status: '確認済' as BookingStatus,
                  confirmed_at: new Date().toISOString(),
                  confirmed_by: confirmedBy,
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      // サマリー
      getEventSummary: (eventId) => {
        const { events, bookings } = get()
        const event = events.find(e => e.id === eventId)
        if (!event) return undefined

        const eventBookings = bookings.filter(b => b.event_id === eventId)

        return {
          id: event.id,
          date: event.date,
          model_house_name: event.model_house_name,
          start_time: event.start_time,
          end_time: event.end_time,
          event_type: event.event_type,
          slots: event.slots,
          booked_count: eventBookings.filter(b => b.status !== 'キャンセル').length,
          confirmed_count: eventBookings.filter(b => b.status === '確認済' || b.status === '参加').length,
          attended_count: eventBookings.filter(b => b.status === '参加').length,
          cancelled_count: eventBookings.filter(b => b.status === 'キャンセル').length,
          instructor_name: event.instructor_name,
        }
      },

      getMonthSummary: (year, month) => {
        const { events, bookings } = get()
        const monthEvents = events.filter(e => {
          const eventDate = new Date(e.date)
          return eventDate.getFullYear() === year && eventDate.getMonth() === month
        })

        const monthEventIds = new Set(monthEvents.map(e => e.id))
        const monthBookings = bookings.filter(b => monthEventIds.has(b.event_id))

        const totalAttended = monthBookings.filter(b => b.status === '参加').length
        const totalConverted = monthBookings.filter(b => b.member_conversion === '会員化').length

        return {
          totalEvents: monthEvents.length,
          totalBookings: monthBookings.filter(b => b.status !== 'キャンセル').length,
          totalAttended,
          totalConverted,
          conversionRate: totalAttended > 0 ? (totalConverted / totalAttended) * 100 : 0,
        }
      },
    }),
    {
      name: 'g-force-events',
      version: 1,
    }
  )
)
