'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, DisplayValue, SubSectionTitle } from '../fund-plan-input'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'
import { TrendingDown, TrendingUp, Home, Building } from 'lucide-react'

interface HousingComparisonSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
  calculation: FundPlanCalculation
}

export function HousingComparisonSection({
  data,
  onChange,
  calculation,
}: HousingComparisonSectionProps) {
  const updateHousingCost = (key: keyof FundPlanData['currentHousingCost'], value: number) => {
    onChange({
      currentHousingCost: {
        ...data.currentHousingCost,
        [key]: value,
      },
    })
  }

  // 現在の住居費合計
  const currentTotal =
    data.currentHousingCost.rent +
    data.currentHousingCost.electricity +
    data.currentHousingCost.gasOil +
    data.currentHousingCost.parking

  // 新居の住居費
  const newMonthlyPayment = calculation.totalMonthlyPayment
  const solarEffect = data.incidentalCostB.solarPanelKw > 0 ? data.solarOnlyEffect.monthlyTotalEffect : 0

  // 実質光熱費（オール電化想定で約16,533円 - 太陽光効果）
  const baseUtilityCost = 16533
  const effectiveUtilityCost = Math.max(0, baseUtilityCost - solarEffect)

  // 新居の月額合計
  const newTotal = newMonthlyPayment + effectiveUtilityCost

  // 差額
  const difference = currentTotal - newTotal
  const isPositive = difference >= 0

  return (
    <div className="space-y-4">
      {/* 現在の住居費 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-500" />
            現在お支払いの住居費
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
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
          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <span className="font-medium">現在の住居費 月額合計</span>
            <span className="text-xl font-bold">{formatCurrency(currentTotal)}円</span>
          </div>
        </CardContent>
      </Card>

      {/* 新居の住居費 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-500" />
            新居の住居費
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="space-y-3">
            <SubSectionTitle>住宅ローン返済</SubSectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <DisplayValue
                label="月々の返済額"
                value={newMonthlyPayment}
                unit="円"
                highlight
              />
              {calculation.totalBonusPayment > 0 && (
                <DisplayValue
                  label="ボーナス時返済額"
                  value={calculation.totalBonusPayment}
                  unit="円"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <SubSectionTitle>光熱費（オール電化）</SubSectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <DisplayValue
                label="基本光熱費"
                value={baseUtilityCost}
                unit="円"
              />
              {solarEffect > 0 && (
                <>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600">太陽光経済効果</span>
                    <div className="h-8 px-3 rounded border flex items-center justify-end text-sm font-medium bg-green-50 border-green-200 text-green-700">
                      -{formatCurrency(solarEffect)}円
                    </div>
                  </div>
                  <DisplayValue
                    label="実質光熱費"
                    value={effectiveUtilityCost}
                    unit="円"
                  />
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              ※オール電化住宅の平均光熱費（約16,533円/月）から太陽光経済効果を差し引いた金額です
            </p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg flex justify-between items-center">
            <span className="font-medium">新居の住居費 月額合計</span>
            <span className="text-xl font-bold text-orange-600">{formatCurrency(newTotal)}円</span>
          </div>
        </CardContent>
      </Card>

      {/* 比較結果 */}
      <Card className={isPositive ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'}>
        <CardContent className="py-6 px-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {isPositive ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                {isPositive ? '月々のお支払いが' : '月々のお支払いが'}
              </p>
              <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                {isPositive ? '' : '+'}{formatCurrency(Math.abs(difference))}円
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {isPositive ? '下がります' : '上がります'}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-gray-500">現在</p>
                  <p className="text-lg font-bold">{formatCurrency(currentTotal)}円/月</p>
                </div>
                <div>
                  <p className="text-gray-500">新居</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(newTotal)}円/月</p>
                </div>
              </div>
            </div>

            {isPositive && (
              <div className="bg-white/70 p-3 rounded-lg text-sm text-gray-600">
                マイホームを購入しても、現在の住居費より月々{formatCurrency(difference)}円お得になります！
                年間で約{formatCurrency(difference * 12)}円の節約になります。
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
