'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Bell,
  Phone,
  CheckCircle,
  X,
  MapPin,
  User,
  DollarSign,
  Ruler,
  Train,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { useLandStore, type LandAlert } from '@/store/land-store'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface LandAlertsDashboardProps {
  staffName?: string
}

export function LandAlertsDashboard({ staffName = '担当者' }: LandAlertsDashboardProps) {
  const { getAlerts, markAlertNotified, markAlertContacted, dismissAlert } = useLandStore()

  const [selectedAlert, setSelectedAlert] = useState<LandAlert | null>(null)
  const [contactNotes, setContactNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'notified' | 'contacted'>('all')

  const allAlerts = getAlerts()
  const filteredAlerts = filter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.status === filter)

  const newCount = allAlerts.filter(a => a.status === 'new').length
  const notifiedCount = allAlerts.filter(a => a.status === 'notified').length

  const handleContact = () => {
    if (selectedAlert) {
      markAlertContacted(selectedAlert.id, staffName, contactNotes)
      setSelectedAlert(null)
      setContactNotes('')
    }
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            土地マッチングアラート
          </h2>
          {newCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {newCount}件 要対応
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            すべて ({allAlerts.length})
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('new')}
          >
            新規 ({newCount})
          </Button>
          <Button
            variant={filter === 'notified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('notified')}
          >
            通知済 ({notifiedCount})
          </Button>
          <Button
            variant={filter === 'contacted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('contacted')}
          >
            連絡済
          </Button>
        </div>
      </div>

      {/* アラートリスト */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>表示するアラートがありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`${
                alert.status === 'new'
                  ? 'border-l-4 border-l-red-500 bg-red-50/50'
                  : alert.status === 'notified'
                  ? 'border-l-4 border-l-yellow-500'
                  : 'border-l-4 border-l-green-500 opacity-75'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* 左側：顧客情報 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{alert.customerName}様</span>
                      <Badge
                        variant={alert.matchResult.alertLevel === 'high' ? 'default' : 'outline'}
                        className={alert.matchResult.alertLevel === 'high' ? 'bg-green-500' : ''}
                      >
                        マッチ度 {alert.matchResult.matchScore}%
                      </Badge>
                      {alert.status === 'new' && (
                        <Badge variant="destructive" className="text-xs">
                          NEW
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{alert.property.name}</p>
                        <p>{alert.property.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{alert.property.price.toLocaleString()}万円</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <span>{alert.property.landArea}坪</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Train className="w-4 h-4 text-muted-foreground" />
                        <span>徒歩{alert.property.stationDistance}分</span>
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(alert.createdAt), 'M/d HH:mm', { locale: ja })}
                      </div>
                    </div>

                    {/* マッチング詳細 */}
                    <div className="mt-3 space-y-1">
                      {alert.matchResult.matchDetails.slice(0, 3).map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-14 text-muted-foreground">{detail.label}</span>
                          <Progress
                            value={(detail.score / detail.maxScore) * 100}
                            className="h-1.5 flex-1 max-w-32"
                          />
                          <span className="text-muted-foreground">{detail.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 右側：アクションボタン */}
                  <div className="flex flex-col gap-2">
                    {alert.status === 'new' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            markAlertNotified(alert.id)
                          }}
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          通知済みにする
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          連絡を記録
                        </Button>
                      </>
                    )}
                    {alert.status === 'notified' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        連絡を記録
                      </Button>
                    )}
                    {alert.status === 'contacted' && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          連絡済
                        </div>
                        <p className="text-xs mt-1">
                          {alert.contactedBy} ({format(new Date(alert.contactedAt!), 'M/d', { locale: ja })})
                        </p>
                        {alert.notes && (
                          <p className="text-xs mt-1 line-clamp-2">{alert.notes}</p>
                        )}
                      </div>
                    )}
                    {alert.status !== 'contacted' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        却下
                      </Button>
                    )}
                    {alert.property.sourceUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={alert.property.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          物件詳細
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 連絡記録ダイアログ */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>連絡を記録</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedAlert.customerName}様</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.property.name}</p>
                <p className="text-sm">
                  {selectedAlert.property.price.toLocaleString()}万円 / {selectedAlert.property.landArea}坪
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">連絡内容・メモ</label>
                <Textarea
                  placeholder="お客様の反応や次のアクションなど"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              キャンセル
            </Button>
            <Button onClick={handleContact} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              連絡済みとして記録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
