'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, DisplayValue } from '../fund-plan-input'
import type { FundPlanData } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'

interface LandMiscSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
  subtotals: {
    miscellaneous: number
    land: number
    grandTotal: number
  }
}

export function LandMiscSection({ data, onChange, subtotals }: LandMiscSectionProps) {
  const updateMiscellaneous = (key: keyof FundPlanData['miscellaneousCosts'], value: number) => {
    onChange({
      miscellaneousCosts: {
        ...data.miscellaneousCosts,
        [key]: value,
      },
    })
  }

  const updateLand = (key: keyof FundPlanData['landCosts'], value: number) => {
    onChange({
      landCosts: {
        ...data.landCosts,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* ❺諸費用 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              5
            </span>
            諸費用
            <span className="text-xs font-normal text-gray-500">概算の金額となりますので、ご注意ください。</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="建物登記費用"
              value={data.miscellaneousCosts.buildingRegistrationFee}
              onChange={(v) => updateMiscellaneous('buildingRegistrationFee', v)}
              provisional
            />
            <CurrencyInput
              label="住宅ローン諸費用（保証料、手数料等）"
              value={data.miscellaneousCosts.housingLoanFee}
              onChange={(v) => updateMiscellaneous('housingLoanFee', v)}
              provisional
            />
            <CurrencyInput
              label="つなぎローン諸費用（金利、手数料等）"
              value={data.miscellaneousCosts.bridgeLoanFee}
              onChange={(v) => updateMiscellaneous('bridgeLoanFee', v)}
              provisional
            />
            <CurrencyInput
              label="金銭消費貸借契約 印紙代"
              value={data.miscellaneousCosts.loanContractStampDuty}
              onChange={(v) => updateMiscellaneous('loanContractStampDuty', v)}
              provisional
            />
            <CurrencyInput
              label="建物請負工事契約 印紙代（電子契約の場合0）"
              value={data.miscellaneousCosts.constructionContractStampDuty}
              onChange={(v) => updateMiscellaneous('constructionContractStampDuty', v)}
            />
            <CurrencyInput
              label="火災保険料"
              value={data.miscellaneousCosts.fireInsurance}
              onChange={(v) => updateMiscellaneous('fireInsurance', v)}
              provisional
            />
            <CurrencyInput
              label="先行工事（税込）"
              value={data.miscellaneousCosts.advanceConstruction}
              onChange={(v) => updateMiscellaneous('advanceConstruction', v)}
              provisional
            />
            <CurrencyInput
              label="外構工事（税込）"
              value={data.miscellaneousCosts.exteriorConstruction}
              onChange={(v) => updateMiscellaneous('exteriorConstruction', v)}
              provisional
            />
            <CurrencyInput
              label="造作工事（税込）"
              value={data.miscellaneousCosts.customConstruction}
              onChange={(v) => updateMiscellaneous('customConstruction', v)}
              provisional
            />
          </div>
          <DisplayValue
            label="諸費用 小計"
            value={subtotals.miscellaneous}
            unit="円"
            highlight
          />
        </CardContent>
      </Card>

      {/* ❻土地費用 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              6
            </span>
            土地費用
            <span className="text-xs font-normal text-gray-500">概算の金額となりますので、ご注意ください。</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="土地売買代金"
              value={data.landCosts.landPrice}
              onChange={(v) => updateLand('landPrice', v)}
              provisional
            />
            <CurrencyInput
              label="固定資産税清算金"
              value={data.landCosts.propertyTaxSettlement}
              onChange={(v) => updateLand('propertyTaxSettlement', v)}
              provisional
            />
            <CurrencyInput
              label="土地売買契約 印紙代"
              value={data.landCosts.landContractStampDuty}
              onChange={(v) => updateLand('landContractStampDuty', v)}
              provisional
            />
            <CurrencyInput
              label="土地仲介手数料"
              value={data.landCosts.brokerageFee}
              onChange={(v) => updateLand('brokerageFee', v)}
              provisional
            />
            <CurrencyInput
              label="土地登記費用"
              value={data.landCosts.landRegistrationFee}
              onChange={(v) => updateLand('landRegistrationFee', v)}
              provisional
            />
            <CurrencyInput
              label="滅失登記費用"
              value={data.landCosts.extinctionRegistrationFee}
              onChange={(v) => updateLand('extinctionRegistrationFee', v)}
              provisional
            />
          </div>
          <DisplayValue
            label="土地費用 小計"
            value={subtotals.land}
            unit="円"
            highlight
          />
        </CardContent>
      </Card>

      {/* 最終合計 */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="py-6 px-6">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-1">最終建物工事費用+諸費用+土地費用 合計（税込）</p>
            <p className="text-3xl font-bold">{formatCurrency(subtotals.grandTotal)}円</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
