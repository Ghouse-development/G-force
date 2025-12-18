'use client'

import { useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { FundPlanForm } from '@/components/fund-plans/fund-plan-form'
import { FundPlanPrintView } from '@/components/fund-plans/fund-plan-print-view'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { generatePDFFromElement } from '@/lib/fund-plan/pdf-generator'

export default function NewFundPlanPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const handleSave = async (data: FundPlanData) => {
    try {
      // TODO: Save to database
      console.log('Saving fund plan:', data)
      toast.success('資金計画書を保存しました')
      router.push('/fund-plans')
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

      // React要素をレンダリング
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(printContainer)

      await new Promise<void>((resolve) => {
        root.render(
          <FundPlanPrintView
            data={data}
            calculation={calculation}
            ref={(el) => {
              if (el) {
                // レンダリング完了を待つ
                setTimeout(async () => {
                  try {
                    await generatePDFFromElement(el, {
                      filename: `資金計画書_${data.teiName || '未設定'}.pdf`,
                      orientation: 'portrait',
                      format: 'a4',
                    })
                    toast.success('PDFを出力しました')
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

  return (
    <Layout>
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
            <p className="text-gray-500">Excelと同等の詳細な資金計画を作成できます</p>
          </div>
        </div>

        {/* Form */}
        <FundPlanForm
          onSave={handleSave}
          onExportPDF={handleExportPDF}
        />
      </div>
    </Layout>
  )
}
