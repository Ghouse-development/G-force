'use client'

import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { FundPlanForm } from '@/components/fund-plans/fund-plan-form'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'

export default function NewFundPlanPage() {
  const router = useRouter()

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

  const handleExportPDF = async (data: FundPlanData, calculation: FundPlanCalculation) => {
    // PDF出力処理（後で実装）
    toast.info('PDF出力機能は準備中です')
    console.log('Export PDF:', data, calculation)
  }

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
