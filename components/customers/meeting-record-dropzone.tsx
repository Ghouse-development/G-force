'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  X,
  File,
  FileSpreadsheet,
  FileImage,
  FilePdf,
  Calendar,
  Clock,
  Download,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface MeetingRecord {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
  notes?: string
}

interface MeetingRecordDropzoneProps {
  customerId: string
  onUpload?: (files: File[]) => void
  existingRecords?: MeetingRecord[]
  onDelete?: (recordId: string) => void
}

// ファイルアイコンを取得
function getFileIcon(type: string) {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />
  }
  if (type.includes('pdf')) {
    return <FilePdf className="w-5 h-5 text-red-600" />
  }
  if (type.includes('image')) {
    return <FileImage className="w-5 h-5 text-blue-600" />
  }
  return <File className="w-5 h-5 text-gray-500" />
}

// ファイルサイズをフォーマット
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MeetingRecordDropzone({
  customerId,
  onUpload,
  existingRecords = [],
  onDelete,
}: MeetingRecordDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [records, setRecords] = useState<MeetingRecord[]>(existingRecords)
  const [uploading, setUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)

      if (droppedFiles.length === 0) return

      setUploading(true)

      try {
        // 新しいレコードを作成
        const newRecords: MeetingRecord[] = droppedFiles.map((file, index) => ({
          id: `record-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date(),
        }))

        setRecords((prev) => [...prev, ...newRecords])

        // コールバックを呼び出し
        if (onUpload) {
          onUpload(droppedFiles)
        }

        toast.success(`${droppedFiles.length}件の商談記録をアップロードしました`)
      } catch (error) {
        toast.error('アップロードに失敗しました')
      } finally {
        setUploading(false)
      }
    },
    [onUpload]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length === 0) return

      const newRecords: MeetingRecord[] = selectedFiles.map((file, index) => ({
        id: `record-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
      }))

      setRecords((prev) => [...prev, ...newRecords])

      if (onUpload) {
        onUpload(selectedFiles)
      }

      toast.success(`${selectedFiles.length}件の商談記録をアップロードしました`)
    },
    [onUpload]
  )

  const handleDeleteRecord = useCallback(
    (recordId: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== recordId))
      if (onDelete) {
        onDelete(recordId)
      }
      toast.success('商談記録を削除しました')
    },
    [onDelete]
  )

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          <FileText className="w-5 h-5 mr-2 text-orange-500" />
          商談記録
        </CardTitle>
        <Badge variant="outline">{records.length}件</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ドロップゾーン */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
            ${isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
          />
          <Upload
            className={`w-10 h-10 mx-auto mb-3 ${
              isDragging ? 'text-orange-500' : 'text-gray-400'
            }`}
          />
          <p className="text-sm font-medium text-gray-700">
            ファイルをドラッグ＆ドロップ
          </p>
          <p className="text-xs text-gray-500 mt-1">
            またはクリックして選択
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            PDF, Excel, Word, 画像 対応
          </p>
        </div>

        {/* アップロード済みファイル一覧 */}
        {records.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">
              アップロード済みファイル
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(record.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{formatFileSize(record.size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {record.uploadedAt.toLocaleDateString('ja-JP')}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {record.uploadedAt.toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        // TODO: ダウンロード処理
                        toast.info('ダウンロード機能は実装予定です')
                      }}
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-100"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            商談記録がありません
          </p>
        )}
      </CardContent>
    </Card>
  )
}
