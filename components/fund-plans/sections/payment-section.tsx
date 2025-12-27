'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, DateInput, DisplayValue, SubSectionTitle } from '../fund-plan-input'
import type { FundPlanData, PaymentPlanItem } from '@/types/fund-plan'
import { scheduleItems } from '@/lib/fund-plan/master-data'

interface PaymentSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
  totals: {
    paymentTotal: number
    selfFundingTotal: number
    bankLoanTotal: number
  }
}

export function PaymentSection({ data, onChange, totals }: PaymentSectionProps) {
  const updateOutsidePayment = (
    key: 'landPurchase' | 'miscellaneous',
    updates: Partial<PaymentPlanItem>
  ) => {
    onChange({
      paymentPlanOutside: {
        ...data.paymentPlanOutside,
        [key]: {
          ...data.paymentPlanOutside[key],
          ...updates,
        },
      },
    })
  }

  const updateConstructionPayment = (
    key: 'applicationFee' | 'contractFee' | 'interimPayment1' | 'interimPayment2' | 'finalPayment',
    updates: Partial<PaymentPlanItem>
  ) => {
    onChange({
      paymentPlanConstruction: {
        ...data.paymentPlanConstruction,
        [key]: {
          ...data.paymentPlanConstruction[key],
          ...updates,
        },
      },
    })
  }

  const updateSchedule = (key: keyof FundPlanData['schedule'], value: string) => {
    onChange({
      schedule: {
        ...data.schedule,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* 支払計画 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">支払計画</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* 工事請負金額以外 */}
          <div className="space-y-3">
            <SubSectionTitle>工事請負金額以外</SubSectionTitle>

            {/* 土地購入費用 */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-700">土地購入費用</p>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanOutside.landPurchase.paymentDate}
                  onChange={(v) => updateOutsidePayment('landPurchase', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanOutside.landPurchase.totalAmount}
                  onChange={(v) => updateOutsidePayment('landPurchase', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanOutside.landPurchase.selfFunding}
                  onChange={(v) => updateOutsidePayment('landPurchase', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanOutside.landPurchase.bankLoan}
                  onChange={(v) => updateOutsidePayment('landPurchase', { bankLoan: v })}
                />
              </div>
            </div>

            {/* 諸費用 */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-700">諸費用</p>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanOutside.miscellaneous.paymentDate}
                  onChange={(v) => updateOutsidePayment('miscellaneous', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanOutside.miscellaneous.totalAmount}
                  onChange={(v) => updateOutsidePayment('miscellaneous', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanOutside.miscellaneous.selfFunding}
                  onChange={(v) => updateOutsidePayment('miscellaneous', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanOutside.miscellaneous.bankLoan}
                  onChange={(v) => updateOutsidePayment('miscellaneous', { bankLoan: v })}
                />
              </div>
            </div>
          </div>

          {/* 工事請負金額 */}
          <div className="space-y-3">
            <SubSectionTitle>工事請負金額</SubSectionTitle>

            {/* 建築申込金 */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-700">建築申込金</p>
                <span className="text-xs text-blue-600">基準: 3万円</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanConstruction.applicationFee.paymentDate}
                  onChange={(v) => updateConstructionPayment('applicationFee', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanConstruction.applicationFee.totalAmount}
                  onChange={(v) => updateConstructionPayment('applicationFee', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanConstruction.applicationFee.selfFunding}
                  onChange={(v) => updateConstructionPayment('applicationFee', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanConstruction.applicationFee.bankLoan}
                  onChange={(v) => updateConstructionPayment('applicationFee', { bankLoan: v })}
                />
              </div>
            </div>

            {/* 契約金 */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-700">契約金</p>
                <span className="text-xs text-blue-600">基準: 10%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanConstruction.contractFee.paymentDate}
                  onChange={(v) => updateConstructionPayment('contractFee', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanConstruction.contractFee.totalAmount}
                  onChange={(v) => updateConstructionPayment('contractFee', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanConstruction.contractFee.selfFunding}
                  onChange={(v) => updateConstructionPayment('contractFee', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanConstruction.contractFee.bankLoan}
                  onChange={(v) => updateConstructionPayment('contractFee', { bankLoan: v })}
                />
              </div>
            </div>

            {/* 中間時金(1) */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-700">中間時金(1)</p>
                <span className="text-xs text-blue-600">基準: 30%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanConstruction.interimPayment1.paymentDate}
                  onChange={(v) => updateConstructionPayment('interimPayment1', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanConstruction.interimPayment1.totalAmount}
                  onChange={(v) => updateConstructionPayment('interimPayment1', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanConstruction.interimPayment1.selfFunding}
                  onChange={(v) => updateConstructionPayment('interimPayment1', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanConstruction.interimPayment1.bankLoan}
                  onChange={(v) => updateConstructionPayment('interimPayment1', { bankLoan: v })}
                />
              </div>
            </div>

            {/* 中間時金(2) */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-700">中間時金(2)</p>
                <span className="text-xs text-blue-600">基準: 30%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanConstruction.interimPayment2.paymentDate}
                  onChange={(v) => updateConstructionPayment('interimPayment2', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanConstruction.interimPayment2.totalAmount}
                  onChange={(v) => updateConstructionPayment('interimPayment2', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanConstruction.interimPayment2.selfFunding}
                  onChange={(v) => updateConstructionPayment('interimPayment2', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanConstruction.interimPayment2.bankLoan}
                  onChange={(v) => updateConstructionPayment('interimPayment2', { bankLoan: v })}
                />
              </div>
            </div>

            {/* 最終金 */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-700">最終金</p>
                <span className="text-xs text-blue-600">基準: 残代金</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DateInput
                  label="支払予定日"
                  value={data.paymentPlanConstruction.finalPayment.paymentDate}
                  onChange={(v) => updateConstructionPayment('finalPayment', { paymentDate: v })}
                />
                <CurrencyInput
                  label="支払金額（A+B）"
                  value={data.paymentPlanConstruction.finalPayment.totalAmount}
                  onChange={(v) => updateConstructionPayment('finalPayment', { totalAmount: v })}
                />
                <CurrencyInput
                  label="自己資金（A）"
                  value={data.paymentPlanConstruction.finalPayment.selfFunding}
                  onChange={(v) => updateConstructionPayment('finalPayment', { selfFunding: v })}
                />
                <CurrencyInput
                  label="銀行融資（B）"
                  value={data.paymentPlanConstruction.finalPayment.bankLoan}
                  onChange={(v) => updateConstructionPayment('finalPayment', { bankLoan: v })}
                />
              </div>
            </div>
          </div>

          {/* 支払合計 */}
          <div className="bg-orange-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">支払合計</p>
            <div className="grid grid-cols-3 gap-4">
              <DisplayValue label="支払合計" value={totals.paymentTotal} unit="円" highlight />
              <DisplayValue label="自己資金合計" value={totals.selfFundingTotal} unit="円" />
              <DisplayValue label="銀行融資合計" value={totals.bankLoanTotal} unit="円" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工程スケジュール */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">工程スケジュール</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {scheduleItems.map((item) => (
              <DateInput
                key={item.key}
                label={item.label}
                value={data.schedule[item.key as keyof FundPlanData['schedule']]}
                onChange={(v) => updateSchedule(item.key as keyof FundPlanData['schedule'], v)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
