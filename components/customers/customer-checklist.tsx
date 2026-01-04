'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { PIPELINE_CONFIG, type PipelineStatus } from '@/types/database'

interface ChecklistItem {
  id: string
  pipeline_status: string
  item_order: number
  title: string
  description: string | null
  is_required: boolean
  is_active: boolean
  customer_item: {
    id: string
    is_completed: boolean
    completed_at: string | null
    notes: string | null
  } | null
  is_completed: boolean
}

interface CustomerChecklistProps {
  customerId: string
  currentStatus: PipelineStatus
}

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '資料請求': { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' },
  'イベント予約': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  'イベント参加': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  '限定会員': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700' },
  '面談': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
  '建築申込': { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' },
  'プラン提出': { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700' },
  '内定': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
  'ボツ・他決': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
  '変更契約前': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  '変更契約後': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  'オーナー': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
}

const PIPELINE_ORDER: PipelineStatus[] = [
  '資料請求',
  'イベント予約',
  'イベント参加',
  '限定会員',
  '面談',
  '建築申込',
  'プラン提出',
  '内定',
  'ボツ・他決',
  '変更契約前',
  '変更契約後',
  'オーナー',
]

export function CustomerChecklist({ customerId, currentStatus }: CustomerChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [groupedItems, setGroupedItems] = useState<Record<string, ChecklistItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({})

  const fetchChecklists = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer-checklists?customerId=${customerId}`)
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`)
      }
      const data = await res.json()
      if (data.items) {
        setItems(data.items)
        setGroupedItems(data.groupedByStatus || {})
      }
    } catch (error) {
      console.error('Error fetching checklists:', error)
      toast.error('チェックリストの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchChecklists()
  }, [fetchChecklists])

  useEffect(() => {
    // 現在のステータスとその前後のステージを展開
    const currentIndex = PIPELINE_ORDER.indexOf(currentStatus)
    const expanded: Record<string, boolean> = {}
    PIPELINE_ORDER.forEach((stage, index) => {
      // 現在のステータスと前後1つずつを展開
      expanded[stage] = Math.abs(index - currentIndex) <= 1
    })
    setExpandedStages(expanded)
  }, [currentStatus])

  const handleToggleItem = async (templateId: string, currentCompleted: boolean) => {
    setSaving(templateId)
    try {
      const res = await fetch('/api/customer-checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          template_id: templateId,
          is_completed: !currentCompleted,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      // 楽観的更新
      setItems((prev) =>
        prev.map((item) =>
          item.id === templateId
            ? { ...item, is_completed: !currentCompleted }
            : item
        )
      )
      setGroupedItems((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((stage) => {
          updated[stage] = updated[stage].map((item) =>
            item.id === templateId
              ? { ...item, is_completed: !currentCompleted }
              : item
          )
        })
        return updated
      })

      if (!currentCompleted) {
        toast.success('チェック完了!')
      }
    } catch (error) {
      console.error('Error toggling item:', error)
      toast.error('更新に失敗しました')
    } finally {
      setSaving(null)
    }
  }

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }))
  }

  // 進捗計算
  const calculateProgress = (stageItems: ChecklistItem[]) => {
    if (!stageItems || stageItems.length === 0) return 0
    const completed = stageItems.filter((item) => item.is_completed).length
    return Math.round((completed / stageItems.length) * 100)
  }

  // 全体進捗
  const totalProgress = items.length > 0
    ? Math.round((items.filter((item) => item.is_completed).length / items.length) * 100)
    : 0

  // 現在のステータスまでの必須項目完了率
  const currentStageIndex = PIPELINE_ORDER.indexOf(currentStatus)
  const relevantStages = PIPELINE_ORDER.slice(0, currentStageIndex + 1)
  const relevantItems = items.filter((item) =>
    relevantStages.includes(item.pipeline_status as PipelineStatus) && item.is_required
  )
  const requiredProgress = relevantItems.length > 0
    ? Math.round((relevantItems.filter((item) => item.is_completed).length / relevantItems.length) * 100)
    : 100

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 全体進捗 */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-800">契約への道のり</span>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-emerald-700">
              {items.filter((item) => item.is_completed).length} / {items.length} 完了
            </span>
            {requiredProgress < 100 && (
              <span className="text-orange-600 flex items-center gap-1">
                <Star className="w-4 h-4" />
                必須: {requiredProgress}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ステージ別チェックリスト */}
      {PIPELINE_ORDER.map((stage) => {
        const stageItems = groupedItems[stage] || []
        const stageProgress = calculateProgress(stageItems)
        const isCurrentStage = stage === currentStatus
        const colors = STAGE_COLORS[stage] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' }

        if (stageItems.length === 0) return null

        return (
          <Card
            key={stage}
            className={`border-0 shadow-lg overflow-hidden ${
              isCurrentStage ? 'ring-2 ring-orange-400' : ''
            }`}
          >
            <CardHeader
              className={`cursor-pointer ${colors.bg} border-l-4 ${colors.border} py-3`}
              onClick={() => toggleStage(stage)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base font-bold flex items-center gap-2 ${colors.text}`}>
                  {expandedStages[stage] ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {isCurrentStage && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                      現在
                    </span>
                  )}
                  {PIPELINE_CONFIG[stage].label}
                </CardTitle>
                <div className="flex items-center gap-3">
                  {stageProgress === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {stageProgress}%
                    </span>
                  )}
                </div>
              </div>
              {!expandedStages[stage] && (
                <Progress value={stageProgress} className="h-1.5 mt-2" />
              )}
            </CardHeader>

            {expandedStages[stage] && (
              <CardContent className="p-4">
                <div className="space-y-2">
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        item.is_completed
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center h-6">
                        {saving === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={() =>
                              handleToggleItem(item.id, item.is_completed)
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              item.is_completed
                                ? 'text-green-700 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.is_required && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                              必須
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={`text-sm mt-1 ${
                              item.is_completed ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
