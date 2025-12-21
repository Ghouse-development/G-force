'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  ArrowRight,
  Home,
  Bell,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface MatchNotification {
  id: string
  property_id: string
  customer_id: string
  alert_id: string
  match_score: number
  is_read: boolean
  created_at: string
  property?: {
    id: string
    title: string
    price: number
    address: string
    area: string
    land_area: number
    station_name: string
    station_walk: number
    source_url: string
  }
  customer?: {
    id: string
    name: string
    tei_name: string
  }
  match_details?: {
    matchedConditions: string[]
    unmatchedConditions: string[]
  }
}

interface PropertyMatchAlertsProps {
  maxItems?: number
}

export function PropertyMatchAlerts({ maxItems = 5 }: PropertyMatchAlertsProps) {
  const [notifications, setNotifications] = useState<MatchNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState({ total: 0, unread: 0 })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/property-notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setStats({
          total: data.total || 0,
          unread: data.unread || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-600'
  }

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}億円`
    }
    return `${price.toLocaleString()}万円`
  }

  const displayItems = expanded ? notifications : notifications.slice(0, maxItems)

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Home className="w-5 h-5 mr-2 text-orange-500" />
            土地マッチング通知
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <Home className="w-5 h-5 mr-2 text-orange-500" />
            土地マッチング通知
            {stats.unread > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {stats.unread}件の新着
              </Badge>
            )}
          </span>
          <Link href="/property-alerts">
            <Button variant="ghost" size="sm" className="text-orange-500">
              すべて見る
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>マッチング通知はありません</p>
            <p className="text-sm mt-1">顧客の物件アラートを設定すると、条件に合う土地が見つかった時に通知されます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-colors ${
                  notification.is_read ? 'bg-white' : 'bg-orange-50 border-orange-200'
                } hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 顧客名 */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        href={`/customers/${notification.customer_id}`}
                        className="text-sm font-medium text-orange-600 hover:underline"
                      >
                        {notification.customer?.tei_name || notification.customer?.name || '顧客'}
                      </Link>
                      <span className="text-gray-400">様向け</span>
                    </div>

                    {/* 物件情報 */}
                    <p className="font-semibold text-gray-900 truncate">
                      {notification.property?.title || '土地物件'}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {notification.property?.area || notification.property?.address || '---'}
                      </span>
                      {notification.property?.land_area && (
                        <span>{notification.property.land_area}㎡</span>
                      )}
                      {notification.property?.station_name && (
                        <span>
                          {notification.property.station_name}徒歩{notification.property.station_walk}分
                        </span>
                      )}
                    </div>

                    {/* マッチ条件 */}
                    {notification.match_details?.matchedConditions && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {notification.match_details.matchedConditions.slice(0, 3).map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {condition}
                          </Badge>
                        ))}
                        {notification.match_details.matchedConditions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{notification.match_details.matchedConditions.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    {/* マッチスコア */}
                    <Badge className={`${getScoreColor(notification.match_score)} text-sm font-bold px-3 py-1`}>
                      {notification.match_score}%
                    </Badge>

                    {/* 価格 */}
                    {notification.property?.price && (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(notification.property.price)}
                      </span>
                    )}

                    {/* SUUMOリンク */}
                    {notification.property?.source_url && (
                      <a
                        href={notification.property.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center"
                      >
                        詳細を見る
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* もっと見る / 閉じるボタン */}
            {notifications.length > maxItems && (
              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    さらに{notifications.length - maxItems}件表示
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
