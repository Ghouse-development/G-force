'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CurrencyInput, NumberInput, DisplayValue, SubSectionTitle } from '../fund-plan-input'
import type { FundPlanData, StorageBatteryType } from '@/types/fund-plan'
import { storageBatteryTypes, storageBatteryPrices } from '@/lib/fund-plan/master-data'
import { formatCurrency } from '@/lib/fund-plan/calculations'

interface BuildingCostSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
  subtotals: {
    buildingMain: number
    incidentalA: number
    incidentalB: number
    incidentalC: number
    total: number
    tax: number
    totalWithTax: number
  }
}

export function BuildingCostSection({ data, onChange, subtotals }: BuildingCostSectionProps) {
  const updateIncidentalA = (key: keyof FundPlanData['incidentalCostA'], value: number) => {
    onChange({
      incidentalCostA: {
        ...data.incidentalCostA,
        [key]: value,
      },
    })
  }

  const updateIncidentalB = (key: keyof FundPlanData['incidentalCostB'], value: number | string) => {
    onChange({
      incidentalCostB: {
        ...data.incidentalCostB,
        [key]: value,
      },
    })
  }

  const updateIncidentalC = (updates: Partial<FundPlanData['incidentalCostC']>) => {
    onChange({
      incidentalCostC: {
        ...data.incidentalCostC,
        ...updates,
      },
    })
  }

  const handleSolarPanelChange = (count: number) => {
    const kw = Math.round(count * 0.465 * 100) / 100
    const cost = Math.round(kw * 209500)
    updateIncidentalB('solarPanelCount', count)
    onChange({
      incidentalCostB: {
        ...data.incidentalCostB,
        solarPanelCount: count,
        solarPanelKw: kw,
        solarPanelCost: cost,
      },
    })
  }

  const handleBatteryTypeChange = (type: StorageBatteryType) => {
    onChange({
      incidentalCostB: {
        ...data.incidentalCostB,
        storageBatteryType: type,
        storageBatteryCost: storageBatteryPrices[type],
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* ❶建物本体工事 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              1
            </span>
            建物本体工事
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>仕様: {data.productType}</span>
              <span>施工面積: {data.constructionArea}坪</span>
              <span>坪単価: {formatCurrency(data.pricePerTsubo)}円</span>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-orange-600">
                小計①（税抜）: {formatCurrency(subtotals.buildingMain)}円
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ❷付帯工事費用A */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              2
            </span>
            付帯工事費用A（建物本体工事以外にかかる費用）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="確認申請費用"
              value={data.incidentalCostA.confirmationApplicationFee}
              onChange={(v) => updateIncidentalA('confirmationApplicationFee', v)}
            />
            <CurrencyInput
              label="屋外電気・給水・排水・雨水工事"
              value={data.incidentalCostA.outdoorElectricWaterDrainageFee}
              onChange={(v) => updateIncidentalA('outdoorElectricWaterDrainageFee', v)}
            />
            <CurrencyInput
              label="構造計算"
              value={data.incidentalCostA.structuralCalculation}
              onChange={(v) => updateIncidentalA('structuralCalculation', v)}
            />
            <CurrencyInput
              label="瑕疵保険・地盤保証・シロアリ保証"
              value={data.incidentalCostA.defectInsuranceGroundTermiteWarranty}
              onChange={(v) => updateIncidentalA('defectInsuranceGroundTermiteWarranty', v)}
            />
            <CurrencyInput
              label="構造図作成費用"
              value={data.incidentalCostA.structuralDrawingFee}
              onChange={(v) => updateIncidentalA('structuralDrawingFee', v)}
            />
            <CurrencyInput
              label="設計・工事監理費用"
              value={data.incidentalCostA.designSupervisionFee}
              onChange={(v) => updateIncidentalA('designSupervisionFee', v)}
            />
            <CurrencyInput
              label="BELS評価書申請費用"
              value={data.incidentalCostA.belsApplicationFee}
              onChange={(v) => updateIncidentalA('belsApplicationFee', v)}
            />
            <CurrencyInput
              label="安全対策費用"
              value={data.incidentalCostA.safetyMeasuresFee}
              onChange={(v) => updateIncidentalA('safetyMeasuresFee', v)}
            />
            <CurrencyInput
              label="長期優良住宅申請費用"
              value={data.incidentalCostA.longTermHousingApplicationFee}
              onChange={(v) => updateIncidentalA('longTermHousingApplicationFee', v)}
            />
            <CurrencyInput
              label="仮設工事費用"
              value={data.incidentalCostA.temporaryConstructionFee}
              onChange={(v) => updateIncidentalA('temporaryConstructionFee', v)}
              note="仮設電気、仮設水道含む"
            />
          </div>
          <DisplayValue
            label="小計②（税抜）"
            value={subtotals.incidentalA}
            unit="円"
            highlight
          />
        </CardContent>
      </Card>

      {/* ❸付帯工事費用B */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              3
            </span>
            付帯工事費用B（間取・オプションによって変わる費用）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* 太陽光発電 */}
          <div className="space-y-2">
            <SubSectionTitle>太陽光発電システム</SubSectionTitle>
            <div className="grid grid-cols-4 gap-3">
              <NumberInput
                label="パネル枚数"
                value={data.incidentalCostB.solarPanelCount}
                onChange={handleSolarPanelChange}
                unit="枚"
              />
              <NumberInput
                label="出力"
                value={data.incidentalCostB.solarPanelKw}
                onChange={() => {}}
                unit="kW"
                disabled
              />
              <div className="col-span-2">
                <DisplayValue
                  label="太陽光発電システム費用"
                  value={data.incidentalCostB.solarPanelCost}
                  unit="円"
                />
              </div>
            </div>
          </div>

          {/* 蓄電池 */}
          <div className="space-y-2">
            <SubSectionTitle>蓄電池</SubSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">蓄電池タイプ</Label>
                <Select
                  value={data.incidentalCostB.storageBatteryType}
                  onValueChange={(v) => handleBatteryTypeChange(v as StorageBatteryType)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storageBatteryTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === 'なし' ? '蓄電池 設置なし' : `蓄電池 ${t}設置`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DisplayValue
                label="蓄電池費用"
                value={data.incidentalCostB.storageBatteryCost}
                unit="円"
              />
            </div>
          </div>

          {/* 工事オプション */}
          <div className="space-y-2">
            <SubSectionTitle>工事オプション</SubSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="軒出・オーバーハング面積"
                    value={data.incidentalCostB.eaveOverhangArea}
                    onChange={(v) => {
                      const cost = v * 42000
                      onChange({
                        incidentalCostB: {
                          ...data.incidentalCostB,
                          eaveOverhangArea: v,
                          eaveOverhangCost: cost,
                        },
                      })
                    }}
                    unit="㎡"
                  />
                  <DisplayValue label="費用（42,000円/㎡）" value={data.incidentalCostB.eaveOverhangCost} unit="円" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="下屋工事 面積"
                    value={data.incidentalCostB.lowerRoofArea}
                    onChange={(v) => {
                      const cost = v * 30000
                      onChange({
                        incidentalCostB: {
                          ...data.incidentalCostB,
                          lowerRoofArea: v,
                          lowerRoofCost: cost,
                        },
                      })
                    }}
                    unit="㎡"
                  />
                  <DisplayValue label="費用（30,000円/㎡）" value={data.incidentalCostB.lowerRoofCost} unit="円" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="バルコニー・吹抜工事 面積"
                    value={data.incidentalCostB.balconyVoidArea}
                    onChange={(v) => {
                      const cost = v * 66000
                      onChange({
                        incidentalCostB: {
                          ...data.incidentalCostB,
                          balconyVoidArea: v,
                          balconyVoidCost: cost,
                        },
                      })
                    }}
                    unit="㎡"
                  />
                  <DisplayValue label="費用（66,000円/㎡）" value={data.incidentalCostB.balconyVoidCost} unit="円" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="3階建て差額 坪数"
                    value={data.incidentalCostB.threeStoryTsubo}
                    onChange={(v) => {
                      const cost = v * 40000
                      onChange({
                        incidentalCostB: {
                          ...data.incidentalCostB,
                          threeStoryTsubo: v,
                          threeStoryDifference: cost,
                        },
                      })
                    }}
                    unit="坪"
                  />
                  <DisplayValue label="差額（+40,000円/坪）" value={data.incidentalCostB.threeStoryDifference} unit="円" />
                </div>
                <CurrencyInput
                  label="屋根長さ割増"
                  value={data.incidentalCostB.roofLengthExtra}
                  onChange={(v) => updateIncidentalB('roofLengthExtra', v)}
                  provisional
                />
                <CurrencyInput
                  label="30坪未満/以上割増"
                  value={data.incidentalCostB.areaSizeExtra}
                  onChange={(v) => updateIncidentalB('areaSizeExtra', v)}
                  provisional
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="照明器具費用"
                value={data.incidentalCostB.lightingCost}
                onChange={(v) => updateIncidentalB('lightingCost', v)}
                provisional
              />
              <CurrencyInput
                label="オプション工事"
                value={data.incidentalCostB.optionCost}
                onChange={(v) => updateIncidentalB('optionCost', v)}
                provisional
              />
            </div>
          </div>
          <DisplayValue
            label="小計③（税抜）"
            value={subtotals.incidentalB}
            unit="円"
            highlight
          />
        </CardContent>
      </Card>

      {/* ❹付帯工事費用C */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              4
            </span>
            付帯工事費用C（土地によってかかる費用）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="防火地域/準防火地域追加費用"
              value={data.incidentalCostC.fireProtectionCost}
              onChange={(v) => updateIncidentalC({ fireProtectionCost: v })}
              provisional
            />
            <CurrencyInput
              label="狭小道路割増+㎥車指定"
              value={data.incidentalCostC.narrowRoadCubicExtra}
              onChange={(v) => updateIncidentalC({ narrowRoadCubicExtra: v })}
              provisional
            />
            <CurrencyInput
              label="解体工事"
              value={data.incidentalCostC.demolitionCost}
              onChange={(v) => updateIncidentalC({ demolitionCost: v })}
              provisional
            />
            <CurrencyInput
              label="深基礎割増"
              value={data.incidentalCostC.deepFoundationExtra}
              onChange={(v) => updateIncidentalC({ deepFoundationExtra: v })}
              provisional
            />
            <CurrencyInput
              label="各種申請管理費用"
              value={data.incidentalCostC.applicationManagementFee}
              onChange={(v) => updateIncidentalC({ applicationManagementFee: v })}
              provisional
            />
            <CurrencyInput
              label="高台割増（高低差1000mm以上）"
              value={data.incidentalCostC.elevationExtra}
              onChange={(v) => updateIncidentalC({ elevationExtra: v })}
              provisional
            />
            <CurrencyInput
              label="給排水引き込み工事"
              value={data.incidentalCostC.waterDrainageFee}
              onChange={(v) => updateIncidentalC({ waterDrainageFee: v })}
              provisional
            />
            <CurrencyInput
              label="旗竿地追加費用"
              value={data.incidentalCostC.flagLotExtra}
              onChange={(v) => updateIncidentalC({ flagLotExtra: v })}
              provisional
            />
            <CurrencyInput
              label="地盤改良工事"
              value={data.incidentalCostC.groundImprovementFee}
              onChange={(v) => updateIncidentalC({ groundImprovementFee: v })}
              provisional
            />
            <CurrencyInput
              label="天空率（1面あたり50,000円）"
              value={data.incidentalCostC.skyFactorExtra}
              onChange={(v) => updateIncidentalC({ skyFactorExtra: v })}
              provisional
            />
            <CurrencyInput
              label="残土処理工事"
              value={data.incidentalCostC.soilDisposalFee}
              onChange={(v) => updateIncidentalC({ soilDisposalFee: v })}
              provisional
            />
            <CurrencyInput
              label="準耐火建築物追加費用"
              value={data.incidentalCostC.quasiFireproofExtra}
              onChange={(v) => updateIncidentalC({ quasiFireproofExtra: v })}
              provisional
            />
            <CurrencyInput
              label="電線防護管設置費"
              value={data.incidentalCostC.electricProtectionPipe}
              onChange={(v) => updateIncidentalC({ electricProtectionPipe: v })}
              provisional
            />
            <CurrencyInput
              label="道路通行時間制限追加費用"
              value={data.incidentalCostC.roadTimeRestrictionExtra}
              onChange={(v) => updateIncidentalC({ roadTimeRestrictionExtra: v })}
              provisional
            />
          </div>
          <DisplayValue
            label="小計④（税抜）"
            value={subtotals.incidentalC}
            unit="円"
            highlight
          />
        </CardContent>
      </Card>

      {/* 合計表示 */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="py-4 px-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">最終建物工事費用（税抜）❶+❷+❸+❹</span>
              <span className="font-bold">{formatCurrency(subtotals.total)}円</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">消費税（10%）</span>
              <span className="font-bold">{formatCurrency(subtotals.tax)}円</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-orange-300">
              <span className="font-bold text-orange-700">最終建物工事費用（税込）</span>
              <span className="text-xl font-bold text-orange-700">{formatCurrency(subtotals.totalWithTax)}円</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
