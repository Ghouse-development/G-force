'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileQuestion,
  User,
  Phone,
  Mail,
  Users,
  DollarSign,
  MapPin,
  FileText,
  RefreshCw,
  Building,
} from 'lucide-react'
import type { HearingSheetRecord } from '@/lib/kintone/kintone-client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface HearingSheetViewProps {
  record: HearingSheetRecord | null
  isLoading?: boolean
  onRefresh?: () => void
}

export function HearingSheetView({ record, isLoading, onRefresh }: HearingSheetViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  if (!record) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>ヒアリングシートがありません</p>
          <p className="text-sm mt-1">kintone連携設定を確認してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <FileQuestion className="w-5 h-5 mr-2 text-purple-500" />
            ヒアリングシート
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              No. {record.recordNumber}
            </Badge>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 顧客情報 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">お名前</p>
              <p className="font-medium">{record.customerName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">電話番号</p>
              <p className="font-medium">{record.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">メール</p>
              <p className="font-medium text-sm">{record.email}</p>
            </div>
          </div>
        </div>

        {/* 家族・現況 */}
        <div className="bg-purple-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-purple-800 flex items-center gap-2">
            <Users className="w-4 h-4" />
            ご家族・現在のお住まい
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">家族構成</p>
              <p className="font-medium">{record.familyStructure || '未記入'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">現在のお住まい</p>
              <p className="font-medium">{record.currentResidence || '未記入'}</p>
            </div>
          </div>
        </div>

        {/* 予算・希望 */}
        <div className="bg-green-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-green-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            ご予算・ご希望
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {record.budget && (
              <div>
                <p className="text-muted-foreground">ご予算</p>
                <p className="font-medium text-lg text-green-700">
                  {record.budget.toLocaleString()}万円
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">希望坪数</p>
              <p className="font-medium">{record.desiredArea || '未記入'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">希望エリア</p>
              <p className="font-medium">{record.desiredLocation || '未記入'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">建築時期</p>
              <p className="font-medium">{record.timeline || '未記入'}</p>
            </div>
          </div>
        </div>

        {/* 土地・建物条件 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              土地の条件
            </h4>
            <p className="text-sm whitespace-pre-wrap">
              {record.landRequirements || '特になし'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
              <Building className="w-4 h-4" />
              建物の条件
            </h4>
            <p className="text-sm whitespace-pre-wrap">
              {record.buildingRequirements || '特になし'}
            </p>
          </div>
        </div>

        {/* 備考 */}
        {record.notes && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">備考・その他ご要望</p>
                <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* メタデータ */}
        <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
          <span>作成: {format(new Date(record.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
          <span>更新: {format(new Date(record.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ダイアログ版
export function HearingSheetDialog({
  record,
  trigger
}: {
  record: HearingSheetRecord | null
  trigger: React.ReactNode
}) {
  if (!record) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-purple-500" />
            ヒアリングシート - {record.customerName}様
          </DialogTitle>
        </DialogHeader>
        <HearingSheetView record={record} />
      </DialogContent>
    </Dialog>
  )
}
