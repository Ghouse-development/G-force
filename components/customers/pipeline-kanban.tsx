'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
import { Phone, Calendar, GripVertical, User } from 'lucide-react'
import {
  type Customer,
  type PipelineStatus,
  PIPELINE_CONFIG,
} from '@/types/database'
import { toast } from 'sonner'

interface PipelineKanbanProps {
  customers: Partial<Customer>[]
  onStatusChange?: (customerId: string, newStatus: PipelineStatus) => void
  statuses?: PipelineStatus[]
}

// ドラッグ可能なカード
function SortableCustomerCard({
  customer,
  overlay = false,
}: {
  customer: Partial<Customer>
  overlay?: boolean
}) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`mb-2 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
          overlay ? 'shadow-lg ring-2 ring-orange-500' : ''
        }`}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...listeners}
              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <Link href={`/customers/${customer.id}`} className="flex-1 min-w-0">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {customer.tei_name}
                </h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3" />
                  {customer.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                  {customer.phone && (
                    <span className="flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.lead_date && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(customer.lead_date).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                {(customer.estimated_amount || customer.contract_amount) && (
                  <p className="text-xs font-medium text-orange-600 mt-1">
                    ¥
                    {(
                      (customer.contract_amount || customer.estimated_amount) ?? 0
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// カラム（ステータス）
function PipelineColumn({
  status,
  customers,
}: {
  status: PipelineStatus
  customers: Partial<Customer>[]
}) {
  const config = PIPELINE_CONFIG[status]

  return (
    <div className="flex-shrink-0 w-64">
      <div
        className={`rounded-t-lg px-3 py-2 ${config.bgColor} border-b-2`}
        style={{ borderColor: config.color.replace('text-', '') }}
      >
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${config.color}`}>
            {config.label}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {customers.length}
          </Badge>
        </div>
      </div>
      <div className="bg-gray-50 rounded-b-lg p-2 min-h-[200px]">
        <SortableContext
          items={customers.map((c) => c.id || '')}
          strategy={verticalListSortingStrategy}
        >
          {customers.map((customer) => (
            <SortableCustomerCard key={customer.id} customer={customer} />
          ))}
        </SortableContext>
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            カードをここにドロップ
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineKanban({
  customers: initialCustomers,
  onStatusChange,
  statuses = ['反響', 'イベント参加', '限定会員', '面談', '建築申込', '内定', '契約', '着工', '引渡'],
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

    // 別のカードの上にドロップした場合
    const overCustomer = customers.find((c) => c.id === overId)
    if (overCustomer) {
      overContainer = overCustomer.pipeline_status as PipelineStatus
    } else {
      // カラム自体にドロップした場合（空のカラム）
      overContainer = overId as PipelineStatus
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

      toast.success(
        `${activeCustomer?.tei_name}を「${PIPELINE_CONFIG[overContainer].label}」に移動しました`
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            customers={customersByStatus[status]}
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
