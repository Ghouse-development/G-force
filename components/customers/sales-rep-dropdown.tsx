'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { User, UserPlus, Check } from 'lucide-react'
import { useCustomerStore } from '@/store'
import { toast } from 'sonner'

// モックの営業担当データ
// TODO: 実際のユーザーマスタから取得するように変更
const SALES_PERSONS = [
  { id: 'dev-sales-001', name: '田中 一郎' },
  { id: 'dev-sales-002', name: '山田 花子' },
  { id: 'dev-sales-003', name: '佐藤 健太' },
  { id: 'dev-sales-004', name: '鈴木 美咲' },
  { id: 'dev-sales-005', name: '高橋 翔太' },
]

interface SalesRepDropdownProps {
  customerId: string
  currentAssignee?: string | null
  currentAssigneeName?: string | null
  onAssign?: (salesPersonId: string, salesPersonName: string) => void
  variant?: 'default' | 'compact'
}

export function SalesRepDropdown({
  customerId,
  currentAssignee,
  currentAssigneeName,
  onAssign,
  variant = 'default',
}: SalesRepDropdownProps) {
  const { updateCustomer } = useCustomerStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleAssign = async (salesPersonId: string, salesPersonName: string) => {
    try {
      updateCustomer(customerId, { assigned_to: salesPersonId })

      if (onAssign) {
        onAssign(salesPersonId, salesPersonName)
      }

      toast.success(`${salesPersonName}に割り振りました`)
      setIsOpen(false)
    } catch {
      toast.error('割り振りに失敗しました')
    }
  }

  const displayName = currentAssigneeName ||
    SALES_PERSONS.find(p => p.id === currentAssignee)?.name ||
    '未割当'

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <User className="w-3 h-3 mr-1" />
            {displayName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            営業担当を選択
          </div>
          <DropdownMenuSeparator />
          {SALES_PERSONS.map((person) => (
            <DropdownMenuItem
              key={person.id}
              onClick={() => handleAssign(person.id, person.name)}
              className="flex items-center justify-between"
            >
              <span>{person.name}</span>
              {currentAssignee === person.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentAssignee ? (
            <>
              <User className="w-4 h-4" />
              {displayName}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              営業を割り当て
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
          営業担当を選択
        </div>
        <DropdownMenuSeparator />
        {SALES_PERSONS.map((person) => (
          <DropdownMenuItem
            key={person.id}
            onClick={() => handleAssign(person.id, person.name)}
            className="flex items-center justify-between"
          >
            <span>{person.name}</span>
            {currentAssignee === person.id && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
