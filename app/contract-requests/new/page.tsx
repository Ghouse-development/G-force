'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContractWizard } from '@/components/contracts/contract-wizard'

function NewContractRequestContent() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer_id') || undefined
  const fundPlanId = searchParams.get('fund_plan_id') || undefined

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
