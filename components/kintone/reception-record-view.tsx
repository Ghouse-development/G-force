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
  ClipboardList,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Megaphone,
  FileText,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import type { ReceptionRecord } from '@/lib/kintone/kintone-client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ReceptionRecordViewProps {
  record: ReceptionRecord | null
  isLoading?: boolean
  onRefresh?: () => void
}

export function ReceptionRecordView({ record, isLoading, onRefresh }: ReceptionRecordViewProps) {
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
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>初回受付台帳がありません</p>
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
            <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
            初回受付台帳
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
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium flex items-center gap-2 text-blue-800">
            <User className="w-4 h-4" />
            顧客情報
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">お名前</p>
              <p className="font-medium">{record.customerName}</p>
              {record.customerNameKana && (
                <p className="text-xs text-muted-foreground">{record.customerNameKana}</p>
              )}
            </div>
            {record.partnerName && (
              <div>
                <p className="text-muted-foreground">配偶者名</p>
                <p className="font-medium">{record.partnerName}</p>
                {record.partnerNameKana && (
                  <p className="text-xs text-muted-foreground">{record.partnerNameKana}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 連絡先 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">電話番号</p>
              <p className="font-medium">{record.phone}</p>
              {record.phone2 && (
                <p className="text-sm text-muted-foreground">{record.phone2}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">メール</p>
              <p className="font-medium text-sm break-all">{record.email}</p>
            </div>
          </div>
        </div>

        {/* 住所 */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">住所</p>
            <p className="font-medium">
              〒{record.postalCode} {record.address}
            </p>
          </div>
        </div>

        {/* 反響情報 */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-start gap-2">
            <Megaphone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">反響経路</p>
              <p className="font-medium">{record.leadSource || '未設定'}</p>
            </div>
          </div>
          {record.eventDate && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">イベント日</p>
                <p className="font-medium">
                  {format(new Date(record.eventDate), 'yyyy/MM/dd', { locale: ja })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 備考 */}
        {record.notes && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">備考</p>
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
export function ReceptionRecordDialog({
  record,
  trigger
}: {
  record: ReceptionRecord | null
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
            <ClipboardList className="w-5 h-5 text-blue-500" />
            初回受付台帳 - {record.customerName}様
          </DialogTitle>
        </DialogHeader>
        <ReceptionRecordView record={record} />
      </DialogContent>
    </Dialog>
  )
}
