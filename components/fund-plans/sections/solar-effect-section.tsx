'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberInput, CurrencyInput, DisplayValue, SubSectionTitle } from '../fund-plan-input'
import type { FundPlanData, SolarEconomyCalculation } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'

interface SolarEffectSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
}

export function SolarEffectSection({ data, onChange }: SolarEffectSectionProps) {
  const updateSolarOnlyEffect = (updates: Partial<SolarEconomyCalculation>) => {
    onChange({
      solarOnlyEffect: {
        ...data.solarOnlyEffect,
        ...updates,
      },
    })
  }

  const updateSolarBatteryEffect = (updates: Partial<SolarEconomyCalculation>) => {
    onChange({
      solarBatteryEffect: {
        ...data.solarBatteryEffect,
        ...updates,
      },
    })
  }

  // 太陽光パネルの情報
  const panelKw = data.incidentalCostB.solarPanelKw
  const panelCost = data.incidentalCostB.solarPanelCost
  const hasBattery = data.incidentalCostB.storageBatteryType !== 'なし'
  const batteryCost = data.incidentalCostB.storageBatteryCost

  return (
    <div className="space-y-4">
      {/* 太陽光パネルのみの経済効果 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
              太陽光のみ
            </span>
            太陽光発電システム 経済効果
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* 発電量計算 */}
          <div className="space-y-2">
            <SubSectionTitle>発電量計算</SubSectionTitle>
            <div className="grid grid-cols-4 gap-3">
              <DisplayValue
                label="太陽光パネル容量"
                value={`${panelKw} kW`}
              />
              <NumberInput
                label="1kWあたり年間発電量"
                value={data.solarOnlyEffect.annualProductionPerKw}
                onChange={(v) => {
                  const annualProduction = Math.round(panelKw * v)
                  const dailyProduction = Math.round((annualProduction / 365) * 100) / 100
                  updateSolarOnlyEffect({
                    annualProductionPerKw: v,
                    annualProduction,
                    dailyProduction,
                  })
                }}
                unit="kWh"
              />
              <DisplayValue
                label="年間予測発電量"
                value={`${formatCurrency(data.solarOnlyEffect.annualProduction)} kWh`}
              />
              <DisplayValue
                label="1日の予測発電量"
                value={`${data.solarOnlyEffect.dailyProduction} kWh`}
              />
            </div>
          </div>

          {/* 消費と売電 */}
          <div className="space-y-2">
            <SubSectionTitle>消費・売電計算</SubSectionTitle>
            <div className="grid grid-cols-4 gap-3">
              <NumberInput
                label="日中の消費電力"
                value={data.solarOnlyEffect.dailyConsumption}
                onChange={(v) => {
                  const dailySale = Math.max(0, data.solarOnlyEffect.dailyProduction - v - data.solarOnlyEffect.batteryCharge)
                  const monthlySale = Math.round((dailySale * 365 / 12) * 100) / 100
                  const monthlySaleIncome = Math.round(monthlySale * data.solarOnlyEffect.salePrice)
                  updateSolarOnlyEffect({
                    dailyConsumption: v,
                    dailySale,
                    monthlySale,
                    monthlySaleIncome,
                  })
                }}
                unit="kWh"
                step={0.1}
              />
              <NumberInput
                label="蓄電池充電"
                value={data.solarOnlyEffect.batteryCharge}
                onChange={(v) => {
                  const dailySale = Math.max(0, data.solarOnlyEffect.dailyProduction - data.solarOnlyEffect.dailyConsumption - v)
                  const monthlySale = Math.round((dailySale * 365 / 12) * 100) / 100
                  const monthlySaleIncome = Math.round(monthlySale * data.solarOnlyEffect.salePrice)
                  updateSolarOnlyEffect({
                    batteryCharge: v,
                    dailySale,
                    monthlySale,
                    monthlySaleIncome,
                  })
                }}
                unit="kWh"
                step={0.1}
              />
              <DisplayValue
                label="1日の売電量"
                value={`${data.solarOnlyEffect.dailySale} kWh`}
              />
              <DisplayValue
                label="1ヶ月の売電量"
                value={`${data.solarOnlyEffect.monthlySale} kWh`}
              />
            </div>
          </div>

          {/* 経済効果 */}
          <div className="space-y-2">
            <SubSectionTitle>経済効果</SubSectionTitle>
            <div className="grid grid-cols-4 gap-3">
              <NumberInput
                label="売電単価"
                value={data.solarOnlyEffect.salePrice}
                onChange={(v) => {
                  const monthlySaleIncome = Math.round(data.solarOnlyEffect.monthlySale * v)
                  updateSolarOnlyEffect({
                    salePrice: v,
                    monthlySaleIncome,
                  })
                }}
                unit="円/kWh"
              />
              <DisplayValue
                label="1ヶ月の売電収入"
                value={data.solarOnlyEffect.monthlySaleIncome}
                unit="円"
              />
              <CurrencyInput
                label="トータル経済効果（月額）"
                value={data.solarOnlyEffect.monthlyTotalEffect}
                onChange={(v) => updateSolarOnlyEffect({ monthlyTotalEffect: v })}
              />
              <DisplayValue
                label="10年間のトータル効果"
                value={data.solarOnlyEffect.tenYearTotalEffect}
                unit="円"
              />
            </div>
          </div>

          {/* サマリー */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">太陽光パネル費用</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(panelCost)}円</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">月額経済効果</p>
                <p className="text-lg font-bold text-green-600">+{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">利回り</p>
                <p className="text-lg font-bold text-green-600">{(data.solarOnlyEffect.returnRate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 太陽光+蓄電池の経済効果 */}
      {hasBattery && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                太陽光+蓄電池
              </span>
              太陽光発電＆蓄電システム 経済効果
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* 発電量計算 */}
            <div className="space-y-2">
              <SubSectionTitle>発電量計算</SubSectionTitle>
              <div className="grid grid-cols-4 gap-3">
                <DisplayValue
                  label="太陽光パネル容量"
                  value={`${panelKw} kW`}
                />
                <NumberInput
                  label="1kWあたり年間発電量"
                  value={data.solarBatteryEffect.annualProductionPerKw}
                  onChange={(v) => {
                    const annualProduction = Math.round(panelKw * v)
                    const dailyProduction = Math.round((annualProduction / 365) * 100) / 100
                    updateSolarBatteryEffect({
                      annualProductionPerKw: v,
                      annualProduction,
                      dailyProduction,
                    })
                  }}
                  unit="kWh"
                />
                <DisplayValue
                  label="年間予測発電量"
                  value={`${formatCurrency(data.solarBatteryEffect.annualProduction)} kWh`}
                />
                <DisplayValue
                  label="1日の予測発電量"
                  value={`${data.solarBatteryEffect.dailyProduction} kWh`}
                />
              </div>
            </div>

            {/* 消費と売電 */}
            <div className="space-y-2">
              <SubSectionTitle>消費・売電計算（蓄電池あり）</SubSectionTitle>
              <div className="grid grid-cols-4 gap-3">
                <NumberInput
                  label="日中の消費電力"
                  value={data.solarBatteryEffect.dailyConsumption}
                  onChange={(v) => {
                    const dailySale = Math.max(0, data.solarBatteryEffect.dailyProduction - v)
                    const monthlySale = Math.round((dailySale * 365 / 12) * 100) / 100
                    const monthlySaleIncome = Math.round(monthlySale * data.solarBatteryEffect.salePrice)
                    updateSolarBatteryEffect({
                      dailyConsumption: v,
                      dailySale,
                      monthlySale,
                      monthlySaleIncome,
                    })
                  }}
                  unit="kWh"
                  step={0.1}
                />
                <DisplayValue
                  label="蓄電池による夜間消費削減"
                  value="夜間電力購入不要"
                />
                <DisplayValue
                  label="1日の売電量"
                  value={`${data.solarBatteryEffect.dailySale} kWh`}
                />
                <DisplayValue
                  label="1ヶ月の売電量"
                  value={`${data.solarBatteryEffect.monthlySale} kWh`}
                />
              </div>
            </div>

            {/* 経済効果 */}
            <div className="space-y-2">
              <SubSectionTitle>経済効果</SubSectionTitle>
              <div className="grid grid-cols-4 gap-3">
                <NumberInput
                  label="売電単価"
                  value={data.solarBatteryEffect.salePrice}
                  onChange={(v) => {
                    const monthlySaleIncome = Math.round(data.solarBatteryEffect.monthlySale * v)
                    updateSolarBatteryEffect({
                      salePrice: v,
                      monthlySaleIncome,
                    })
                  }}
                  unit="円/kWh"
                />
                <DisplayValue
                  label="1ヶ月の売電収入"
                  value={data.solarBatteryEffect.monthlySaleIncome}
                  unit="円"
                />
                <CurrencyInput
                  label="トータル経済効果（月額）"
                  value={data.solarBatteryEffect.monthlyTotalEffect}
                  onChange={(v) => updateSolarBatteryEffect({ monthlyTotalEffect: v })}
                />
                <DisplayValue
                  label="10年間のトータル効果"
                  value={data.solarBatteryEffect.tenYearTotalEffect}
                  unit="円"
                />
              </div>
            </div>

            {/* サマリー */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">太陽光パネル費用</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(panelCost)}円</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">蓄電池費用</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(batteryCost)}円</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">月額経済効果</p>
                  <p className="text-lg font-bold text-blue-600">+{formatCurrency(data.solarBatteryEffect.monthlyTotalEffect)}円</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">利回り</p>
                  <p className="text-lg font-bold text-blue-600">{(data.solarBatteryEffect.returnRate * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 経済効果比較 */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">経済効果まとめ</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">項目</th>
                  <th className="text-right py-2 px-3">太陽光のみ</th>
                  {hasBattery && <th className="text-right py-2 px-3">太陽光+蓄電池</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-600">初期費用</td>
                  <td className="text-right py-2 px-3 font-medium">{formatCurrency(panelCost)}円</td>
                  {hasBattery && (
                    <td className="text-right py-2 px-3 font-medium">{formatCurrency(panelCost + batteryCost)}円</td>
                  )}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-600">月額経済効果</td>
                  <td className="text-right py-2 px-3 font-medium text-green-600">
                    +{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円
                  </td>
                  {hasBattery && (
                    <td className="text-right py-2 px-3 font-medium text-blue-600">
                      +{formatCurrency(data.solarBatteryEffect.monthlyTotalEffect)}円
                    </td>
                  )}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-600">10年間効果</td>
                  <td className="text-right py-2 px-3 font-medium">
                    {formatCurrency(data.solarOnlyEffect.tenYearTotalEffect)}円
                  </td>
                  {hasBattery && (
                    <td className="text-right py-2 px-3 font-medium">
                      {formatCurrency(data.solarBatteryEffect.tenYearTotalEffect)}円
                    </td>
                  )}
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-600">利回り</td>
                  <td className="text-right py-2 px-3 font-bold text-green-600">
                    {(data.solarOnlyEffect.returnRate * 100).toFixed(2)}%
                  </td>
                  {hasBattery && (
                    <td className="text-right py-2 px-3 font-bold text-blue-600">
                      {(data.solarBatteryEffect.returnRate * 100).toFixed(2)}%
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
