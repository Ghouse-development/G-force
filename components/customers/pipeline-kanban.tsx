'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GripVertical,
  MoreHorizontal,
  FileText,
  ClipboardList,
  FileSignature,
  Target,
} from 'lucide-react'
import { useCustomerStore, useFundPlanStore } from '@/store'
import {
  type Customer,
  type PipelineStatus,
  PIPELINE_CONFIG,
  PRE_CONTRACT_STATUS_ORDER,
} from '@/types/database'
import { toast } from 'sonner'

interface PipelineKanbanProps {
  customers: Partial<Customer>[]
  onStatusChange?: (customerId: string, newStatus: PipelineStatus) => void
  statuses?: PipelineStatus[]
}

// 住所から〇〇市〇〇町までを抽出するヘルパー
function extractCityTown(address: string): string {
  if (!address) return ''
  // 都道府県を除去して市区町村を抽出
  // パターン: 都道府県名 + 市区町村 + 町・大字など
  const match = address.match(/(.+?[都道府県])(.+?[市区町村郡])(.+?[町村丁目])/)
  if (match) {
    return match[2] + match[3].replace(/[0-9０-９\-ー－]+.*$/, '') // 番地以降を除去
  }
  // 市区町村までのパターン
  const simpleMatch = address.match(/(.+?[市区町村郡])/)
  if (simpleMatch) {
    return simpleMatch[1]
  }
  // フォールバック: 最初の20文字
  return address.substring(0, 20)
}

// 資金計画から税抜金額を計算するヘルパー
function calculateTaxExcludedAmount(data: import('@/types/fund-plan').FundPlanData | undefined): number {
  if (!data) return 0

  // 建物本体工事（施工面積 × 坪単価）
  const buildingMain = (data.constructionArea || 0) * (data.pricePerTsubo || 0)

  // 付帯工事A
  const incidentalA = data.incidentalCostA ? Object.values(data.incidentalCostA).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) : 0

  // 付帯工事B（数値のみ）
  const incidentalB = data.incidentalCostB ? [
    data.incidentalCostB.solarPanelCost,
    data.incidentalCostB.storageBatteryCost,
    data.incidentalCostB.eaveOverhangCost,
    data.incidentalCostB.lowerRoofCost,
    data.incidentalCostB.balconyVoidCost,
    data.incidentalCostB.threeStoryDifference,
    data.incidentalCostB.roofLengthExtra,
    data.incidentalCostB.narrowRoadExtra,
    data.incidentalCostB.areaSizeExtra,
    data.incidentalCostB.lightingCost,
    data.incidentalCostB.optionCost,
  ].reduce((sum, val) => sum + (val || 0), 0) : 0

  // 付帯工事C（数値のみ）
  const incidentalC = data.incidentalCostC ? [
    data.incidentalCostC.fireProtectionCost,
    data.incidentalCostC.demolitionCost,
    data.incidentalCostC.applicationManagementFee,
    data.incidentalCostC.waterDrainageFee,
    data.incidentalCostC.groundImprovementFee,
    data.incidentalCostC.soilDisposalFee,
    data.incidentalCostC.electricProtectionPipe,
    data.incidentalCostC.narrowRoadCubicExtra,
    data.incidentalCostC.deepFoundationExtra,
    data.incidentalCostC.elevationExtra,
    data.incidentalCostC.flagLotExtra,
    data.incidentalCostC.skyFactorExtra,
    data.incidentalCostC.quasiFireproofExtra,
    data.incidentalCostC.roadTimeRestrictionExtra,
  ].reduce((sum, val) => sum + (val || 0), 0) : 0

  return buildingMain + incidentalA + incidentalB + incidentalC
}

