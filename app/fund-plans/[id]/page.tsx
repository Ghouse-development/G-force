'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { FundPlanForm } from '@/components/fund-plans/fund-plan-form'
import { FundPlanA3PrintView } from '@/components/fund-plans/fund-plan-a3-print-view'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { generatePDFFromElement } from '@/lib/fund-plan/pdf-generator'
import { useFundPlanStore, useCustomerStore } from '@/store'

const statusConfig = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '提出済', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '承認済', color: 'bg-green-100 text-green-700' },
  rejected: { label: '却下', color: 'bg-red-100 text-red-700' },
}

export default function FundPlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const shouldExport = searchParams.get('export') === 'true'

  const { getFundPlan, updateFundPlan } = useFundPlanStore()
  const { getCustomer } = useCustomerStore()

  const fundPlan = getFundPlan(id)
  const customer = fundPlan?.customerId ? getCustomer(fundPlan.customerId) : null

  const handleSave = async (data: FundPlanData) => {
    try {
      updateFundPlan(id, {
        teiName: data.teiName || '未設定',
        data: data,
      })

      toast.success('資金計画書を更新しました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  const handleExportPDF = useCallback(async (data: FundPlanData, calculation: FundPlanCalculation) => {
    try {
      toast.info('PDF生成中...')

      // プリントビューを一時的に表示
      const printContainer = document.createElement('div')
      printContainer.style.position = 'absolute'
      printContainer.style.left = '-9999px'
      printContainer.style.top = '0'
      document.body.appendChild(printContainer)

      // React要素をレンダリング
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(printContainer)

      await new Promise<void>((resolve) => {
        root.render(
          <FundPlanA3PrintView
            data={data}
            calculation={calculation}
            ref={(el) => {
              if (el) {
                // レンダリング完了を待つ
                setTimeout(async () => {
                  try {
                    await generatePDFFromElement(el, {
                      filename: `資金計画書_${data.teiName || '未設定'}.pdf`,
                      orientation: 'landscape',
                      format: 'a3',
                    })
                    toast.success('PDFを出力しました（A3横向き）')
                  } catch (error) {
                    console.error('PDF generation error:', error)
                    toast.error('PDF出力に失敗しました')
                  } finally {
                    root.unmount()
                    document.body.removeChild(printContainer)
                    resolve()
                  }
                }, 500)
              }
            }}
          />
        )
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('PDF出力に失敗しました')
    }
  }, [])

  // Auto-export if requested
  useEffect(() => {
    if (shouldExport && fundPlan) {
      // Clear the export param from URL
      router.replace(`/fund-plans/${id}`)
    }
  }, [shouldExport, fundPlan, id, router])

  if (!fundPlan) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-gray-500 mb-4">資金計画書が見つかりません</p>
          <Button variant="outline" onClick={() => router.push('/fund-plans')}>
            一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/fund-plans')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{fundPlan.teiName}</h1>
                <Badge className={statusConfig[fundPlan.status].color}>
                  {statusConfig[fundPlan.status].label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                {customer && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {customer.name}様
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  作成: {new Date(fundPlan.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  更新: {new Date(fundPlan.updatedAt).toLocaleDateString('ja-JP')}
                </span>
                <span className="text-gray-400">v{fundPlan.version}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <FundPlanForm
          initialData={fundPlan.data}
          onSave={handleSave}
          onExportPDF={handleExportPDF}
          customerId={fundPlan.customerId || undefined}
          customerName={customer?.name}
        />
      </div>
    </Layout>
  )
}
