'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileSignature,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useContractStore, type StoredContract, useAuthStore } from '@/store'
import {
  CONTRACT_STATUS_CONFIG,
  type ContractStatus,
  type UserRole,
  getAvailableContractActions,
} from '@/types/database'
import { cn } from '@/lib/utils'

interface PendingApprovalsProps {
  maxItems?: number
}

export function PendingApprovals({ maxItems = 5 }: PendingApprovalsProps) {
  const [mounted, setMounted] = useState(false)
  const { contracts } = useContractStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            承認待ち契約
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const userRole = (user?.role || 'staff') as UserRole
  const userId = user?.id || 'unknown'

  // 現在のユーザーがアクションを実行できる契約を抽出
  const pendingContracts = contracts
    .filter((contract) => {
      // 完了した契約は除外
      if (contract.status === '契約完了') return false

      // ユーザーが実行可能なアクションがあるか確認
      const availableActions = getAvailableContractActions(
        contract.status,
        userRole,
        userId,
        contract.created_by,
        contract.checked_by
      )

      // 有効なアクションが1つ以上ある場合
      return availableActions.some((a) => a.enabled)
    })
    .slice(0, maxItems)

  // 各ステータスの件数を集計
  const statusCounts = contracts.reduce((acc, c) => {
    if (c.status !== '契約完了') {
      acc[c.status] = (acc[c.status] || 0) + 1
    }
    return acc
  }, {} as Record<ContractStatus, number>)

  const totalPending = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            承認待ち契約
            {totalPending > 0 && (
              <Badge className="ml-2 bg-orange-500">{totalPending}件</Badge>
            )}
          </span>
          <Link href="/contracts?status=承認待ち">
            <Button variant="ghost" size="sm" className="text-orange-500">
              すべて見る
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-300 mb-3" />
            <p className="text-gray-500 text-sm">
              対応が必要な契約はありません
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingContracts.map((contract) => {
              const statusConfig = CONTRACT_STATUS_CONFIG[contract.status]
              const availableActions = getAvailableContractActions(
                contract.status,
                userRole,
                userId,
                contract.created_by,
                contract.checked_by
              ).filter((a) => a.enabled)

              return (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          statusConfig.bgColor
                        )}
                      >
                        <FileSignature
                          className={cn('w-5 h-5', statusConfig.color)}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {contract.tei_name || contract.contract_number || '未設定'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contract.customer_name || '顧客未設定'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          statusConfig.bgColor,
                          statusConfig.color,
                          'border-0'
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                      {availableActions.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          {availableActions[0].action}可能
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ステータス別サマリ */}
        {totalPending > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-around text-xs text-gray-500">
              {(['作成中', '書類確認', '上長承認待ち'] as ContractStatus[]).map(
                (status) => {
                  const count = statusCounts[status] || 0
                  const config = CONTRACT_STATUS_CONFIG[status]
                  return (
                    <div key={status} className="text-center">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          count > 0 ? `${config.bgColor} ${config.color}` : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {count}件
                      </span>
                      <p className="mt-1">{config.label}</p>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
