'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Calendar,
  Clock,
  Download,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Save,
  X,
  Volume2,
  Music,
  Edit,
  Sparkles,
  MapPin,
  Coins,
  Ruler,
  Train,
  Sun,
  Bell,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFileStore, useAuthStore, type FileCategory, type StoredFile } from '@/store'
import { analyzeCustomerRecords, type AnalysisResult, type ExtractedLandConditions } from '@/lib/ai-analysis'

interface MeetingRecordDropzoneProps {
  customerId: string
  customerName?: string
}

// ファイルアイコンを取得
function getFileIcon(type: string, category: FileCategory) {
  if (category === 'audio') {
    return <Music className="w-5 h-5 text-purple-600" />
  }
  if (category === 'memo') {
    return <MessageSquare className="w-5 h-5 text-orange-600" />
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />
  }
  if (type.includes('pdf')) {
    return <FileText className="w-5 h-5 text-red-600" />
  }
  if (type.includes('image')) {
    return <FileImage className="w-5 h-5 text-blue-600" />
  }
  return <File className="w-5 h-5 text-gray-500" />
}

// ファイルカテゴリを判定
function getFileCategory(type: string): FileCategory {
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('image/')) return 'image'
  return 'document'
}

// ファイルサイズをフォーマット
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ファイルをBase64に変換
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 音声プレーヤーコンポーネント
function AudioPlayer({ dataUrl, name: _name }: { dataUrl: string; name: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
      <audio
        ref={audioRef}
        src={dataUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-purple-100"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-purple-600" />
        ) : (
          <Play className="w-4 h-4 text-purple-600" />
        )}
      </Button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>
      <span className="text-[10px] text-purple-600 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}

// メモエディタコンポーネント
function MemoEditor({
  memo,
  onSave,
  onCancel,
}: {
  memo?: StoredFile
  onSave: (content: string) => void
  onCancel: () => void
}) {
  const [content, setContent] = useState(memo?.memoContent || '')

  return (
    <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="商談内容をメモしてください..."
        className="min-h-[120px] resize-none bg-white"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          キャンセル
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-yellow-500"
          onClick={() => onSave(content)}
          disabled={!content.trim()}
        >
          <Save className="w-4 h-4 mr-1" />
          保存
        </Button>
      </div>
    </div>
  )
}

// メモ表示コンポーネント
function MemoDisplay({
  memo,
  onEdit,
  onDelete,
}: {
  memo: StoredFile
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">{memo.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onEdit}
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-red-100"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {memo.memoContent}
      </p>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-0.5">
          <Calendar className="w-2.5 h-2.5" />
          {new Date(memo.uploadedAt).toLocaleDateString('ja-JP')}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {new Date(memo.uploadedAt).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}

export function MeetingRecordDropzone({ customerId, customerName = '顧客' }: MeetingRecordDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showMemoEditor, setShowMemoEditor] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isRegisteringAlert, setIsRegisteringAlert] = useState(false)
  const [alertRegistered, setAlertRegistered] = useState(false)

  const { addFile, addMemo, updateMemo, deleteFile, getFilesByCustomer } = useFileStore()
  const { user } = useAuthStore()

  // 顧客に紐づくファイルを取得
  const customerFiles = getFilesByCustomer(customerId)
  const audioFiles = customerFiles.filter((f) => f.category === 'audio')
  const documentFiles = customerFiles.filter((f) => f.category === 'document' || f.category === 'image')
  const memoFiles = customerFiles.filter((f) => f.category === 'memo')

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
        for (const file of droppedFiles) {
          const dataUrl = await fileToDataUrl(file)
          const category = getFileCategory(file.type)
          addFile({
            customerId,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            category,
            uploadedBy: user?.id || null,
          })
        }

        toast.success(`${droppedFiles.length}件の商談記録をアップロードしました`)
      } catch {
        toast.error('アップロードに失敗しました')
      } finally {
        setUploading(false)
      }
    },
    [customerId, addFile, user]
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length === 0) return

      setUploading(true)

      try {
        for (const file of selectedFiles) {
          const dataUrl = await fileToDataUrl(file)
          const category = getFileCategory(file.type)
          addFile({
            customerId,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            category,
            uploadedBy: user?.id || null,
          })
        }

        toast.success(`${selectedFiles.length}件の商談記録をアップロードしました`)
      } catch {
        toast.error('アップロードに失敗しました')
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    },
    [customerId, addFile, user]
  )

  const handleDeleteRecord = useCallback(
    (fileId: string) => {
      deleteFile(fileId)
      toast.success('商談記録を削除しました')
    },
    [deleteFile]
  )

  const handleDownload = useCallback((file: { name: string; dataUrl: string }) => {
    const link = document.createElement('a')
    link.href = file.dataUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('ダウンロードを開始しました')
  }, [])

  const handleSaveMemo = useCallback(
    (content: string) => {
      if (editingMemoId) {
        updateMemo(editingMemoId, content)
        toast.success('メモを更新しました')
        setEditingMemoId(null)
      } else {
        addMemo(customerId, content, user?.id || null)
        toast.success('メモを保存しました')
        setShowMemoEditor(false)
      }
    },
    [customerId, editingMemoId, addMemo, updateMemo, user]
  )

  const handleCancelMemo = useCallback(() => {
    setShowMemoEditor(false)
    setEditingMemoId(null)
  }, [])

  const getDisplayFiles = () => {
    switch (activeTab) {
      case 'audio':
        return audioFiles
      case 'documents':
        return documentFiles
      case 'memos':
        return memoFiles
      default:
        return customerFiles
    }
  }

  const handleAIAnalysis = useCallback(async () => {
    if (customerFiles.length === 0) {
      toast.error('分析する記録がありません')
      return
    }

    setIsAnalyzing(true)
    setAlertRegistered(false)
    try {
      const result = await analyzeCustomerRecords(customerFiles, customerName)
      setAnalysisResult(result)
      setShowAnalysis(true)
      toast.success('AI分析が完了しました')
    } catch {
      toast.error('AI分析に失敗しました')
    } finally {
      setIsAnalyzing(false)
    }
  }, [customerFiles, customerName])

  // 土地アラート登録
  const handleRegisterAlert = useCallback(async (conditions: ExtractedLandConditions) => {
    setIsRegisteringAlert(true)
    try {
      const response = await fetch('/api/property-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          alertName: `${customerName}様 土地アラート`,
          areas: conditions.areas,
          minPrice: conditions.minPrice,
          maxPrice: conditions.maxPrice,
          minLandArea: conditions.minLandArea,
          maxLandArea: conditions.maxLandArea,
          stationWalkMax: conditions.stationWalkMax,
          roadWidthMin: conditions.roadWidthMin,
          keywords: conditions.otherConditions,
        }),
      })

      if (!response.ok) {
        throw new Error('登録に失敗しました')
      }

      setAlertRegistered(true)
      toast.success('土地アラートを登録しました！条件に合う物件が見つかると通知されます。')
    } catch {
      toast.error('アラート登録に失敗しました')
    } finally {
      setIsRegisteringAlert(false)
    }
  }, [customerId, customerName])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          <FileText className="w-5 h-5 mr-2 text-orange-500" />
          商談記録
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMemoEditor(true)}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            メモを追加
          </Button>
          <Badge variant="outline">{customerFiles.length}件</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* メモエディタ */}
        {showMemoEditor && (
          <MemoEditor onSave={handleSaveMemo} onCancel={handleCancelMemo} />
        )}

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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.ogg,.webm"
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
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-[10px]">
              <Volume2 className="w-3 h-3 mr-1" />
              音声
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <FileSpreadsheet className="w-3 h-3 mr-1" />
              Excel
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <FileImage className="w-3 h-3 mr-1" />
              画像
            </Badge>
          </div>
        </div>

        {/* タブでカテゴリ分け */}
        {customerFiles.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all" className="text-xs">
                すべて ({customerFiles.length})
              </TabsTrigger>
              <TabsTrigger value="audio" className="text-xs">
                <Volume2 className="w-3 h-3 mr-1" />
                音声 ({audioFiles.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">
                <File className="w-3 h-3 mr-1" />
                書類 ({documentFiles.length})
              </TabsTrigger>
              <TabsTrigger value="memos" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                メモ ({memoFiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getDisplayFiles().map((file) => (
                  <div key={file.id}>
                    {file.category === 'memo' ? (
                      editingMemoId === file.id ? (
                        <MemoEditor
                          memo={file}
                          onSave={handleSaveMemo}
                          onCancel={handleCancelMemo}
                        />
                      ) : (
                        <MemoDisplay
                          memo={file}
                          onEdit={() => setEditingMemoId(file.id)}
                          onDelete={() => handleDeleteRecord(file.id)}
                        />
                      )
                    ) : (
                      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {getFileIcon(file.type, file.category)}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(file.uploadedAt).toLocaleDateString('ja-JP')}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(file.uploadedAt).toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.category !== 'audio' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDownload(file)}
                              >
                                <Download className="w-3.5 h-3.5 text-gray-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-100"
                              onClick={() => handleDeleteRecord(file.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {/* 音声プレーヤー */}
                        {file.category === 'audio' && (
                          <AudioPlayer dataUrl={file.dataUrl} name={file.name} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {customerFiles.length === 0 && !showMemoEditor && (
          <p className="text-sm text-gray-500 text-center py-2">
            商談記録がありません
          </p>
        )}

        {/* AI分析結果 */}
        {showAnalysis && analysisResult && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI分析結果
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowAnalysis(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* センチメント & リスク */}
            <div className="flex gap-2">
              <Badge
                className={
                  analysisResult.sentiment === 'positive'
                    ? 'bg-green-100 text-green-700'
                    : analysisResult.sentiment === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {analysisResult.sentiment === 'positive'
                  ? '前向き'
                  : analysisResult.sentiment === 'negative'
                  ? '要注意'
                  : '中立'}
              </Badge>
              <Badge
                className={
                  analysisResult.riskLevel === 'high'
                    ? 'bg-red-100 text-red-700'
                    : analysisResult.riskLevel === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }
              >
                リスク: {analysisResult.riskLevel === 'high' ? '高' : analysisResult.riskLevel === 'medium' ? '中' : '低'}
              </Badge>
            </div>

            {/* サマリー */}
            <div>
              <p className="text-xs font-medium text-purple-700 mb-1">サマリー</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.summary}</p>
            </div>

            {/* 顧客意図 */}
            <div>
              <p className="text-xs font-medium text-purple-700 mb-1">顧客の意図</p>
              <p className="text-sm text-gray-700">{analysisResult.customerIntent}</p>
            </div>

            {/* キーワード */}
            {analysisResult.keywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">キーワード</p>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* アクションアイテム */}
            <div>
              <p className="text-xs font-medium text-purple-700 mb-1">アクションアイテム</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {analysisResult.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 次のステップ */}
            <div>
              <p className="text-xs font-medium text-purple-700 mb-1">推奨アクション</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {analysisResult.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-500">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[10px] text-gray-400 text-right">
              分析日時: {new Date(analysisResult.analyzedAt).toLocaleString('ja-JP')}
            </p>
          </div>
        )}

        {/* 土地探し条件（AIが抽出した場合） */}
        {showAnalysis && analysisResult?.landConditions && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                土地探し条件を発見
              </h4>
              <Badge className="bg-green-100 text-green-700">
                信頼度: {analysisResult.landConditions.confidence}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* エリア */}
              {analysisResult.landConditions.areas.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    希望エリア
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.landConditions.areas.map((area, i) => (
                      <Badge key={i} variant="outline" className="bg-white">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 価格 */}
              {(analysisResult.landConditions.minPrice || analysisResult.landConditions.maxPrice) && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    価格帯
                  </p>
                  <p className="text-gray-700">
                    {analysisResult.landConditions.minPrice && `${analysisResult.landConditions.minPrice}万円`}
                    {analysisResult.landConditions.minPrice && analysisResult.landConditions.maxPrice && ' 〜 '}
                    {analysisResult.landConditions.maxPrice && `${analysisResult.landConditions.maxPrice}万円`}
                  </p>
                </div>
              )}

              {/* 面積 */}
              {(analysisResult.landConditions.minLandArea || analysisResult.landConditions.maxLandArea) && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    土地面積
                  </p>
                  <p className="text-gray-700">
                    {analysisResult.landConditions.minLandArea && `${analysisResult.landConditions.minLandArea}㎡`}
                    {analysisResult.landConditions.minLandArea && analysisResult.landConditions.maxLandArea && ' 〜 '}
                    {analysisResult.landConditions.maxLandArea && `${analysisResult.landConditions.maxLandArea}㎡`}
                  </p>
                </div>
              )}

              {/* 駅徒歩 */}
              {analysisResult.landConditions.stationWalkMax && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Train className="w-3 h-3" />
                    駅徒歩
                  </p>
                  <p className="text-gray-700">{analysisResult.landConditions.stationWalkMax}分以内</p>
                </div>
              )}

              {/* 南向き */}
              {analysisResult.landConditions.preferSouth && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Sun className="w-3 h-3" />
                    方角
                  </p>
                  <p className="text-gray-700">南向き希望</p>
                </div>
              )}

              {/* その他条件 */}
              {analysisResult.landConditions.otherConditions.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-green-700 mb-1">その他の条件</p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.landConditions.otherConditions.map((cond, i) => (
                      <Badge key={i} variant="outline" className="bg-white text-xs">
                        {cond}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* アラート登録ボタン */}
            <div className="pt-2 border-t border-green-200">
              {alertRegistered ? (
                <div className="flex items-center justify-center gap-2 text-green-700 py-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">アラート登録完了</span>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={() => handleRegisterAlert(analysisResult.landConditions!)}
                  disabled={isRegisteringAlert}
                >
                  {isRegisteringAlert ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      この条件でアラートを登録
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-green-600 text-center mt-2">
                条件に合う物件が見つかるとダッシュボードに通知されます
              </p>
            </div>
          </div>
        )}

        {/* AI分析ボタン */}
        {customerFiles.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI分析を実行
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
