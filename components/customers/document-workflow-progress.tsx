'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  FileEdit,
  FileSignature,
  ClipboardList,
  Check,
  ChevronRight,
} from 'lucide-react'
import { useFundPlanStore, usePlanRequestStore, useContractStore, useHandoverStore } from '@/store'

interface DocumentWorkflowProgressProps {
  customerId: string
}

interface WorkflowStep {
  id: string
  name: string
  icon: typeof FileText
  color: string
  bgColor: string
  href: string
  createHref: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'fund-plan',
    name: '資金計画書',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    href: '/fund-plans',
    createHref: '/fund-plans/new',
  },
  {
    id: 'plan-request',
    name: 'プラン依頼',
    icon: FileEdit,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    href: '/plan-requests',
    createHref: '/plan-requests/new',
  },
  {
    id: 'contract',
    name: '契約',
    icon: FileSignature,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    href: '/contracts',
    createHref: '/contracts/new',
  },
  {
    id: 'handover',
    name: '引継書',
    icon: ClipboardList,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    href: '/handovers',
    createHref: '/handovers/new',
  },
]

export function DocumentWorkflowProgress({ customerId }: DocumentWorkflowProgressProps) {
  const { fundPlans } = useFundPlanStore()
  const { planRequests } = usePlanRequestStore()
  const { contracts } = useContractStore()
  const { handovers } = useHandoverStore()

  // 各書類の状態を確認
  const documentStatus = useMemo(() => {
    const customerFundPlans = fundPlans.filter(fp => fp.customerId === customerId)
    const customerPlanRequests = planRequests.filter(pr => pr.customer_id === customerId)
    const customerContracts = contracts.filter(c => c.customer_id === customerId)
    const customerHandovers = handovers.filter(h => h.customer_id === customerId)

    return {
      'fund-plan': {
        count: customerFundPlans.length,
        completed: customerFundPlans.some(fp => fp.status === 'approved'),
        items: customerFundPlans,
      },
      'plan-request': {
        count: customerPlanRequests.length,
        completed: customerPlanRequests.some(pr => pr.status === '完了'),
        items: customerPlanRequests,
      },
      'contract': {
        count: customerContracts.length,
        completed: customerContracts.some(c => c.status === '契約完了'),
        items: customerContracts,
      },
      'handover': {
        count: customerHandovers.length,
        completed: customerHandovers.some(h => h.status === 'approved'),
        items: customerHandovers,
      },
    }
  }, [fundPlans, planRequests, contracts, handovers, customerId])

  // 現在のステップを特定
  const currentStepIndex = useMemo(() => {
    for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
      const step = WORKFLOW_STEPS[i]
      const status = documentStatus[step.id as keyof typeof documentStatus]
      if (status.count > 0) {
        return i
      }
    }
    return -1
  }, [documentStatus])

  // 完了済みステップ数
  const completedSteps = useMemo(() => {
    return WORKFLOW_STEPS.filter(step => {
      const status = documentStatus[step.id as keyof typeof documentStatus]
      return status.completed
    }).length
  }, [documentStatus])

  // 進捗率
  const progressPercentage = Math.round((completedSteps / WORKFLOW_STEPS.length) * 100)

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center">
            <ClipboardList className="w-4 h-4 mr-2" />
            書類ワークフロー
          </h3>
          <Badge className="bg-white/20 text-white border-0 text-xs">
            進捗 {progressPercentage}%
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        {/* プログレスバー */}
        <div className="relative mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-orange-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* ワークフローステップ */}
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = documentStatus[step.id as keyof typeof documentStatus]
            const isCompleted = status.completed
            const isActive = status.count > 0
            const isCurrent = index === currentStepIndex
            const Icon = step.icon

            return (
              <div key={step.id} className="flex items-center">
                <Link
                  href={
                    status.count > 0
                      ? `${step.href}?customer=${customerId}`
                      : `${step.createHref}?customer=${customerId}`
                  }
                  className="group"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? `${step.bgColor} ${step.color} ring-2 ring-offset-2 ring-${step.color.replace('text-', '')}`
                            : 'bg-gray-100 text-gray-400'
                        }
                        ${isCurrent ? 'scale-110 shadow-lg' : ''}
                        group-hover:scale-110 group-hover:shadow-md
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`
                        text-[10px] mt-1 font-medium text-center
                        ${isActive ? 'text-gray-900' : 'text-gray-400'}
                      `}
                    >
                      {step.name}
                    </span>
                    {status.count > 0 && (
                      <Badge
                        variant="secondary"
                        className={`mt-0.5 text-[9px] px-1.5 py-0 ${
                          isCompleted ? 'bg-green-100 text-green-700' : ''
                        }`}
                      >
                        {status.count}件
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* コネクター */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className="flex-1 mx-1 sm:mx-2">
                    <ChevronRight
                      className={`w-4 h-4 ${
                        index < currentStepIndex ? 'text-green-500' : 'text-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
