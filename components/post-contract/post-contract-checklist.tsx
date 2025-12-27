'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle2,
  Circle,
  Clock,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  Calendar,
  FileSignature,
  Ruler,
  FileCheck,
  Hammer,
  Building,
  Key,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type PostContractChecklistCategory,
  type ChecklistItemStatus,
  type CustomerChecklistProgress,
  POST_CONTRACT_CHECKLIST_ITEMS,
  POST_CONTRACT_CHECKLIST_CATEGORY_CONFIG,
  CHECKLIST_STATUS_CONFIG,
} from '@/types/database'

interface PostContractChecklistProps {
  customerId: string
  customerName: string
  contractDate?: string
  handoverDate?: string
  progress?: CustomerChecklistProgress[]
  onUpdateProgress?: (itemCode: string, status: ChecklistItemStatus, notes?: string) => void
}

// カテゴリアイコンのマッピング
const CategoryIcons: Record<PostContractChecklistCategory, React.ReactNode> = {
  '契約関連': <FileSignature className="w-4 h-4" />,
  '設計関連': <Ruler className="w-4 h-4" />,
  '申請関連': <FileCheck className="w-4 h-4" />,
  '着工準備': <Hammer className="w-4 h-4" />,
  '工事中': <Building className="w-4 h-4" />,
  '引渡準備': <Key className="w-4 h-4" />,
}

// ステータスアイコンのマッピング
const StatusIcons: Record<ChecklistItemStatus, React.ReactNode> = {
  'pending': <Circle className="w-5 h-5 text-gray-400" />,
  'in_progress': <Clock className="w-5 h-5 text-blue-500" />,
  'completed': <CheckCircle2 className="w-5 h-5 text-green-500" />,
  'skipped': <MinusCircle className="w-5 h-5 text-gray-300" />,
}