// ドラッグ可能なカード
function SortableCustomerCard({
  customer,
  overlay = false,
}: {
  customer: Partial<Customer>
  overlay?: boolean
}) {
  const router = useRouter()
  const { toggleChallenge, isChallenge } = useCustomerStore()
  const { getFundPlansByCustomer } = useFundPlanStore()
  const isChallengeCustomer = customer.id ? isChallenge(customer.id) : false

  // 最新の資金計画書を取得
  const latestFundPlan = useMemo(() => {
    if (!customer.id) return null
    const plans = getFundPlansByCustomer(customer.id)
    if (plans.length === 0) return null
    // 最新のものを取得
    return plans.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  }, [customer.id, getFundPlansByCustomer])

  // 建築地（資金計画から取得、なければ顧客の住所）
  const constructionLocation = useMemo(() => {
    const address = latestFundPlan?.data?.constructionAddress || customer.address || ''
    return extractCityTown(address)
  }, [latestFundPlan, customer.address])

  // 金額（税別）
  const taxExcludedAmount = useMemo(() => {
    return calculateTaxExcludedAmount(latestFundPlan?.data)
  }, [latestFundPlan])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id || '' })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // アクションメニューのクリックイベントを止める
  const handleActionClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(path)
  }

  const handleChallengeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (customer.id) {
      toggleChallenge(customer.id)
      toast.success(
        isChallengeCustomer
          ? `${customer.tei_name || customer.name}のチャレンジを解除しました`
          : `${customer.tei_name || customer.name}をチャレンジに設定しました`
      )
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`mb-1.5 shadow-sm hover:shadow-md transition-shadow ${
          overlay ? 'shadow-lg ring-2 ring-orange-500' : ''
        } ${isChallengeCustomer ? 'border-l-2 border-l-amber-300' : ''}`}
      >
        <CardContent className="p-2">
          <div className="flex items-start gap-1.5">
            <div
              {...listeners}
              className="mt-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <Link href={`/customers/${customer.id}`} className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs truncate hover:text-orange-600 text-gray-900">
                    {customer.name}
                    {isChallengeCustomer && <span className="text-amber-400 ml-1 text-[8px]">★</span>}
                  </h4>
                </Link>
                {/* アクションメニュー */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={handleChallengeClick}
                      className={isChallengeCustomer ? 'text-red-600' : ''}
                    >
                      <Target className={`w-4 h-4 mr-2 ${isChallengeCustomer ? 'text-red-500' : 'text-gray-500'}`} />
                      {isChallengeCustomer ? 'チャレンジ解除' : 'チャレンジ設定'}
                    </DropdownMenuItem>
                    <div className="border-t my-1" />
                    <DropdownMenuItem
                      onClick={(e) => handleActionClick(e as unknown as React.MouseEvent, `/fund-plans/new?customer_id=${customer.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      資金計画書作成
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleActionClick(e as unknown as React.MouseEvent, `/plan-requests/new?customer_id=${customer.id}`)}
                    >
                      <ClipboardList className="w-4 h-4 mr-2 text-orange-500" />
                      プラン依頼作成
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleActionClick(e as unknown as React.MouseEvent, `/contract-requests/new?customer_id=${customer.id}`)}
                    >
                      <FileSignature className="w-4 h-4 mr-2 text-green-500" />
                      請負契約書作成
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* 建築地 */}
              {constructionLocation && (
                <p className="text-[10px] text-gray-500 truncate">
                  {constructionLocation}
                </p>
              )}
              {/* 最終アクション日 */}
              {customer.updated_at && (
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {new Date(customer.updated_at).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
              {/* 金額（税別）- 資金計画書から取得 */}
              {taxExcludedAmount > 0 && (
                <p className="text-[10px] font-medium text-orange-600 mt-0.5">
                  ¥{taxExcludedAmount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// カラム（ステータス）- ドロップ可能エリア
function PipelineColumn({
  status,
  customers,
  isCompact = false,
}: {
  status: PipelineStatus
  customers: Partial<Customer>[]
  isCompact?: boolean
}) {
  const config = PIPELINE_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  // 直近のアクション順（updated_at降順）に並び替え
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bDate - aDate // 新しい順
    })
  }, [customers])

  if (!config) return null

  return (
    <div className={`${isCompact ? 'w-[160px] shrink-0' : 'flex-1 min-w-[180px]'}`}>
      <div
        className={`rounded-t-lg px-2 py-2 ${config.bgColor} border-b-2 sticky top-0 z-10`}
        style={{ borderColor: config.color.replace('text-', '') }}
      >
        <div className="flex items-center justify-between gap-1">
          <h3 className={`font-semibold text-xs ${config.color} truncate`}>
            {config.label}
          </h3>
          <Badge variant="secondary" className="text-xs shrink-0">
            {customers.length}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-50 rounded-b-lg p-1.5 ${isCompact ? 'min-h-[300px] max-h-[400px]' : 'min-h-[400px] max-h-[600px]'} overflow-y-auto transition-colors ${
          isOver ? 'bg-orange-50 ring-2 ring-orange-300' : ''
        }`}
      >
        <SortableContext
          items={sortedCustomers.map((c) => c.id || '')}
          strategy={verticalListSortingStrategy}
        >
          {sortedCustomers.map((customer) => (
            <SortableCustomerCard key={customer.id} customer={customer} />
          ))}
        </SortableContext>
        {customers.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
            <span className="hidden md:inline">カードをここにドロップ</span>
            <span className="md:hidden">0件</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineKanban({
  customers: initialCustomers,
  onStatusChange,
  statuses = PRE_CONTRACT_STATUS_ORDER as PipelineStatus[],
}: PipelineKanbanProps) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ステータスごとに顧客をグループ化
  const customersByStatus = useMemo(() => {
    const grouped: Record<PipelineStatus, Partial<Customer>[]> = {} as Record<
      PipelineStatus,
      Partial<Customer>[]
    >
    for (const status of statuses) {
      grouped[status] = customers.filter(
        (c) => c.pipeline_status === status
      )
    }
    return grouped
  }, [customers, statuses])

  // アクティブなカードを取得
  const activeCustomer = useMemo(() => {
    if (!activeId) return null
    return customers.find((c) => c.id === activeId)
  }, [activeId, customers])

  // カードがどのカラムにあるかを特定
  const findContainer = (id: string): PipelineStatus | null => {
    const customer = customers.find((c) => c.id === id)
    return (customer?.pipeline_status as PipelineStatus) || null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainer(activeId)

    // ドロップ先のコンテナを特定
    let overContainer: PipelineStatus | null = null

    // ステータス名に直接ドロップした場合
    if (statuses.includes(overId as PipelineStatus)) {
      overContainer = overId as PipelineStatus
    } else {
      // 別のカードの上にドロップした場合
      const overCustomer = customers.find((c) => c.id === overId)
      if (overCustomer) {
        overContainer = overCustomer.pipeline_status as PipelineStatus
      }
    }

    if (!activeContainer || !overContainer) return

    // 同じカラム内での移動（順序変更）
    if (activeContainer === overContainer) {
      const oldIndex = customersByStatus[activeContainer].findIndex(
        (c) => c.id === activeId
      )
      const newIndex = customersByStatus[overContainer].findIndex(
        (c) => c.id === overId
      )

      if (oldIndex !== newIndex && newIndex !== -1) {
        setCustomers((prev) => {
          const newCustomers = [...prev]
          const statusCustomers = newCustomers.filter(
            (c) => c.pipeline_status === activeContainer
          )
          const reordered = arrayMove(statusCustomers, oldIndex, newIndex)

          // 元の配列を更新
          const otherCustomers = newCustomers.filter(
            (c) => c.pipeline_status !== activeContainer
          )
          return [...otherCustomers, ...reordered]
        })
      }
    } else {
      // 異なるカラムへの移動（ステータス変更）
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, pipeline_status: overContainer } : c
        )
      )

      // コールバックを呼び出し
      if (onStatusChange) {
        onStatusChange(activeId, overContainer)
      }

      const overConfig = PIPELINE_CONFIG[overContainer]
      toast.success(
        `${activeCustomer?.tei_name || activeCustomer?.name}を「${overConfig?.label || overContainer}」に移動しました`
      )
    }
  }

  // モバイル判定用のヘルプテキスト
  const mobileHint = (
    <div className="md:hidden text-center text-xs text-gray-500 mb-2 px-2">
      ← 横にスクロールしてステータスを確認 →
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {mobileHint}
      <div className="flex gap-2 pb-4 overflow-x-auto md:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 -mx-2 px-2 md:mx-0 md:px-0">
        {statuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            customers={customersByStatus[status] || []}
            isCompact={true}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCustomer ? (
          <SortableCustomerCard customer={activeCustomer} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
