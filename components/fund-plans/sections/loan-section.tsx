'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CurrencyInput, NumberInput, PercentInput, TextInput, DisplayValue, SubSectionTitle } from '../fund-plan-input'
import type { FundPlanData, InterestRateType, BankLoanPlan, BridgeLoanItem } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'
import { interestRateTypes } from '@/lib/fund-plan/master-data'

interface LoanSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
  calculations: {
    monthlyPaymentA: number
    monthlyPaymentB: number
    monthlyPaymentC: number
    totalMonthlyPayment: number
    bonusPaymentA: number
    bonusPaymentB: number
    bonusPaymentC: number
    totalBonusPayment: number
    bridgeLoanInterestTotal: number
  }
}

export function LoanSection({ data, onChange, calculations }: LoanSectionProps) {
  const updateBankLoan = (bank: 'bankA' | 'bankB' | 'bankC', updates: Partial<BankLoanPlan>) => {
    onChange({
      loanPlan: {
        ...data.loanPlan,
        [bank]: {
          ...data.loanPlan[bank],
          ...updates,
        },
      },
    })
  }

  const updateBridgeLoan = (
    bridge: 'landBridge' | 'constructionStartBridge' | 'constructionInterimBridge',
    updates: Partial<BridgeLoanItem>
  ) => {
    onChange({
      bridgeLoan: {
        ...data.bridgeLoan,
        [bridge]: {
          ...data.bridgeLoan[bridge],
          ...updates,
        },
      },
    })
  }

  const updateHousingCost = (key: keyof FundPlanData['currentHousingCost'], value: number) => {
    onChange({
      currentHousingCost: {
        ...data.currentHousingCost,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* 借入計画 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">借入計画</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* A銀行 */}
          <div className="space-y-2">
            <SubSectionTitle>A銀行</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <TextInput
                label="銀行名"
                value={data.loanPlan.bankA.bankName}
                onChange={(v) => updateBankLoan('bankA', { bankName: v })}
              />
              <CurrencyInput
                label="借入額"
                value={data.loanPlan.bankA.amount}
                onChange={(v) => updateBankLoan('bankA', { amount: v, principalMonthly: v })}
              />
              <PercentInput
                label="金利"
                value={data.loanPlan.bankA.interestRate}
                onChange={(v) => updateBankLoan('bankA', { interestRate: v })}
              />
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">固定/変動</Label>
                <Select
                  value={data.loanPlan.bankA.rateType}
                  onValueChange={(v) => updateBankLoan('bankA', { rateType: v as InterestRateType })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interestRateTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <NumberInput
                label="借入年数"
                value={data.loanPlan.bankA.loanYears}
                onChange={(v) => updateBankLoan('bankA', { loanYears: v })}
                unit="年"
              />
              <CurrencyInput
                label="返済元金（毎月）"
                value={data.loanPlan.bankA.principalMonthly}
                onChange={(v) => updateBankLoan('bankA', { principalMonthly: v })}
              />
              <CurrencyInput
                label="返済元金（ボーナス）"
                value={data.loanPlan.bankA.principalBonus}
                onChange={(v) => updateBankLoan('bankA', { principalBonus: v })}
              />
              <DisplayValue
                label="月々返済額"
                value={calculations.monthlyPaymentA}
                unit="円"
                highlight
              />
            </div>
          </div>

          {/* B銀行 */}
          <div className="space-y-2">
            <SubSectionTitle>B銀行</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <TextInput
                label="銀行名"
                value={data.loanPlan.bankB.bankName}
                onChange={(v) => updateBankLoan('bankB', { bankName: v })}
              />
              <CurrencyInput
                label="借入額"
                value={data.loanPlan.bankB.amount}
                onChange={(v) => updateBankLoan('bankB', { amount: v, principalMonthly: v })}
              />
              <PercentInput
                label="金利"
                value={data.loanPlan.bankB.interestRate}
                onChange={(v) => updateBankLoan('bankB', { interestRate: v })}
              />
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">固定/変動</Label>
                <Select
                  value={data.loanPlan.bankB.rateType}
                  onValueChange={(v) => updateBankLoan('bankB', { rateType: v as InterestRateType })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interestRateTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <NumberInput
                label="借入年数"
                value={data.loanPlan.bankB.loanYears}
                onChange={(v) => updateBankLoan('bankB', { loanYears: v })}
                unit="年"
              />
              <CurrencyInput
                label="返済元金（毎月）"
                value={data.loanPlan.bankB.principalMonthly}
                onChange={(v) => updateBankLoan('bankB', { principalMonthly: v })}
              />
              <CurrencyInput
                label="返済元金（ボーナス）"
                value={data.loanPlan.bankB.principalBonus}
                onChange={(v) => updateBankLoan('bankB', { principalBonus: v })}
              />
              <DisplayValue
                label="月々返済額"
                value={calculations.monthlyPaymentB}
                unit="円"
              />
            </div>
          </div>

          {/* C銀行 */}
          <div className="space-y-2">
            <SubSectionTitle>C銀行</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <TextInput
                label="銀行名"
                value={data.loanPlan.bankC.bankName}
                onChange={(v) => updateBankLoan('bankC', { bankName: v })}
              />
              <CurrencyInput
                label="借入額"
                value={data.loanPlan.bankC.amount}
                onChange={(v) => updateBankLoan('bankC', { amount: v, principalMonthly: v })}
              />
              <PercentInput
                label="金利"
                value={data.loanPlan.bankC.interestRate}
                onChange={(v) => updateBankLoan('bankC', { interestRate: v })}
              />
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">固定/変動</Label>
                <Select
                  value={data.loanPlan.bankC.rateType}
                  onValueChange={(v) => updateBankLoan('bankC', { rateType: v as InterestRateType })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interestRateTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <NumberInput
                label="借入年数"
                value={data.loanPlan.bankC.loanYears}
                onChange={(v) => updateBankLoan('bankC', { loanYears: v })}
                unit="年"
              />
              <CurrencyInput
                label="返済元金（毎月）"
                value={data.loanPlan.bankC.principalMonthly}
                onChange={(v) => updateBankLoan('bankC', { principalMonthly: v })}
              />
              <CurrencyInput
                label="返済元金（ボーナス）"
                value={data.loanPlan.bankC.principalBonus}
                onChange={(v) => updateBankLoan('bankC', { principalBonus: v })}
              />
              <DisplayValue
                label="月々返済額"
                value={calculations.monthlyPaymentC}
                unit="円"
              />
            </div>
          </div>

          {/* 合計 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">月々返済額合計</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(calculations.totalMonthlyPayment)}円
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* つなぎ融資 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">つなぎ融資</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* 土地つなぎ */}
          <div className="space-y-2">
            <SubSectionTitle>土地つなぎ</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <CurrencyInput
                label="借入額"
                value={data.bridgeLoan.landBridge.amount}
                onChange={(v) => updateBridgeLoan('landBridge', { amount: v })}
              />
              <PercentInput
                label="金利"
                value={data.bridgeLoan.landBridge.interestRate}
                onChange={(v) => updateBridgeLoan('landBridge', { interestRate: v })}
              />
              <NumberInput
                label="つなぎ予定期間"
                value={data.bridgeLoan.landBridge.months}
                onChange={(v) => updateBridgeLoan('landBridge', { months: v })}
                unit="ヶ月"
                step={0.1}
              />
              <DisplayValue
                label="つなぎ金利息（期間合計）"
                value={Math.round(
                  (data.bridgeLoan.landBridge.amount *
                    data.bridgeLoan.landBridge.interestRate *
                    data.bridgeLoan.landBridge.months) /
                    12
                )}
                unit="円"
              />
            </div>
          </div>

          {/* 建物着工つなぎ */}
          <div className="space-y-2">
            <SubSectionTitle>建物着工つなぎ</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <CurrencyInput
                label="借入額"
                value={data.bridgeLoan.constructionStartBridge.amount}
                onChange={(v) => updateBridgeLoan('constructionStartBridge', { amount: v })}
              />
              <PercentInput
                label="金利"
                value={data.bridgeLoan.constructionStartBridge.interestRate}
                onChange={(v) => updateBridgeLoan('constructionStartBridge', { interestRate: v })}
              />
              <NumberInput
                label="つなぎ予定期間"
                value={data.bridgeLoan.constructionStartBridge.months}
                onChange={(v) => updateBridgeLoan('constructionStartBridge', { months: v })}
                unit="ヶ月"
                step={0.1}
              />
              <DisplayValue
                label="つなぎ金利息（期間合計）"
                value={Math.round(
                  (data.bridgeLoan.constructionStartBridge.amount *
                    data.bridgeLoan.constructionStartBridge.interestRate *
                    data.bridgeLoan.constructionStartBridge.months) /
                    12
                )}
                unit="円"
              />
            </div>
          </div>

          {/* 建物中間つなぎ */}
          <div className="space-y-2">
            <SubSectionTitle>建物中間つなぎ</SubSectionTitle>
            <div className="grid grid-cols-4 gap-2">
              <CurrencyInput
                label="借入額"
                value={data.bridgeLoan.constructionInterimBridge.amount}
                onChange={(v) => updateBridgeLoan('constructionInterimBridge', { amount: v })}
              />
              <PercentInput
                label="金利"
                value={data.bridgeLoan.constructionInterimBridge.interestRate}
                onChange={(v) => updateBridgeLoan('constructionInterimBridge', { interestRate: v })}
              />
              <NumberInput
                label="つなぎ予定期間"
                value={data.bridgeLoan.constructionInterimBridge.months}
                onChange={(v) => updateBridgeLoan('constructionInterimBridge', { months: v })}
                unit="ヶ月"
                step={0.1}
              />
              <DisplayValue
                label="つなぎ金利息（期間合計）"
                value={Math.round(
                  (data.bridgeLoan.constructionInterimBridge.amount *
                    data.bridgeLoan.constructionInterimBridge.interestRate *
                    data.bridgeLoan.constructionInterimBridge.months) /
                    12
                )}
                unit="円"
              />
            </div>
          </div>

          {/* つなぎ合計 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">つなぎ金利息合計</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(calculations.bridgeLoanInterestTotal)}円
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 現在の住居費 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">現在お支払いの住居費</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-3">
            <CurrencyInput
              label="家賃"
              value={data.currentHousingCost.rent}
              onChange={(v) => updateHousingCost('rent', v)}
            />
            <CurrencyInput
              label="電気代"
              value={data.currentHousingCost.electricity}
              onChange={(v) => updateHousingCost('electricity', v)}
            />
            <CurrencyInput
              label="ガス・灯油代"
              value={data.currentHousingCost.gasOil}
              onChange={(v) => updateHousingCost('gasOil', v)}
            />
            <CurrencyInput
              label="駐車場・その他"
              value={data.currentHousingCost.parking}
              onChange={(v) => updateHousingCost('parking', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
