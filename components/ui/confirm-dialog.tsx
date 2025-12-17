'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, XCircle } from 'lucide-react'

type DialogType = 'warning' | 'danger' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  type?: DialogType
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

const typeConfig: Record<DialogType, { icon: React.ReactNode; buttonClass: string }> = {
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  danger: {
    icon: <Trash2 className="w-6 h-6 text-red-500" />,
    buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  info: {
    icon: <XCircle className="w-6 h-6 text-blue-500" />,
    buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'warning',
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = typeConfig[type]

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className={config.buttonClass}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ステータス変更用の特殊ダイアログ
interface StatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromStatus: string
  toStatus: string
  onConfirm: () => void
  requireReason?: boolean
  reason?: string
  onReasonChange?: (reason: string) => void
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  fromStatus,
  toStatus,
  onConfirm,
  requireReason = false,
  reason = '',
  onReasonChange,
}: StatusChangeDialogProps) {
  const isLostStatus = toStatus === 'ボツ' || toStatus === '他決'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {isLostStatus ? (
              <XCircle className="w-6 h-6 text-red-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            )}
            <AlertDialogTitle>ステータス変更の確認</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            ステータスを「{fromStatus}」から「{toStatus}」に変更します。
            {isLostStatus && 'この操作は取り消せません。'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireReason && (
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700">
              理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-orange-500 focus:ring-orange-500"
              rows={3}
              placeholder={isLostStatus ? '失注理由を入力してください...' : '変更理由を入力してください...'}
              value={reason}
              onChange={(e) => onReasonChange?.(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isLostStatus ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}
            disabled={requireReason && !reason.trim()}
          >
            変更する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
