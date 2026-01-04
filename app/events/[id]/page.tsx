'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  Plus,
  MoreHorizontal,
  XCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  PhoneCall,
  Pencil,
} from 'lucide-react'
import { useEventStore } from '@/store/event-store'
import {
  BOOKING_STATUS_CONFIG,
  MEMBER_CONVERSION_CONFIG,
  EVENT_TYPE_CONFIG,
  type BookingStatus,
  type MemberConversionStatus,
} from '@/types/events'
import { toast } from 'sonner'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [mounted, setMounted] = useState(false)
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false)
  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: '1',
  })

  const {
    getEventById,
    getBookingsByEvent,
    addBooking,
    updateBookingStatus,
    updateMemberConversion,
    confirmBooking,
    deleteBooking,
  } = useEventStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const event = useMemo(() => {
    if (!mounted) return null
    return getEventById(eventId)
  }, [mounted, eventId, getEventById])

  const bookings = useMemo(() => {
    if (!mounted) return []
    return getBookingsByEvent(eventId)
  }, [mounted, eventId, getBookingsByEvent])

  // 予約サマリー
  const summary = useMemo(() => {
    const active = bookings.filter(b => b.status !== 'キャンセル')
    const confirmed = bookings.filter(b => b.status === '確認済' || b.status === '参加')
    const attended = bookings.filter(b => b.status === '参加')
    const converted = bookings.filter(b => b.member_conversion === '会員化')

    return {
      total: active.length,
      confirmed: confirmed.length,
      attended: attended.length,
      converted: converted.length,
      cancelled: bookings.filter(b => b.status === 'キャンセル').length,
    }
  }, [bookings])

  const handleAddBooking = () => {
    if (!newBooking.customer_name || !newBooking.customer_phone) {
      toast.error('お名前と電話番号は必須です')
      return
    }

    addBooking({
      event_id: eventId,
      customer_name: newBooking.customer_name,
      customer_phone: newBooking.customer_phone,
      customer_email: newBooking.customer_email,
      party_size: parseInt(newBooking.party_size),
    })

    toast.success('予約を追加しました')
    setShowAddBookingDialog(false)
    setNewBooking({ customer_name: '', customer_phone: '', customer_email: '', party_size: '1' })
  }

  const handleStatusChange = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status)
    toast.success(`ステータスを「${status}」に変更しました`)
  }

  const handleConfirm = (bookingId: string) => {
    confirmBooking(bookingId, '担当者')
    toast.success('再確認完了を記録しました')
  }

  const handleMemberConversion = (bookingId: string, conversion: MemberConversionStatus) => {
    updateMemberConversion(bookingId, conversion)
    toast.success(`会員化ステータスを「${conversion}」に変更しました`)
  }

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('この予約を削除しますか？')) {
      deleteBooking(bookingId)
      toast.success('予約を削除しました')
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

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">イベントが見つかりません</p>
          <Button variant="outline" onClick={() => router.push('/events')} className="mt-4">
            イベント一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const eventDate = new Date(event.date)
  const isPast = eventDate < new Date(new Date().toDateString())
  const config = EVENT_TYPE_CONFIG[event.event_type]

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'イベント管理', href: '/events' },
          { label: `${event.model_house_name} ${event.date}` },
        ]} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
                  {config.label}
                </Badge>
                {isPast && <Badge variant="secondary">終了</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{event.model_house_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {eventDate.getFullYear()}年{eventDate.getMonth() + 1}月{eventDate.getDate()}日 ({DAY_NAMES[eventDate.getDay()]})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.start_time}〜{event.end_time}
                </span>
                {event.instructor_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {event.instructor_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/events/${eventId}/edit`)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              編集
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowAddBookingDialog(true)}
              disabled={summary.total >= event.slots}
            >
              <Plus className="w-4 h-4 mr-2" />
              予約追加
            </Button>
          </div>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{summary.total}/{event.slots}</div>
              <div className="text-sm text-gray-500">予約数</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{summary.confirmed}</div>
              <div className="text-sm text-gray-500">確認済</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{summary.attended}</div>
              <div className="text-sm text-gray-500">参加</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{summary.converted}</div>
              <div className="text-sm text-gray-500">会員化</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-400">{summary.cancelled}</div>
              <div className="text-sm text-gray-500">キャンセル</div>
            </CardContent>
          </Card>
        </div>

        {/* 予約一覧 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">予約一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>予約がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status]
                  const memberConfig = MEMBER_CONVERSION_CONFIG[booking.member_conversion]

                  return (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-xl border ${
                        booking.status === 'キャンセル' ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{booking.customer_name}</span>
                              <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                                {statusConfig.label}
                              </Badge>
                              {booking.status === '参加' && (
                                <Badge variant="outline" className={`${memberConfig.bgColor} ${memberConfig.color} border-0`}>
                                  {memberConfig.label}
                                </Badge>
                              )}
                              {booking.party_size > 1 && (
                                <Badge variant="secondary">{booking.party_size}名</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-1 hover:text-blue-600">
                                <Phone className="w-4 h-4" />
                                {booking.customer_phone}
                              </a>
                              {booking.customer_email && (
                                <a href={`mailto:${booking.customer_email}`} className="flex items-center gap-1 hover:text-blue-600">
                                  <Mail className="w-4 h-4" />
                                  {booking.customer_email}
                                </a>
                              )}
                              {booking.confirmed_at && (
                                <span className="text-indigo-600">
                                  確認済: {new Date(booking.confirmed_at).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* クイックアクション */}
                          {booking.status === '予約済' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirm(booking.id)}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                              <PhoneCall className="w-4 h-4 mr-1" />
                              確認完了
                            </Button>
                          )}
                          {(booking.status === '予約済' || booking.status === '確認済') && isPast && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(booking.id, '参加')}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                参加
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(booking.id, '不参加')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                不参加
                              </Button>
                            </>
                          )}

                          {/* その他アクション */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status !== 'キャンセル' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'キャンセル')}>
                                  <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                                  キャンセルにする
                                </DropdownMenuItem>
                              )}
                              {booking.status === '参加' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleMemberConversion(booking.id, '会員化')}>
                                    <UserPlus className="w-4 h-4 mr-2 text-green-500" />
                                    会員化
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMemberConversion(booking.id, '見送り')}>
                                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                                    見送り
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="text-red-600"
                              >
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 予約追加ダイアログ */}
      <Dialog open={showAddBookingDialog} onOpenChange={setShowAddBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>お名前 *</Label>
              <Input
                value={newBooking.customer_name}
                onChange={(e) => setNewBooking(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="山田 太郎"
              />
            </div>
            <div className="space-y-2">
              <Label>電話番号 *</Label>
              <Input
                value={newBooking.customer_phone}
                onChange={(e) => setNewBooking(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="090-1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input
                type="email"
                value={newBooking.customer_email}
                onChange={(e) => setNewBooking(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>参加人数</Label>
              <Select
                value={newBooking.party_size}
                onValueChange={(v) => setNewBooking(prev => ({ ...prev, party_size: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}名</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBookingDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddBooking} className="bg-orange-500 hover:bg-orange-600">
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
