'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  FileEdit,
  FileSignature,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useFundPlanStore, usePlanRequestStore, useContractStore, useHandoverStore } from '@/store'
import type { DocumentStatus } from '@/types/database'

interface RelatedDocumentsProps {
  customerId: string
  currentType?: 'fund-plan' | 'plan-request' | 'contract' | 'handover'
  currentId?: string
}

// ステータスアイコン
const getStatusIcon = (status: DocumentStatus | string) => {
  switch (status) {
    case 'approved':
    case '契約完了':
    case '完了':
      return <CheckCircle className="w-3 h-3 text-green-500" />
    case 'draft':
    case '作成中':
    case '新規依頼':
      return <Clock className="w-3 h-3 text-gray-400" />
    case 'rejected':
    case '差戻し':
      return <AlertCircle className="w-3 h-3 text-red-500" />
    default:
      return <Clock className="w-3 h-3 text-blue-500" />
  }
}

// ステータスラベル
const getStatusLabel = (status: DocumentStatus | string) => {
  const labels: Record<string, string> = {
    draft: '下書き',
    submitted: '提出済',
    approved: '承認済',
    rejected: '差戻し',
    '作成中': '作成中',
    '書類確認': '書類確認',
    '上長承認待ち': '上長承認待ち',
    '契約完了': '契約完了',
    '新規依頼': '新規依頼',
    '設計割り振り': '設計割り振り',
    '役調依頼中': '役調依頼中',
    'プラン作成中': 'プラン作成中',
    'プラン確認': 'プラン確認',
    '提案準備': '提案準備',
    '完了': '完了',
  }
  return labels[status] || status
}

export function RelatedDocuments({ customerId, currentType, currentId }: RelatedDocumentsProps) {
  const { fundPlans } = useFundPlanStore()
  const { planRequests } = usePlanRequestStore()
  const { contracts } = useContractStore()
  const { handovers } = useHandoverStore()

  // 顧客に関連する各書類を取得
  const relatedFundPlans = useMemo(() => {
    return fundPlans.filter(fp => fp.customerId === customerId)
  }, [fundPlans, customerId])

  const relatedPlanRequests = useMemo(() => {
    return planRequests.filter(pr => pr.customer_id === customerId)
  }, [planRequests, customerId])

  const relatedContracts = useMemo(() => {
    return contracts.filter(c => c.customer_id === customerId)
  }, [contracts, customerId])

  const relatedHandovers = useMemo(() => {
    return handovers.filter(h => h.customer_id === customerId)
  }, [handovers, customerId])

  const hasAnyDocuments =
    relatedFundPlans.length > 0 ||
    relatedPlanRequests.length > 0 ||
    relatedContracts.length > 0 ||
    relatedHandovers.length > 0

  if (!hasAnyDocuments) {
    return null
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <ClipboardList className="w-5 h-5 mr-2 text-orange-500" />
          関連書類
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 資金計画書 */}
        {relatedFundPlans.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              資金計画書
            </h4>
            <div className="space-y-1">
              {relatedFundPlans.map((fp) => (
                <Link
                  key={fp.id}
                  href={`/fund-plans/${fp.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentType === 'fund-plan' && currentId === fp.id ? 'bg-orange-50 border border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{fp.teiName}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      v{fp.version}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fp.status)}
                    <span className="text-xs text-gray-500">{getStatusLabel(fp.status)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* プラン依頼 */}
        {relatedPlanRequests.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
              <FileEdit className="w-3 h-3 mr-1" />
              プラン依頼
            </h4>
            <div className="space-y-1">
              {relatedPlanRequests.map((pr) => (
                <Link
                  key={pr.id}
                  href={`/plan-requests/${pr.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentType === 'plan-request' && currentId === pr.id ? 'bg-orange-50 border border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileEdit className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">{pr.tei_name || pr.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(pr.status)}
                    <span className="text-xs text-gray-500">{getStatusLabel(pr.status)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 契約 */}
        {relatedContracts.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
              <FileSignature className="w-3 h-3 mr-1" />
              契約
            </h4>
            <div className="space-y-1">
              {relatedContracts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentType === 'contract' && currentId === c.id ? 'bg-orange-50 border border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileSignature className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{c.tei_name || c.customer_name}</span>
                    {c.contract_number && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {c.contract_number}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(c.status)}
                    <span className="text-xs text-gray-500">{getStatusLabel(c.status)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 引継書 */}
        {relatedHandovers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
              <ClipboardList className="w-3 h-3 mr-1" />
              引継書
            </h4>
            <div className="space-y-1">
              {relatedHandovers.map((h) => (
                <Link
                  key={h.id}
                  href={`/handovers/${h.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentType === 'handover' && currentId === h.id ? 'bg-orange-50 border border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">{h.tei_name || h.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(h.status)}
                    <span className="text-xs text-gray-500">{getStatusLabel(h.status)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
