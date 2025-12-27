'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Camera,
  Trash2,
  Download,
  Eye,
  FolderOpen,
  FileCheck,
  MapPin,
  Home,
  CreditCard,
  User,
  FileSignature,
  Building,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFileStore, type StoredFile } from '@/store'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'

// 書類カテゴリ定義
export const DOCUMENT_CATEGORIES = [
  { id: 'land_registry', label: '土地謄本', icon: FileText, color: 'text-blue-600' },
  { id: 'land_map', label: '公図', icon: MapPin, color: 'text-green-600' },
  { id: 'land_survey', label: '地積測量図', icon: FileCheck, color: 'text-purple-600' },
  { id: 'government_docs', label: '役所書類', icon: Building, color: 'text-gray-600' },
  { id: 'site_survey', label: '敷地調査図', icon: Home, color: 'text-orange-600' },
  { id: 'land_explanation', label: '土地重説', icon: FileSignature, color: 'text-indigo-600' },
  { id: 'land_contract', label: '土地契約書', icon: FileText, color: 'text-teal-600' },
  { id: 'drivers_license', label: '運転免許証', icon: CreditCard, color: 'text-cyan-600' },
  { id: 'health_insurance', label: '健康保険証', icon: User, color: 'text-pink-600' },
  { id: 'loan_docs', label: '住宅ローン書類', icon: FileText, color: 'text-amber-600' },
  { id: 'land_photos', label: '土地写真', icon: ImageIcon, color: 'text-emerald-600' },
  { id: 'meeting_records', label: '議事録', icon: FileText, color: 'text-red-600' },
  { id: 'other', label: 'その他', icon: FolderOpen, color: 'text-gray-500' },
] as const

export type DocumentCategoryId = typeof DOCUMENT_CATEGORIES[number]['id']

interface ExtendedStoredFile extends StoredFile {
  documentCategory?: DocumentCategoryId
}

interface DocumentUploadProps {
  customerId: string
  defaultCategory?: DocumentCategoryId
}

export function DocumentUpload({ customerId, defaultCategory = 'other' }: DocumentUploadProps) {
  const { user } = useAuthStore()
  const { files, addFile, deleteFile } = useFileStore()
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategoryId>(defaultCategory)
  const [previewFile, setPreviewFile] = useState<ExtendedStoredFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // 顧客のファイルを取得
  const customerFiles = files.filter(f => f.customerId === customerId) as ExtendedStoredFile[]

  // カテゴリ別にファイルを分類
  const filesByCategory = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = customerFiles.filter(f =>
      (f as ExtendedStoredFile).documentCategory === cat.id ||
      // 古いデータとの互換性
      (cat.id === 'meeting_records' && f.type === 'application/pdf' && !f.documentCategory) ||
      (cat.id === 'land_photos' && f.type.startsWith('image/') && !f.documentCategory)
    )
    return acc
  }, {} as Record<DocumentCategoryId, ExtendedStoredFile[]>)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)

    for (const file of acceptedFiles) {
      try {
        // ファイルをBase64に変換
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // ストアに保存
        addFile({
          customerId,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          category: file.type.startsWith('image/') ? 'image' : 'document',
          uploadedBy: user?.id || null,
          documentCategory: selectedCategory,
        } as Omit<ExtendedStoredFile, 'id' | 'uploadedAt'>)

        toast.success(`${file.name} をアップロードしました`)
      } catch (error) {
        toast.error(`${file.name} のアップロードに失敗しました`)
      }
    }

    setIsUploading(false)
  }, [customerId, selectedCategory, addFile, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
    },
  })

  const handleDelete = (fileId: string, fileName: string) => {
    if (window.confirm(`${fileName} を削除しますか？`)) {
      deleteFile(fileId)
      toast.success('ファイルを削除しました')
    }
  }

  const handleDownload = (file: ExtendedStoredFile) => {
    const link = document.createElement('a')
    link.href = file.dataUrl
    link.download = file.name
    link.click()
  }

  const getCategoryConfig = (catId: DocumentCategoryId) => {
    return DOCUMENT_CATEGORIES.find(c => c.id === catId)
  }

  return (
    <div className="space-y-6">
      {/* カテゴリ選択 */}
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_CATEGORIES.map(cat => {
          const Icon = cat.icon
          const count = filesByCategory[cat.id]?.length || 0
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 ${
                selectedCategory === cat.id ? 'bg-orange-500 hover:bg-orange-600' : ''
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{cat.label}</span>
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* アップロードエリア */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'bg-orange-50' : 'hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {/* スマホのカメラ直接起動用 */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              id={`camera-input-${customerId}`}
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  onDrop(Array.from(files))
                }
              }}
            />

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {isDragActive ? 'ここにドロップ' : 'ファイルをドラッグ&ドロップ'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  または クリックしてファイルを選択
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, 画像ファイル（JPG, PNG, HEIC）対応
                </p>
              </div>

              {/* スマホ用カメラボタン */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 md:hidden"
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById(`camera-input-${customerId}`)?.click()
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                カメラで撮影
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 選択中のカテゴリのファイル一覧 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {(() => {
              const config = getCategoryConfig(selectedCategory)
              if (!config) return null
              const Icon = config.icon
              return (
                <>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  {config.label}
                </>
              )
            })()}
            <Badge variant="secondary" className="ml-2">
              {filesByCategory[selectedCategory]?.length || 0}件
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filesByCategory[selectedCategory]?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ファイルがありません</p>
              <p className="text-sm mt-1">上のエリアからアップロードしてください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filesByCategory[selectedCategory]?.map(file => (
                <div
                  key={file.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  {/* プレビュー */}
                  <div
                    className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* ファイル情報 */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString('ja-JP')}</span>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        表示
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        保存
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(file.id, file.name)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* プレビューダイアログ */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{previewFile?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile?.type.startsWith('image/') ? (
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            ) : previewFile?.type === 'application/pdf' ? (
              <iframe
                src={previewFile.dataUrl}
                className="w-full h-[70vh]"
                title={previewFile.name}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>このファイル形式はプレビューできません</p>
                <Button
                  className="mt-4"
                  onClick={() => previewFile && handleDownload(previewFile)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  ダウンロード
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
