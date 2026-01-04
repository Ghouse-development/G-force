'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContractWizard } from '@/components/contracts/contract-wizard'
import { useCustomerStore } from '@/store'
import { toast } from 'sonner'

function NewContractRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { customers } = useCustomerStore()

  // customer または customer_id パラメータに対応
  const customerId = searchParams.get('customer') || searchParams.get('customer_id') || undefined
  const fundPlanId = searchParams.get('fund_plan_id') || undefined

  // 顧客情報を取得
  const customer = customerId ? customers.find(c => c.id === customerId) : undefined

  // 顧客IDがない場合はリダイレクト
  useEffect(() => {
    if (!customerId) {
      toast.error('お客様ページから書類を作成してください')
      router.push('/customers')
    }
  }, [customerId, router])

  // 建築申込以降のステータスでのみ作成可能
  const allowedStatuses = ['建築申込', 'プラン提出', '内定', '変更契約前', '変更契約後']
  const canCreateDocuments = customer && allowedStatuses.includes(customer.pipeline_status)

  useEffect(() => {
    if (customer && !canCreateDocuments) {
      toast.error('契約依頼は建築申込以降のお客様のみ作成可能です')
      router.push(`/customers/${customerId}`)
    }
  }, [customer, canCreateDocuments, customerId, router])

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: '契約依頼', href: '/contract-requests' },
          { label: '新規作成' },
        ]}
      />

      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">請負契約書作成</h1>
        <p className="text-gray-600 mt-2">ステップに沿って契約内容を確認していきます</p>
      </div>

      <ContractWizard customerId={customerId} fundPlanId={fundPlanId} />
    </div>
  )
}

export default function NewContractRequestPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <NewContractRequestContent />
      </Suspense>
    </Layout>
  )
}
