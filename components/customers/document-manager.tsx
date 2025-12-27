'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileText,
  Image as ImageIcon,
  Check,
  MapPin,
  CreditCard,
  User,
  FileSignature,
  Eye,
  Trash2,
  Car,
  Banknote,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFileStore, useAuthStore, type StoredFile, type DocumentCategory } from '@/store'
import { toast } from 'sonner'
import type { CustomerLandStatus } from '@/types/database'

// 書類定義（storeのDocumentCategoryと連携）
const DOCUMENT_TYPES: Record<DocumentCategory, { label: string; icon: typeof FileText; group: string }> = {
  land_registry: { label: '土地謄本', icon: FileText, group: 'land' },
  cadastral_map: { label: '公図', icon: MapPin, group: 'land' },
  land_survey: { label: '地積測量図', icon: FileText, group: 'land' },
  land_explanation: { label: '土地重説', icon: FileSignature, group: 'land_contract' },
  land_contract: { label: '土地契約書', icon: FileText, group: 'land_contract' },
  road_designation: { label: '位置指定道路', icon: Car, group: 'land_special' },
  drivers_license: { label: '運転免許証', icon: CreditCard, group: 'identity' },
  health_insurance: { label: '健康保険証', icon: User, group: 'identity' },
  loan_preapproval: { label: 'ローン事前審査', icon: Banknote, group: 'loan' },
  site_photos: { label: '建築地写真', icon: ImageIcon, group: 'site' },
  housing_map: { label: '住宅地図', icon: MapPin, group: 'site' },
  meeting_records: { label: '議事録', icon: FileText, group: 'other' },
  other: { label: 'その他', icon: FileText, group: 'other' },
}

// 土地状況に応じて表示する書類
const DOCS_BY_LAND_STATUS: Record<CustomerLandStatus, DocumentCategory[]> = {
  '土地あり': [
    'land_registry', 'cadastral_map', 'land_survey',
    'drivers_license', 'health_insurance',
    'loan_preapproval',
    'site_photos', 'housing_map',
  ],
  '土地探し中': [
    'drivers_license', 'health_insurance',
    'loan_preapproval',
  ],
  '土地契約済': [
    'land_registry', 'cadastral_map', 'land_survey',
    'land_explanation', 'land_contract',
    'drivers_license', 'health_insurance',
    'loan_preapproval',
    'site_photos', 'housing_map',
  ],
  '土地決済済': [
    'land_registry', 'cadastral_map', 'land_survey',
    'land_explanation', 'land_contract',
    'drivers_license', 'health_insurance',
    'loan_preapproval',
    'site_photos', 'housing_map',
  ],
}

interface DocumentManagerProps {
  customerId: string
  landStatus: CustomerLandStatus
}

export function DocumentManager({ customerId, landStatus }: DocumentManagerProps) {
  const { user } = useAuthStore()
  const { files, addFile, deleteFile } = useFileStore()
  const [uploadingTo, setUploadingTo] = useState<DocumentCategory | null>(null)
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null)

  // 顧客のファイルを取得
  const customerFiles = files.filter(f => f.customerId === customerId) as StoredFile[]

  // 書類タイプごとのファイル
  const getFilesForType = (typeId: DocumentCategory) => {
    return customerFiles.filter(f => f.documentCategory === typeId)
  }

  // 表示する書類リスト
  const visibleDocs = DOCS_BY_LAND_STATUS[landStatus] || DOCS_BY_LAND_STATUS['土地探し中']

  // グループ別にソート
  const groupOrder = ['identity', 'loan', 'land', 'land_contract', 'site', 'land_special']
  const sortedDocs = [...visibleDocs].sort((a, b) => {
    const aGroup = DOCUMENT_TYPES[a].group
    const bGroup = DOCUMENT_TYPES[b].group
    return groupOrder.indexOf(aGroup) - groupOrder.indexOf(bGroup)
  })

  const handleUpload = useCallback(async (files: File[], typeId: DocumentCategory) => {
    for (const file of files) {
      try {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        addFile({
          customerId,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          category: file.type.startsWith('image/') ? 'image' : 'document',
          uploadedBy: user?.id || null,
          documentCategory: typeId,
        } as Omit<StoredFile, 'id' | 'uploadedAt'>)

        toast.success(`${DOCUMENT_TYPES[typeId].label}をアップロードしました`)
      } catch {
        toast.error('アップロードに失敗しました')
      }
    }
    setUploadingTo(null)
  }, [customerId, addFile, user])

  const handleDelete = (file: StoredFile) => {
    deleteFile(file.id)
    toast.success('削除しました')
  }

  return (
    <div className="space-y-4">
      {/* 書類カード一覧 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedDocs.map(typeId => {
          const config = DOCUMENT_TYPES[typeId]
          const typeFiles = getFilesForType(typeId)
          const hasFile = typeFiles.length > 0
          const Icon = config.icon

          return (
            <DocumentCard
              key={typeId}
              label={config.label}
              icon={<Icon className="w-6 h-6" />}
              hasFile={hasFile}
              fileCount={typeFiles.length}
              onUpload={(files) => handleUpload(files, typeId)}
              onView={() => hasFile && setPreviewFile(typeFiles[0])}
              isUploading={uploadingTo === typeId}
            />
          )
        })}
      </div>

      {/* プレビューダイアログ */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{previewFile?.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    if (previewFile) {
                      handleDelete(previewFile)
                      setPreviewFile(null)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-auto max-h-[70vh]">
            {previewFile?.type.startsWith('image/') ? (
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                className="w-full h-auto object-contain"
              />
            ) : previewFile?.type === 'application/pdf' ? (
              <iframe
                src={previewFile.dataUrl}
                className="w-full h-[65vh]"
                title={previewFile.name}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>プレビューできません</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 個別の書類カード
interface DocumentCardProps {
  label: string
  icon: React.ReactNode
  hasFile: boolean
  fileCount: number
  onUpload: (files: File[]) => void
  onView: () => void
  isUploading: boolean
}

function DocumentCard({
  label,
  icon,
  hasFile,
  fileCount,
  onUpload,
  onView,
  isUploading,
}: DocumentCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.heic'],
    },
    disabled: isUploading,
  })

  return (
    <Card
      className={cn(
        'relative transition-all cursor-pointer overflow-hidden',
        hasFile
          ? 'border-green-300 bg-green-50 hover:border-green-400'
          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50',
        isDragActive && 'border-orange-500 bg-orange-100',
        isUploading && 'opacity-50'
      )}
    >
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          onClick={(e) => {
            if (hasFile) {
              e.stopPropagation()
              onView()
            }
          }}
          className="p-4 text-center"
        >
          <input {...getInputProps()} />

          {/* アイコンエリア */}
          <div className={cn(
            'w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2',
            hasFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          )}>
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : hasFile ? (
              <Check className="w-6 h-6" />
            ) : (
              icon
            )}
          </div>

          {/* ラベル */}
          <p className={cn(
            'text-sm font-medium',
            hasFile ? 'text-green-700' : 'text-gray-700'
          )}>
            {label}
          </p>

          {/* ステータス */}
          <p className={cn(
            'text-xs mt-1',
            hasFile ? 'text-green-600' : 'text-gray-400'
          )}>
            {hasFile ? (fileCount > 1 ? `${fileCount}件` : '登録済') : 'タップで登録'}
          </p>
        </div>

        {/* 登録済みの場合のアクション */}
        {hasFile && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