export function PostContractChecklist({
  customerId: _customerId,
  customerName,
  contractDate,
  handoverDate,
  progress = [],
  onUpdateProgress,
}: PostContractChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<PostContractChecklistCategory>>(
    new Set(['契約関連', '設計関連']) // デフォルトで最初の2カテゴリを開く
  )

  // 進捗をコードでマップ化
  const progressMap = useMemo(() => {
    const map = new Map<string, CustomerChecklistProgress>()
    progress.forEach(p => map.set(p.itemCode, p))
    return map
  }, [progress])

  // カテゴリごとにアイテムをグループ化
  const itemsByCategory = useMemo(() => {
    const grouped: Record<PostContractChecklistCategory, typeof POST_CONTRACT_CHECKLIST_ITEMS> = {
      '契約関連': [],
      '設計関連': [],
      '申請関連': [],
      '着工準備': [],
      '工事中': [],
      '引渡準備': [],
    }
    POST_CONTRACT_CHECKLIST_ITEMS.forEach(item => {
      grouped[item.category].push(item)
    })
    return grouped
  }, [])

  // 全体の進捗率を計算
  const overallProgress = useMemo(() => {
    const requiredItems = POST_CONTRACT_CHECKLIST_ITEMS.filter(i => i.isRequired)
    const completedCount = requiredItems.filter(item => {
      const p = progressMap.get(item.code)
      return p?.status === 'completed' || p?.status === 'skipped'
    }).length
    return requiredItems.length > 0
      ? Math.round((completedCount / requiredItems.length) * 100)
      : 0
  }, [progressMap])

  // 期限目安を計算
  const getTargetDate = (item: typeof POST_CONTRACT_CHECKLIST_ITEMS[0]): Date | null => {
    if (item.daysFromContract && contractDate) {
      const date = new Date(contractDate)
      date.setDate(date.getDate() + item.daysFromContract)
      return date
    }
    if (item.daysBeforeHandover && handoverDate) {
      const date = new Date(handoverDate)
      date.setDate(date.getDate() - item.daysBeforeHandover)
      return date
    }
    return null
  }

  // 遅延判定
  const isOverdue = (item: typeof POST_CONTRACT_CHECKLIST_ITEMS[0]): boolean => {
    const targetDate = getTargetDate(item)
    if (!targetDate) return false
    const p = progressMap.get(item.code)
    if (p?.status === 'completed' || p?.status === 'skipped') return false
    return targetDate < new Date()
  }

  // カテゴリごとの進捗
  const getCategoryProgress = (category: PostContractChecklistCategory) => {
    const items = itemsByCategory[category].filter(i => i.isRequired)
    const completed = items.filter(item => {
      const p = progressMap.get(item.code)
      return p?.status === 'completed' || p?.status === 'skipped'
    }).length
    return items.length > 0 ? Math.round((completed / items.length) * 100) : 0
  }

  // ステータス変更
  const handleStatusChange = (itemCode: string, newStatus: ChecklistItemStatus) => {
    if (onUpdateProgress) {
      onUpdateProgress(itemCode, newStatus)
      toast.success(`ステータスを「${CHECKLIST_STATUS_CONFIG[newStatus].label}」に変更しました`)
    }
  }

  // カテゴリの展開/折りたたみ
  const toggleCategory = (category: PostContractChecklistCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* 全体進捗 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{customerName} - 業務進捗</span>
            <Badge variant="secondary" className="text-lg px-3">
              {overallProgress}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>契約日: {contractDate ? new Date(contractDate).toLocaleDateString('ja-JP') : '未設定'}</span>
            <span>引渡予定: {handoverDate ? new Date(handoverDate).toLocaleDateString('ja-JP') : '未設定'}</span>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリごとのチェックリスト */}
      {(Object.keys(itemsByCategory) as PostContractChecklistCategory[]).map(category => {
        const config = POST_CONTRACT_CHECKLIST_CATEGORY_CONFIG[category]
        const items = itemsByCategory[category]
        const categoryProgress = getCategoryProgress(category)
        const isExpanded = expandedCategories.has(category)
        const overdueCount = items.filter(isOverdue).length

        return (
          <Collapsible
            key={category}
            open={isExpanded}
            onOpenChange={() => toggleCategory(category)}
          >
            <Card className="border-0 shadow-md">
              <CollapsibleTrigger asChild>
                <CardHeader className={`cursor-pointer hover:bg-gray-50 transition-colors ${config.bgColor} rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className={config.color}>{CategoryIcons[category]}</span>
                      <CardTitle className={`text-base ${config.color}`}>
                        {config.label}
                      </CardTitle>
                      {overdueCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {overdueCount}件遅延
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {categoryProgress}%
                      </span>
                      <Progress value={categoryProgress} className="w-20 h-2" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    {items.map(item => {
                      const p = progressMap.get(item.code)
                      const status: ChecklistItemStatus = p?.status || 'pending'
                      const targetDate = getTargetDate(item)
                      const overdue = isOverdue(item)

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            status === 'completed' ? 'bg-green-50 border-green-200' :
                            status === 'skipped' ? 'bg-gray-50 border-gray-200 opacity-60' :
                            overdue ? 'bg-red-50 border-red-200' :
                            'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {StatusIcons[status]}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${
                                  status === 'completed' ? 'text-green-700 line-through' :
                                  status === 'skipped' ? 'text-gray-400 line-through' :
                                  'text-gray-900'
                                }`}>
                                  {item.title}
                                </span>
                                {item.isRequired && status === 'pending' && (
                                  <Badge variant="outline" className="text-[10px] px-1">必須</Badge>
                                )}
                                {overdue && (
                                  <Badge variant="destructive" className="text-[10px]">遅延</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>{item.assignedDepartments.join('・')}</span>
                                {targetDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {targetDate.toLocaleDateString('ja-JP')}目安
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.code, 'pending')}
                                className={status === 'pending' ? 'bg-gray-100' : ''}
                              >
                                <Circle className="w-4 h-4 mr-2 text-gray-400" />
                                未着手
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.code, 'in_progress')}
                                className={status === 'in_progress' ? 'bg-blue-100' : ''}
                              >
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                進行中
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.code, 'completed')}
                                className={status === 'completed' ? 'bg-green-100' : ''}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                完了
                              </DropdownMenuItem>
                              {!item.isRequired && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(item.code, 'skipped')}
                                  className={status === 'skipped' ? 'bg-gray-100' : ''}
                                >
                                  <MinusCircle className="w-4 h-4 mr-2 text-gray-400" />
                                  スキップ
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}
