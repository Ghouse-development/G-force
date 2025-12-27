'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  File,
  FileText,
  FileImage,
  FilePieChart,
  Eye,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFileStore, type StoredFile, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'

interface ContractAttachmentsProps {
  contractId: string
  editable?: boolean
}

// ファイルタイプに応じたアイコン
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage
  if (type === 'application/pdf') return FileText
  if (type.includes('spreadsheet') || type.includes('excel')) return FilePieChart
  return File
}

// ファイルサイズのフォーマット
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ContractAttachments({ contractId, editable = true }: ContractAttachmentsProps) {
  const [mounted, setMounted] = useState(false)
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null)
  const [deleteFile, setDeleteFile] = useState<StoredFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { files, addFile, deleteFile: removeFile } = useFileStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 契約IDに紐づくファイルを取得（customerId = contractId として使用）
  const contractFiles = mounted
    ? files.filter(f => f.customerId === contractId)
    : []

  // 許可されるファイルタイプ
  const ALLOWED_FILE_TYPES: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
  }

  // ファイルタイプを検証
  const isValidFileType = (file: File): boolean => {
    // MIMEタイプをチェック
    if (ALLOWED_FILE_TYPES[file.type]) {
      return true
    }

    // 拡張子でもチェック（MIMEタイプが不正確な場合の対策）
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    return Object.values(ALLOWED_FILE_TYPES).flat().includes(ext)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // ファイルタイプ検証
      if (!isValidFileType(file)) {
        toast.error(`${file.name} は許可されていないファイル形式です`)
        continue
      }

      // ファイルサイズ制限（5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} は5MBを超えています`)
        continue
      }

      // Base64に変換
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        addFile({
          customerId: contractId, // 契約IDをcustomerIdとして使用
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          category: file.type.startsWith('image/') ? 'image' : 'document',
          uploadedBy: user?.id || null,
        })
        toast.success(`${file.name} をアップロードしました`)
      }
      reader.onerror = () => {
        toast.error(`${file.name} の読み込みに失敗しました`)
      }
      reader.readAsDataURL(file)
    }

    // input をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = (file: StoredFile) => {
    const link = document.createElement('a')
    link.href = file.dataUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = () => {
    if (deleteFile) {
      removeFile(deleteFile.id)
      toast.success(`${deleteFile.name} を削除しました`)
      setDeleteFile(null)
    }
  }

  if (!mounted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Paperclip className="w-5 h-5 mr-2 text-orange-500" />
            添付ファイル
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center">
              <Paperclip className="w-5 h-5 mr-2 text-orange-500" />
              添付ファイル
              {contractFiles.length > 0 && (
                <Badge variant="outline" className="ml-2">{contractFiles.length}件</Badge>
              )}
            </span>
            {editable && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  ファイルを追加
                </Button>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractFiles.length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg',
                editable ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/50' : ''
              )}
              onClick={() => editable && fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {editable ? 'クリックまたはドラッグでファイルをアップロード' : '添付ファイルはありません'}
              </p>
              {editable && (
                <p className="text-xs text-gray-400 mt-1">
                  PDF, Word, Excel, 画像ファイル (最大5MB)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {contractFiles.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <FileIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      {file.type.startsWith('image/') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {editable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteFile(file)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* プレビューダイアログ */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              閉じる
            </Button>
            <Button onClick={() => previewFile && handleDownload(previewFile)}>
              <Download className="w-4 h-4 mr-2" />
              ダウンロード
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ファイルを削除</DialogTitle>
            <DialogDescription>
              「{deleteFile?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFile(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
