'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  FileCheck,
  ClipboardList,
  Download,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  type CustomerPipelineStatus,
  type NextAction,
  type DocumentCompleteness,
  getNextActions,
  checkFundPlanCompleteness,
  checkContractCompleteness,
  CUSTOMER_PIPELINE_FLOW,
} from '@/lib/document-flow'
import type { FundPlanData } from '@/types/fund-plan'
import type { ContractData } from '@/types/contract'
import { cn } from '@/lib/utils'

interface NextActionsPanelProps {
  customerStatus: CustomerPipelineStatus
  fundPlan?: FundPlanData | null
  contract?: ContractData | null
  hasHandover?: boolean
  onAction?: (action: NextAction) => void
  className?: string
}

const actionIcons: Record<NextAction['type'], React.ReactNode> = {
  create_fund_plan: <FileText className="w-5 h-5" />,
  create_plan_request: <ClipboardList className="w-5 h-5" />,
  create_contract: <FileCheck className="w-5 h-5" />,
  create_handover: <ClipboardList className="w-5 h-5" />,
  export_documents: <Download className="w-5 h-5" />,
  none: <CheckCircle2 className="w-5 h-5" />,
}

const actionColors: Record<NextAction['type'], string> = {
  create_fund_plan: 'bg-blue-100 text-blue-700 border-blue-200',
  create_plan_request: 'bg-purple-100 text-purple-700 border-purple-200',
  create_contract: 'bg-orange-100 text-orange-700 border-orange-200',
  create_handover: 'bg-green-100 text-green-700 border-green-200',
  export_documents: 'bg-gray-100 text-gray-700 border-gray-200',
  none: 'bg-gray-50 text-gray-500 border-gray-100',
}

/**
 * NextActionsPanel - 次のアクション表示パネル
 *
 * 顧客のステータスに応じて、次にすべきアクションをカードで表示
 */
export function NextActionsPanel({
  customerStatus,
  fundPlan,
  contract,
  hasHandover = false,
  onAction,
  className,
}: NextActionsPanelProps) {
  const hasFundPlan = !!fundPlan
  const hasContract = !!contract
  const hasPlanRequest = false // TODO: プラン依頼データの連携

  const actions = getNextActions(
    customerStatus,
    hasFundPlan,
    hasPlanRequest,
    hasContract,
    hasHandover
  )

  // 完成度チェック
  const fundPlanCompleteness = fundPlan ? checkFundPlanCompleteness(fundPlan) : null
  const contractCompleteness = contract ? checkContractCompleteness(contract) : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-800">
            次のアクション
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            {customerStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* ドキュメント完成度 */}
        {(fundPlanCompleteness || contractCompleteness) && (
          <div className="space-y-3 pb-4 border-b">
            {fundPlanCompleteness && (
              <DocumentCompletenessBar
                title="資金計画書"
                completeness={fundPlanCompleteness}
              />
            )}
            {contractCompleteness && (
              <DocumentCompletenessBar
                title="請負契約書"
                completeness={contractCompleteness}
              />
            )}
          </div>
        )}

        {/* アクションカード */}
        <div className="space-y-3">
          {actions.map((action, index) => (
            <ActionCard
              key={action.type}
              action={action}
              isPrimary={index === 0 && action.type !== 'none'}
              onClick={() => onAction?.(action)}
            />
          ))}
        </div>

        {/* パイプラインステータス */}
        <div className="pt-4 border-t">
          <PipelineProgress currentStatus={customerStatus} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ActionCard - 個別アクションカード
 */
function ActionCard({
  action,
  isPrimary,
  onClick,
}: {
  action: NextAction
  isPrimary: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!action.enabled}
      className={cn(
        'w-full p-4 rounded-lg border-2 transition-all text-left',
        action.enabled ? 'hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed',
        isPrimary && action.enabled
          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'
          : actionColors[action.type]
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isPrimary ? 'bg-orange-100 text-orange-600' : 'bg-white'
        )}>
          {actionIcons[action.type]}
        </div>
        <div className="flex-1">
          <p className={cn(
            'font-medium',
            isPrimary ? 'text-orange-800' : 'text-gray-800'
          )}>
            {action.label}
          </p>
          <p className="text-sm text-gray-500">{action.description}</p>
        </div>
        {action.enabled && action.path && (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </button>
  )
}

/**
 * DocumentCompletenessBar - ドキュメント完成度バー
 */
function DocumentCompletenessBar({
  title,
  completeness,
}: {
  title: string
  completeness: DocumentCompleteness
}) {
  const { percentage, missingFields, warnings } = completeness

  const statusColor =
    percentage === 100 ? 'text-green-600' :
    percentage >= 80 ? 'text-orange-600' :
    'text-red-600'

  const progressColor =
    percentage === 100 ? 'bg-green-500' :
    percentage >= 80 ? 'bg-orange-500' :
    'bg-red-500'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className={cn('text-sm font-bold', statusColor)}>
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
      {(missingFields.length > 0 || warnings.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {missingFields.slice(0, 3).map((field) => (
            <Badge key={field} variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {field}
            </Badge>
          ))}
          {warnings.slice(0, 2).map((warning) => (
            <Badge key={warning} variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {warning}
            </Badge>
          ))}
          {(missingFields.length > 3 || warnings.length > 2) && (
            <Badge variant="outline" className="text-xs">
              +{missingFields.length - 3 + warnings.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * PipelineProgress - パイプライン進捗表示
 */
function PipelineProgress({
  currentStatus,
}: {
  currentStatus: CustomerPipelineStatus
}) {
  const currentIndex = CUSTOMER_PIPELINE_FLOW.indexOf(currentStatus)

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">進捗状況</p>
      <div className="flex items-center gap-1">
        {CUSTOMER_PIPELINE_FLOW.map((status, index) => {
          const isPast = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={status}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                isPast ? 'bg-green-400' :
                isCurrent ? 'bg-orange-400' :
                'bg-gray-200'
              )}
              title={status}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>新規</span>
        <span>オーナー</span>
      </div>
    </div>
  )
}

/**
 * QuickExportButtons - クイックエクスポートボタン
 */
interface QuickExportButtonsProps {
  fundPlan?: FundPlanData | null
  contract?: ContractData | null
  onExportFundPlan?: () => void
  onExportContract?: () => void
  onExportBoth?: () => void
}

export function QuickExportButtons({
  fundPlan,
  contract,
  onExportFundPlan,
  onExportContract,
  onExportBoth,
}: QuickExportButtonsProps) {
  const hasFundPlan = !!fundPlan
  const hasContract = !!contract

  if (!hasFundPlan && !hasContract) {
    return null
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {hasFundPlan && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportFundPlan}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <FileText className="w-4 h-4 mr-1" />
          資金計画書
        </Button>
      )}
      {hasContract && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportContract}
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <FileCheck className="w-4 h-4 mr-1" />
          請負契約書
        </Button>
      )}
      {hasFundPlan && hasContract && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportBoth}
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Download className="w-4 h-4 mr-1" />
          両方出力
        </Button>
      )}
    </div>
  )
}
