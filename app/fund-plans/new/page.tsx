'use client'

import { useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { FundPlanForm } from '@/components/fund-plans/fund-plan-form'
import { FundPlanA3PrintView } from '@/components/fund-plans/fund-plan-a3-print-view'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { generatePDFFromElement } from '@/lib/fund-plan/pdf-generator'
import { useFundPlanStore, useAuthStore, useCustomerStore } from '@/store'

function NewFundPlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId')

  const { addFundPlan } = useFundPlanStore()
  const { user } = useAuthStore()
  const { getCustomer } = useCustomerStore()

  const customer = customerId ? getCustomer(customerId) : null

  const handleSave = async (data: FundPlanData) => {
    try {
      const id = addFundPlan({
        customerId: customerId,
        customerName: customer?.name || null,
        teiName: data.teiName || '未設定',
        status: 'draft',
        data: data,
        createdBy: user?.id || null,
      })

      toast.success('資金計画書を保存しました')
      router.push(`/fund-plans/${id}`)
    } catch {
      toast.error('保存に失敗しました')
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

      // React 18のcreateRootを使用
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(printContainer)

      await new Promise<void>((resolve) => {
        root.render(
          <FundPlanA3PrintView
            data={data}
            calculation={calculation}
            onReady={async (element) => {
              if (element) {
                const success = await generatePDFFromElement(element, data.teiName || '資金計画書')
                if (success) {
                  toast.success('PDFを出力しました')
                } else {
                  toast.error('PDF出力に失敗しました')
                }
                // クリーンアップ
                setTimeout(() => {
                  root.unmount()
                  document.body.removeChild(printContainer)
                  resolve()
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">資金計画書 新規作成</h1>
          <p className="text-gray-500">
            {customer ? `${customer.name}様` : 'Excelと同等の詳細な資金計画を作成できます'}
          </p>
        </div>
      </div>

      {/* Form */}
      <FundPlanForm
        onSave={handleSave}
        onExportPDF={handleExportPDF}
        customerId={customerId || undefined}
        customerName={customer?.name}
      />
    </div>
  )
}

export default function NewFundPlanPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewFundPlanContent />
      </Suspense>
    </Layout>
  )
}
