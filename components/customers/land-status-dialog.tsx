'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Search,
  FileCheck,
  BadgeCheck,
  MapPin,
} from 'lucide-react'
import {
  type CustomerLandStatus,
  CUSTOMER_LAND_STATUS_CONFIG,
} from '@/types/database'

interface LandStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: CustomerLandStatus
  onSave: (status: CustomerLandStatus) => Promise<void>
}

const landStatuses: CustomerLandStatus[] = [
  '土地あり',
  '土地探し中',
  '土地契約済',
  '土地決済済',
]

const iconMap = {
  'CheckCircle': CheckCircle,
  'Search': Search,
  'FileCheck': FileCheck,
  'BadgeCheck': BadgeCheck,
}

export function LandStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onSave,
}: LandStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<CustomerLandStatus>(currentStatus)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selectedStatus)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save land status:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            土地状況を変更
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            お客様の土地状況を選択してください。土地なし/ありで営業アプローチが変わります。
          </p>

          <div className="grid grid-cols-2 gap-3">
            {landStatuses.map(status => {
              const config = CUSTOMER_LAND_STATUS_CONFIG[status]
              const Icon = iconMap[config.icon as keyof typeof iconMap] || CheckCircle
              const isSelected = selectedStatus === status

              return (
                <button
                  key={status}
                  type="button"
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedStatus(status)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bgColor)}>
                      <Icon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                      <p className={cn('font-medium', isSelected ? 'text-orange-700' : 'text-gray-900')}>
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {saving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
