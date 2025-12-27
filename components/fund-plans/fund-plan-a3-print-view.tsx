'use client'

import { forwardRef } from 'react'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'
import { companyInfo, standardSpecifications, specificationNotes, defaultRemarks } from '@/lib/fund-plan/master-data'

interface FundPlanA3PrintViewProps {
  data: FundPlanData
  calculation: FundPlanCalculation
}

export const FundPlanA3PrintView = forwardRef<HTMLDivElement, FundPlanA3PrintViewProps>(
  function FundPlanA3PrintView({ data, calculation }, ref) {
    const hasBattery = data.incidentalCostB.storageBatteryType !== 'なし'

    // 現在の住居費合計
    const currentHousingTotal =
      data.currentHousingCost.rent +
      data.currentHousingCost.electricity +
      data.currentHousingCost.gasOil +
      data.currentHousingCost.parking

    // 実質光熱費（太陽光効果込み）
    const effectiveUtilityCost = Math.max(0, 16533 - data.solarOnlyEffect.monthlyTotalEffect)

    // 毎月のお支払い
    const monthlyPayment = calculation.totalMonthlyPayment + effectiveUtilityCost

    // つなぎ融資の利息計算
    const landBridgeMonthlyInterest = Math.round(data.bridgeLoan.landBridge.amount * data.bridgeLoan.landBridge.interestRate / 12)
    const landBridgeTotalInterest = Math.round(data.bridgeLoan.landBridge.amount * data.bridgeLoan.landBridge.interestRate * data.bridgeLoan.landBridge.months / 12)
    const constructionStartBridgeMonthlyInterest = Math.round(data.bridgeLoan.constructionStartBridge.amount * data.bridgeLoan.constructionStartBridge.interestRate / 12)
    const constructionStartBridgeTotalInterest = Math.round(data.bridgeLoan.constructionStartBridge.amount * data.bridgeLoan.constructionStartBridge.interestRate * data.bridgeLoan.constructionStartBridge.months / 12)
    const constructionInterimBridgeMonthlyInterest = Math.round(data.bridgeLoan.constructionInterimBridge.amount * data.bridgeLoan.constructionInterimBridge.interestRate / 12)
    const constructionInterimBridgeTotalInterest = Math.round(data.bridgeLoan.constructionInterimBridge.amount * data.bridgeLoan.constructionInterimBridge.interestRate * data.bridgeLoan.constructionInterimBridge.months / 12)

    // 太陽光パネルのみの経済効果計算
    const solarOnlyDailySale = data.solarOnlyEffect.dailySale
    const solarOnlyMonthlySale = solarOnlyDailySale * 365 / 12
    const solarOnlyMonthlyIncome4Years = solarOnlyMonthlySale * 24 // 24円/kWh
    const solarOnlyMonthlyIncome6Years = solarOnlyMonthlySale * 8.3 // 8.3円/kWh
    const _solarOnly10YearEffect = (solarOnlyMonthlyIncome4Years * 12 * 4) + (solarOnlyMonthlyIncome6Years * 12 * 6)

    // 太陽光+蓄電池の経済効果計算
    const solarBatteryDailySale = data.solarBatteryEffect.dailySale
    const solarBatteryMonthlySale = solarBatteryDailySale * 365 / 12
    const solarBatteryMonthlyIncome4Years = solarBatteryMonthlySale * 24
    const solarBatteryMonthlyIncome6Years = solarBatteryMonthlySale * 8.3
    const _solarBattery10YearEffect = (solarBatteryMonthlyIncome4Years * 12 * 4) + (solarBatteryMonthlyIncome6Years * 12 * 6)

    // 一般的な電気料金
    const averageElectricityCost = 16533

    return (
      <div
        ref={ref}
        className="bg-white text-[9px] leading-tight"
        style={{
          width: '420mm',
          height: '297mm',
          padding: '5mm',
          fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif",
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* ===== ヘッダー ===== */}
        <div className="flex justify-between items-start mb-2 pb-1 border-b-2 border-orange-500">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold">{data.teiName || '○○'}様邸 資金計画書</h1>
            <span className="text-sm font-bold text-orange-600 border border-orange-600 px-2 py-0.5">{data.productType}</span>
            <span className="text-[9px]">仕様</span>
          </div>
          <div className="text-right text-[8px] space-y-0.5">
            <div className="flex gap-4 justify-end">
              <span>工事名称: {data.constructionName || `${data.teiName}様邸　新築工事`}</span>
              <span>建築場所: {data.constructionAddress || '-'}</span>
            </div>
            <div className="flex gap-4 justify-end">
              <span>{data.fireProtectionZone}</span>
              <span>建物構造: {data.buildingStructure}</span>
              <span>施工面積: {data.constructionArea}坪</span>
              <span>{data.floorCount}階</span>
            </div>
            <div className="flex gap-4 justify-end">
              <span>見積作成日: {data.estimateDate}</span>
              <span>見積有効期限: {data.estimateValidDate}</span>
            </div>
          </div>
        </div>

        {/* ===== メインコンテンツ ===== */}
        <div className="flex gap-2" style={{ height: 'calc(100% - 18mm)' }}>
          {/* ===== 左カラム: 標準仕様 + 建築費用 + 諸費用・土地費用 ===== */}
          <div className="space-y-1" style={{ width: '38%' }}>
            {/* 標準仕様 */}
            <div className="border rounded p-1.5">
              <div className="text-[9px] font-bold mb-1 bg-gray-100 px-1.5 py-0.5">標準仕様</div>
              <div className="grid grid-cols-4 gap-1.5 text-[7px]">
                <div>
                  <p className="font-bold text-orange-600 mb-0.5">高性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.highPerformance.map((item, i) => (
                      <li key={i} className="break-words">● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-blue-600 mb-0.5">断熱・気密・快適性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.insulationAirtight.map((item, i) => (
                      <li key={i} className="break-words">● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-green-600 mb-0.5">耐久性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.durability.map((item, i) => (
                      <li key={i} className="break-words">● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-purple-600 mb-0.5">テクノロジー</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.technology.map((item, i) => (
                      <li key={i} className="break-words">● {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-[6px] text-gray-500 mt-0.5 border-t pt-0.5">
                {specificationNotes.map((note, i) => (
                  <div key={i} className="break-words">{note}</div>
                ))}
              </div>
            </div>

            {/* 建築費用 */}
            <div className="border rounded p-1.5">
              <div className="text-[9px] font-bold mb-1 bg-orange-100 px-1.5 py-0.5">建築費用</div>

              {/* ❶建物本体工事 */}
              <div className="mb-1 pb-1 border-b">
                <div className="flex justify-between text-[8px]">
                  <span className="font-bold">❶建物本体工事</span>
                  <span>小計①（税抜）<span className="font-bold ml-1">{formatCurrency(calculation.subtotalBuildingMain)}円</span></span>
                </div>
                <div className="text-[7px] text-gray-600 mt-0.5">
                  仕様: {data.productType} | 施工面積: {data.constructionArea}坪 × 坪単価: {formatCurrency(data.pricePerTsubo)}円 = {formatCurrency(calculation.subtotalBuildingMain)}円
                </div>
              </div>

              {/* ❷付帯工事費用A */}
              <div className="mb-1 pb-1 border-b">
                <div className="flex justify-between text-[8px]">
                  <span className="font-bold">❷付帯工事費用Ａ（建物本体工事以外にかかる費用）</span>
                  <span>小計②（税抜）<span className="font-bold ml-1">{formatCurrency(calculation.subtotalIncidentalA)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div className="flex justify-between"><span>確認申請費用</span><span>一式 {formatCurrency(data.incidentalCostA.confirmationApplicationFee)}</span></div>
                  <div className="flex justify-between"><span>屋外電気・給水・排水・雨水</span><span>一式 {formatCurrency(data.incidentalCostA.outdoorElectricWaterDrainageFee)}</span></div>
                  <div className="flex justify-between"><span>構造計算</span><span>一式 {formatCurrency(data.incidentalCostA.structuralCalculation)}</span></div>
                  <div className="flex justify-between"><span>瑕疵保険・地盤・シロアリ保証</span><span>一式 {formatCurrency(data.incidentalCostA.defectInsuranceGroundTermiteWarranty)}</span></div>
                  <div className="flex justify-between"><span>構造図作成費用</span><span>一式 {formatCurrency(data.incidentalCostA.structuralDrawingFee)}</span></div>
                  <div className="flex justify-between"><span>設計・工事監理費用</span><span>一式 {formatCurrency(data.incidentalCostA.designSupervisionFee)}</span></div>
                  <div className="flex justify-between"><span>BELS評価書申請費用</span><span>一式 {formatCurrency(data.incidentalCostA.belsApplicationFee)}</span></div>
                  <div className="flex justify-between"><span>安全対策費用</span><span>一式 {formatCurrency(data.incidentalCostA.safetyMeasuresFee)}</span></div>
                  <div className="flex justify-between"><span>長期優良住宅申請費用</span><span>一式 {formatCurrency(data.incidentalCostA.longTermHousingApplicationFee)}</span></div>
                  <div className="flex justify-between"><span>仮設工事費用（仮設電気等含む）</span><span>一式 {formatCurrency(data.incidentalCostA.temporaryConstructionFee)}</span></div>
                </div>
              </div>

              {/* ❸付帯工事費用B */}
              <div className="mb-1 pb-1 border-b">
                <div className="flex justify-between text-[8px]">
                  <span className="font-bold">❸付帯工事費用B（間取・オプションによって変わる費用）</span>
                  <span>小計③（税抜）<span className="font-bold ml-1">{formatCurrency(calculation.subtotalIncidentalB)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div className="flex justify-between"><span>太陽光 {data.incidentalCostB.solarPanelCount}枚 {data.incidentalCostB.solarPanelKw}kW</span><span>{formatCurrency(data.incidentalCostB.solarPanelCost)}</span></div>
                  <div className="flex justify-between"><span>3階建て差額(+40,000円/坪）</span><span>{data.floorCount === 3 ? `${data.constructionArea}坪 ${formatCurrency(data.constructionArea * 40000)}` : '0'}</span></div>
                  <div className="flex justify-between"><span>蓄電池 {data.incidentalCostB.storageBatteryType}</span><span>一式 {formatCurrency(data.incidentalCostB.storageBatteryCost)}</span></div>
                  <div className="flex justify-between"><span>屋根長さ割増</span><span>(仮) 要相談</span></div>
                  <div className="flex justify-between"><span>軒出・オーバーハング</span><span>{data.incidentalCostB.eaveOverhangArea}㎡ {formatCurrency(data.incidentalCostB.eaveOverhangCost)}</span></div>
                  <div className="flex justify-between"><span>30坪未満/以上割増</span><span>{data.constructionArea < 30 ? `${data.constructionArea}坪` : '0坪'} {formatCurrency(data.constructionArea < 30 ? (30 - data.constructionArea) * 50000 : 0)}</span></div>
                  <div className="flex justify-between"><span>下屋工事</span><span>{data.incidentalCostB.lowerRoofArea}㎡ {formatCurrency(data.incidentalCostB.lowerRoofCost)}</span></div>
                  <div className="flex justify-between"><span>照明器具費用</span><span>(仮) {formatCurrency(data.incidentalCostB.lightingCost)}</span></div>
                  <div className="flex justify-between"><span>バルコニー・吹抜工事</span><span>{data.incidentalCostB.balconyVoidArea}㎡ {formatCurrency(data.incidentalCostB.balconyVoidCost)}</span></div>
                  <div className="flex justify-between"><span>オプション工事</span><span>(仮) {formatCurrency(data.incidentalCostB.optionCost)}</span></div>
                </div>
              </div>

              {/* ❹付帯工事費用C */}
              <div className="mb-1 pb-1 border-b">
                <div className="flex justify-between text-[8px]">
                  <span className="font-bold">❹付帯工事費用C（土地によってかかる費用）</span>
                  <span>小計④（税抜）<span className="font-bold ml-1">{formatCurrency(calculation.subtotalIncidentalC)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div className="flex justify-between"><span>{data.fireProtectionZone}</span><span>(仮) {formatCurrency(data.incidentalCostC.fireProtectionCost)}</span></div>
                  <div className="flex justify-between"><span>狭小道路割増+㎥車指定</span><span>(仮) {formatCurrency(data.incidentalCostC.narrowRoadCubicExtra)}</span></div>
                  <div className="flex justify-between"><span>解体工事</span><span>(仮) {formatCurrency(data.incidentalCostC.demolitionCost)}</span></div>
                  <div className="flex justify-between"><span>深基礎割増</span><span>(仮) {formatCurrency(data.incidentalCostC.deepFoundationExtra)}</span></div>
                  <div className="flex justify-between"><span>各種申請管理費用</span><span>(仮) {formatCurrency(data.incidentalCostC.applicationManagementFee || 0)}</span></div>
                  <div className="flex justify-between"><span>高台割増</span><span>(仮) {data.incidentalCostC.elevationExtra > 0 ? formatCurrency(data.incidentalCostC.elevationExtra) : '要相談'}</span></div>
                  <div className="flex justify-between"><span>給排水引き込み工事</span><span>(仮) {formatCurrency(data.incidentalCostC.waterDrainageFee)}</span></div>
                  <div className="flex justify-between"><span>旗竿地</span><span>(仮) {formatCurrency(data.incidentalCostC.flagLotExtra || 0)}</span></div>
                  <div className="flex justify-between"><span>地盤改良工事</span><span>(仮) {formatCurrency(data.incidentalCostC.groundImprovementFee)}</span></div>
                  <div className="flex justify-between"><span>天空率 {data.incidentalCostC.skyFactorSides}面</span><span>(仮) {formatCurrency(data.incidentalCostC.skyFactorExtra)}</span></div>
                  <div className="flex justify-between"><span>残土処理工事</span><span>(仮) {formatCurrency(data.incidentalCostC.soilDisposalFee)}</span></div>
                  <div className="flex justify-between"><span>準耐火建築物</span><span>(仮) {formatCurrency(data.incidentalCostC.quasiFireproofExtra || 0)}</span></div>
                  <div className="flex justify-between"><span>電線防護管</span><span>(仮) {formatCurrency(data.incidentalCostC.electricProtectionPipe)}</span></div>
                  <div className="flex justify-between"><span>道路通行時間制限</span><span>(仮) {formatCurrency(data.incidentalCostC.roadTimeRestrictionExtra || 0)}</span></div>
                </div>
              </div>

              {/* 建築費用 合計 */}
              <div className="bg-gray-50 p-1.5 rounded text-[8px]">
                <div className="flex justify-between mb-0.5">
                  <span>最終建物工事費用（税抜）❶＋❷＋❸＋❹</span>
                  <span className="font-bold">{formatCurrency(calculation.totalBuildingConstruction)}円</span>
                </div>
                <div className="flex justify-between mb-0.5">
                  <span>消費税</span>
                  <span>{formatCurrency(calculation.consumptionTax)}円</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-orange-300 font-bold text-orange-700">
                  <span>最終建物工事費用（税込）❶＋❷＋❸＋❹</span>
                  <span>{formatCurrency(calculation.totalBuildingConstructionWithTax)}円</span>
                </div>
              </div>
            </div>

            {/* ❺諸費用 & ❻土地費用 */}
            <div className="grid grid-cols-2 gap-1">
              <div className="border rounded p-1.5">
                <div className="flex justify-between text-[8px] mb-0.5">
                  <span className="font-bold">❺諸費用</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalMiscellaneous)}円</span>
                </div>
                <div className="text-[6px] text-gray-500 mb-0.5">概算の金額となりますので、ご注意ください。</div>
                <div className="text-[6px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>建物登記費用</span><span>(仮) {formatCurrency(data.miscellaneousCosts.buildingRegistrationFee)}</span></div>
                  <div className="flex justify-between"><span>住宅ローン諸費用</span><span>(仮) {formatCurrency(data.miscellaneousCosts.housingLoanFee)}</span></div>
                  <div className="flex justify-between"><span>つなぎローン諸費用</span><span>(仮) {formatCurrency(data.miscellaneousCosts.bridgeLoanFee)}</span></div>
                  <div className="flex justify-between"><span>金消契約印紙代</span><span>(仮) {formatCurrency(data.miscellaneousCosts.loanContractStampDuty)}</span></div>
                  <div className="flex justify-between"><span>建物請負契約印紙代</span><span>{formatCurrency(data.miscellaneousCosts.constructionContractStampDuty)}</span></div>
                  <div className="flex justify-between"><span>火災保険料</span><span>(仮) {formatCurrency(data.miscellaneousCosts.fireInsurance)}</span></div>
                  <div className="flex justify-between"><span>先行工事（税込）</span><span>(仮) {formatCurrency(data.miscellaneousCosts.advanceConstruction)}</span></div>
                  <div className="flex justify-between"><span>外構工事（税込）</span><span>(仮) {formatCurrency(data.miscellaneousCosts.exteriorConstruction)}</span></div>
                  <div className="flex justify-between"><span>造作工事（税込）</span><span>(仮) {formatCurrency(data.miscellaneousCosts.customConstruction)}</span></div>
                </div>
              </div>
              <div className="border rounded p-1.5">
                <div className="flex justify-between text-[8px] mb-0.5">
                  <span className="font-bold">❻土地費用</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalLand)}円</span>
                </div>
                <div className="text-[6px] text-gray-500 mb-0.5">概算の金額となりますので、ご注意ください。</div>
                <div className="text-[6px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>土地売買代金</span><span>(仮) {formatCurrency(data.landCosts.landPrice)}</span></div>
                  <div className="flex justify-between"><span>固定資産税清算金</span><span>(仮) {formatCurrency(data.landCosts.propertyTaxSettlement)}</span></div>
                  <div className="flex justify-between"><span>土地売買契約印紙代</span><span>(仮) {formatCurrency(data.landCosts.landContractStampDuty)}</span></div>
                  <div className="flex justify-between"><span>土地仲介手数料</span><span>(仮) {formatCurrency(data.landCosts.brokerageFee)}</span></div>
                  <div className="flex justify-between"><span>土地登記費用</span><span>(仮) {formatCurrency(data.landCosts.landRegistrationFee)}</span></div>
                  <div className="flex justify-between"><span>滅失登記費用</span><span>(仮) {formatCurrency(data.landCosts.extinctionRegistrationFee)}</span></div>
                </div>
              </div>
            </div>

            {/* 最終合計 */}
            <div className="border rounded p-1.5 bg-orange-50">
              <div className="flex justify-between text-[8px] font-bold">
                <span>最終建物工事費用+諸費用+土地費用 合計（税込）❶＋❷＋❸＋❹＋❺＋❻</span>
                <span className="text-orange-700">{formatCurrency(calculation.grandTotal)}円</span>
              </div>
              <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
                <span>請負契約時の総額→ {formatCurrency(data.contractTotalAtSigning || 0)}円</span>
                <span>請負契約時からの差額→ {formatCurrency(calculation.grandTotal - (data.contractTotalAtSigning || 0))}円</span>
              </div>
            </div>

            {/* 会社情報 */}
            <div className="border rounded p-1.5 text-[7px]">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{companyInfo.name}</div>
                  <div className="text-gray-600">〒{companyInfo.postalCode} {companyInfo.address}</div>
                </div>
                <div className="text-right">
                  <div>担当者: <span className="font-medium">{data.salesRep || '-'}</span></div>
                  <div>連絡先: {data.salesRepPhone || '-'}</div>
                </div>
                <div className="text-right">
                  <div>担当者　所属長</div>
                  <div className="font-medium">{data.managerName || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 中央カラム: 支払計画 + 工程 + 借入計画 + つなぎ融資 ===== */}
          <div className="space-y-1" style={{ width: '32%' }}>
            {/* 支払計画 */}
            <div className="border rounded p-1.5">
              <div className="text-[9px] font-bold mb-1 bg-blue-100 px-1.5 py-0.5">支払計画</div>
              <table className="w-full text-[6px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-0.5 text-left"></th>
                    <th className="py-0.5 text-center">基準</th>
                    <th className="py-0.5 text-center">お客様</th>
                    <th className="py-0.5 text-center">支払日</th>
                    <th className="py-0.5 text-right">支払(A+B)</th>
                    <th className="py-0.5 text-right">自己(A)</th>
                    <th className="py-0.5 text-right">融資(B)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td colSpan={7} className="py-0.5 font-bold text-[7px]">工事請負金額以外</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">土地購入費用</td>
                    <td className="py-0.5 text-center">-</td>
                    <td className="py-0.5 text-center">-</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanOutside.landPurchase.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">諸費用</td>
                    <td className="py-0.5 text-center">-</td>
                    <td className="py-0.5 text-center">-</td>
                    <td className="py-0.5 text-center text-[4px]">契約・決済時</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-100">
                    <td colSpan={4} className="py-0.5 font-bold">工事請負代金以外合計</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(data.paymentPlanOutside.landPurchase.totalAmount + data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.selfFunding + data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.bankLoan + data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td colSpan={7} className="py-0.5 font-bold">工事請負金額</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建築申込金</td>
                    <td className="py-0.5 text-center">3万円</td>
                    <td className="py-0.5 text-center">3万円</td>
                    <td className="py-0.5 text-center text-[4px]">{data.paymentPlanConstruction.applicationFee.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">契約金</td>
                    <td className="py-0.5 text-center">10%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.contractFee.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[4px]">{data.paymentPlanConstruction.contractFee.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(1)</td>
                    <td className="py-0.5 text-center">30%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.interimPayment1.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[4px]">{data.paymentPlanConstruction.interimPayment1.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(2)</td>
                    <td className="py-0.5 text-center">30%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.interimPayment2.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[4px]">{data.paymentPlanConstruction.interimPayment2.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">最終金</td>
                    <td className="py-0.5 text-center">残代金</td>
                    <td className="py-0.5 text-center">残代金</td>
                    <td className="py-0.5 text-center text-[4px]">{data.paymentPlanConstruction.finalPayment.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-100">
                    <td colSpan={4} className="py-0.5 font-bold">工事請負代金合計</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.totalBuildingConstructionWithTax)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.selfFundingTotal - data.paymentPlanOutside.landPurchase.selfFunding - data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bankLoanTotal - data.paymentPlanOutside.landPurchase.bankLoan - data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="bg-orange-100 font-bold">
                    <td colSpan={4} className="py-0.5">支払合計</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.paymentTotal)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.selfFundingTotal)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bankLoanTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 借入計画 */}
            <div className="border rounded p-1">
              <div className="text-[7px] font-bold mb-0.5 bg-purple-100 px-1 py-0.5">借入計画</div>
              <table className="w-full text-[5px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-0.5 text-left"></th>
                    <th className="py-0.5 text-right">借入額</th>
                    <th className="py-0.5 text-right">金利</th>
                    <th className="py-0.5 text-center">固定/変動</th>
                    <th className="py-0.5 text-right">借入年数</th>
                    <th className="py-0.5 text-right">返済元金(毎月)</th>
                    <th className="py-0.5 text-right">返済元金(ボーナス)</th>
                    <th className="py-0.5 text-right">返済額(毎月)</th>
                    <th className="py-0.5 text-right">返済額(ボーナス)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-0.5">A銀行</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.amount)}</td>
                    <td className="py-0.5 text-right">{(data.loanPlan.bankA.interestRate * 100).toFixed(2)}%</td>
                    <td className="py-0.5 text-center">{data.loanPlan.bankA.rateType}</td>
                    <td className="py-0.5 text-right">{data.loanPlan.bankA.loanYears}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.principalMonthly)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.principalBonus)}</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentA)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentA)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">B銀行</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.amount)}</td>
                    <td className="py-0.5 text-right">{(data.loanPlan.bankB.interestRate * 100).toFixed(2)}%</td>
                    <td className="py-0.5 text-center">{data.loanPlan.bankB.rateType}</td>
                    <td className="py-0.5 text-right">{data.loanPlan.bankB.loanYears}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.principalMonthly)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.principalBonus)}</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentB)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentB)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">C銀行</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.amount)}</td>
                    <td className="py-0.5 text-right">{(data.loanPlan.bankC.interestRate * 100).toFixed(2)}%</td>
                    <td className="py-0.5 text-center">{data.loanPlan.bankC.rateType}</td>
                    <td className="py-0.5 text-right">{data.loanPlan.bankC.loanYears}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.principalMonthly)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.principalBonus)}</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentC)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentC)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* つなぎ融資 */}
            <div className="border rounded p-1">
              <div className="text-[7px] font-bold mb-0.5 bg-yellow-100 px-1 py-0.5">つなぎ融資</div>
              <table className="w-full text-[5px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-0.5 text-left"></th>
                    <th className="py-0.5 text-right">借入額</th>
                    <th className="py-0.5 text-right">金利</th>
                    <th className="py-0.5 text-right">つなぎ予定期間</th>
                    <th className="py-0.5 text-right">つなぎ金利息(毎月)</th>
                    <th className="py-0.5 text-right">つなぎ金利息(期間合計)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-0.5">土地つなぎ</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.landBridge.amount)}</td>
                    <td className="py-0.5 text-right">{(data.bridgeLoan.landBridge.interestRate * 100).toFixed(1)}%</td>
                    <td className="py-0.5 text-right">{data.bridgeLoan.landBridge.months.toFixed(2)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(landBridgeMonthlyInterest)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(landBridgeTotalInterest)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建物着工つなぎ</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.constructionStartBridge.amount)}</td>
                    <td className="py-0.5 text-right">{(data.bridgeLoan.constructionStartBridge.interestRate * 100).toFixed(1)}%</td>
                    <td className="py-0.5 text-right">{data.bridgeLoan.constructionStartBridge.months.toFixed(2)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(constructionStartBridgeMonthlyInterest)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(constructionStartBridgeTotalInterest)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建物中間つなぎ</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.constructionInterimBridge.amount)}</td>
                    <td className="py-0.5 text-right">{(data.bridgeLoan.constructionInterimBridge.interestRate * 100).toFixed(1)}%</td>
                    <td className="py-0.5 text-right">{data.bridgeLoan.constructionInterimBridge.months.toFixed(2)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(constructionInterimBridgeMonthlyInterest)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(constructionInterimBridgeTotalInterest)}</td>
                  </tr>
                  <tr className="bg-yellow-50 font-bold">
                    <td className="py-0.5">つなぎ合計</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.landBridge.amount + data.bridgeLoan.constructionStartBridge.amount + data.bridgeLoan.constructionInterimBridge.amount)}</td>
                    <td colSpan={3}></td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bridgeLoanInterestTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 工程 */}
            <div className="border rounded p-1">
              <div className="text-[7px] font-bold mb-0.5 bg-green-100 px-1 py-0.5">工程</div>
              <div className="grid grid-cols-2 gap-x-2 text-[5px]">
                <div className="flex justify-between border-b py-0.5"><span>土地契約</span><span>{data.schedule.landContract || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>予定日</span><span></span></div>
                <div className="flex justify-between border-b py-0.5"><span>建物契約</span><span>{data.schedule.buildingContract || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>初回間取ヒアリング</span><span>{data.schedule.initialPlanHearing || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>土地決済</span><span>{data.schedule.landSettlement || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>間取確定</span><span>{data.schedule.planFinalized || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>仕様最終打合せ</span><span>{data.schedule.finalSpecMeeting || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>変更契約</span><span>{data.schedule.changeContract || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>着工</span><span>{data.schedule.constructionStart || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>上棟</span><span>{data.schedule.roofRaising || '-'}</span></div>
                <div className="flex justify-between border-b py-0.5"><span>竣工（完了検査）</span><span>{data.schedule.completion || '-'}</span></div>
                <div className="flex justify-between py-0.5"><span>最終金お支払い</span><span>{data.schedule.finalPaymentDate || '-'}</span></div>
              </div>
            </div>

            {/* 備考 */}
            <div className="border rounded p-1 bg-amber-50">
              <div className="text-[6px] font-bold mb-0.5">備考（必ずご確認をお願いします）</div>
              <ul className="text-[4px] text-gray-700 space-y-0.5">
                {defaultRemarks.map((remark, i) => (
                  <li key={i}>• {remark}</li>
                ))}
                {data.remarks && <li>• {data.remarks}</li>}
              </ul>
            </div>
          </div>

          {/* ===== 右カラム: 住居費比較 + 太陽光経済効果 + 注意事項 ===== */}
          <div className="space-y-1" style={{ width: '30%' }}>
            {/* 現在の住居費 & 新居の住居費 */}
            <div className="grid grid-cols-2 gap-1">
              <div className="border rounded p-1">
                <div className="text-[6px] font-bold mb-0.5 bg-gray-100 px-1 py-0.5">現在お支払いの住居費</div>
                <div className="text-[5px] space-y-0.5">
                  <div className="flex justify-between"><span>家賃</span><span>{formatCurrency(data.currentHousingCost.rent)}円</span></div>
                  <div className="flex justify-between"><span>＋ 電気代</span><span>{formatCurrency(data.currentHousingCost.electricity)}円</span></div>
                  <div className="flex justify-between"><span>＋ ガス・灯油代</span><span>{formatCurrency(data.currentHousingCost.gasOil)}円</span></div>
                  <div className="flex justify-between"><span>＋ 駐車場・その他</span><span>{formatCurrency(data.currentHousingCost.parking)}円</span></div>
                  <div className="flex justify-between pt-0.5 border-t font-bold"><span>＝ 合計</span><span>{formatCurrency(currentHousingTotal)}円</span></div>
                </div>
              </div>
              <div className="border rounded p-1">
                <div className="text-[6px] font-bold mb-0.5 bg-orange-100 px-1 py-0.5">新居の住居費</div>
                <div className="text-[5px] space-y-0.5">
                  <div className="flex justify-between"><span>月々の返済額</span><span>{formatCurrency(calculation.totalMonthlyPayment)}円</span></div>
                  <div className="flex justify-between"><span>＋ 実質支払い光熱費</span><span></span></div>
                  <div className="flex justify-between text-[4px] text-gray-500 pl-2"><span>太陽光パネルのみ</span><span>{formatCurrency(Math.round(data.solarOnlyEffect.monthlyTotalEffect * -1))}円</span></div>
                  <div className="flex justify-between pt-0.5 border-t font-bold text-orange-600"><span>＝ 毎月のお支払い</span><span>{formatCurrency(monthlyPayment)}円</span></div>
                </div>
              </div>
            </div>

            {/* 太陽光経済効果 */}
            <div className="border rounded p-1">
              <div className="grid grid-cols-2 gap-1">
                {/* 太陽光パネルのみ */}
                <div>
                  <div className="text-[6px] font-bold mb-0.5 bg-green-100 px-1 py-0.5">太陽光パネルのみ</div>
                  <div className="text-[4px] space-y-0.5">
                    <div className="flex justify-between"><span>太陽光パネル容量</span><span>{data.incidentalCostB.solarPanelKw}kW</span></div>
                    <div className="flex justify-between"><span>1kw当たりの予測発電量</span><span>1200kWh/年</span></div>
                    <div className="flex justify-between"><span>年間予測発電量</span><span>{formatCurrency(data.solarOnlyEffect.annualProduction)}kWh/年</span></div>
                    <div className="flex justify-between"><span>1日の予測発電量</span><span>{(data.solarOnlyEffect.annualProduction / 365).toFixed(2)}kWh/日</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>日中の消費電力</span><span>{data.solarOnlyEffect.dailyConsumption}kWh/日</span></div>
                    <div className="flex justify-between"><span>蓄電池への充電</span><span>{data.solarOnlyEffect.batteryCharge}kWh/日</span></div>
                    <div className="flex justify-between"><span>1日の売電量</span><span>{solarOnlyDailySale.toFixed(2)}kWh/日</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>1日の売電量×365日÷12ヶ月=</span><span>1ヶ月の売電量</span></div>
                    <div className="flex justify-between"><span>{solarOnlyDailySale.toFixed(2)}kWh/日</span><span>{solarOnlyMonthlySale.toFixed(2)}kWh/月</span></div>
                    <div className="flex justify-between"><span>×売電単価 24円 =</span><span>{formatCurrency(Math.round(solarOnlyMonthlyIncome4Years))}円/月</span></div>
                    <div className="flex justify-between text-gray-500"><span>×売電単価 8.3円 =</span><span>{formatCurrency(Math.round(solarOnlyMonthlyIncome6Years))}円/月</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>一般的な電気料金※</span><span>{formatCurrency(averageElectricityCost)}円/月</span></div>
                    <div className="flex justify-between"><span>－購入する電気料金</span><span>0円/月</span></div>
                    <div className="flex justify-between"><span>＝買わずに済んだ電気料金</span><span>{formatCurrency(averageElectricityCost)}円/月</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between font-bold text-green-600"><span>トータル経済効果</span><span>{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円/月</span></div>
                    <div className="flex justify-between text-[3px]"><span>各経済効果 ×12ヶ月×4年=</span><span>{formatCurrency(Math.round(solarOnlyMonthlyIncome4Years * 12 * 4))}円</span></div>
                    <div className="flex justify-between text-[3px]"><span>各経済効果 ×12ヶ月×6年=</span><span>{formatCurrency(Math.round(solarOnlyMonthlyIncome6Years * 12 * 6))}円</span></div>
                    <div className="flex justify-between font-bold"><span>トータル経済効果 (10年)</span><span>{formatCurrency(data.solarOnlyEffect.tenYearTotalEffect)}円</span></div>
                    <div className="flex justify-between"><span>利回り</span><span>{(data.solarOnlyEffect.returnRate * 100).toFixed(2)}%</span></div>
                  </div>
                </div>

                {/* 太陽光+蓄電池 */}
                <div>
                  <div className="text-[6px] font-bold mb-0.5 bg-blue-100 px-1 py-0.5">太陽光発電＆蓄電システム</div>
                  <div className="text-[4px] space-y-0.5">
                    <div className="flex justify-between"><span>太陽光パネル容量</span><span>{data.incidentalCostB.solarPanelKw}kW</span></div>
                    <div className="flex justify-between"><span>1kw当たりの予測発電量</span><span>1200kWh/年</span></div>
                    <div className="flex justify-between"><span>年間予測発電量</span><span>{formatCurrency(data.solarBatteryEffect.annualProduction)}kWh/年</span></div>
                    <div className="flex justify-between"><span>1日の予測発電量</span><span>{(data.solarBatteryEffect.annualProduction / 365).toFixed(2)}kWh/日</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>日中の消費電力</span><span>{data.solarBatteryEffect.dailyConsumption}kWh/日</span></div>
                    <div className="flex justify-between"><span>蓄電池への充電</span><span>{data.solarBatteryEffect.batteryCharge}kWh/日</span></div>
                    <div className="flex justify-between"><span>1日の売電量</span><span>{solarBatteryDailySale.toFixed(2)}kWh/日</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>1日の売電量×365日÷12ヶ月=</span><span>1ヶ月の売電量</span></div>
                    <div className="flex justify-between"><span>{solarBatteryDailySale.toFixed(2)}kWh/日</span><span>{solarBatteryMonthlySale.toFixed(2)}kWh/月</span></div>
                    <div className="flex justify-between"><span>×売電単価 24円 =</span><span>{formatCurrency(Math.round(solarBatteryMonthlyIncome4Years))}円/月</span></div>
                    <div className="flex justify-between text-gray-500"><span>×売電単価 8.3円 =</span><span>{formatCurrency(Math.round(solarBatteryMonthlyIncome6Years))}円/月</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between"><span>一般的な電気料金※</span><span>{formatCurrency(averageElectricityCost)}円/月</span></div>
                    <div className="flex justify-between"><span>－購入する電気料金</span><span>{formatCurrency(hasBattery ? 10000 : 0)}円/月</span></div>
                    <div className="flex justify-between"><span>＝買わずに済んだ電気料金</span><span>{formatCurrency(hasBattery ? 6533 : averageElectricityCost)}円/月</span></div>
                    <div className="border-t my-0.5"></div>
                    <div className="flex justify-between font-bold text-blue-600"><span>トータル経済効果</span><span>{formatCurrency(data.solarBatteryEffect.monthlyTotalEffect)}円/月</span></div>
                    <div className="flex justify-between text-[3px]"><span>各経済効果 ×12ヶ月×4年=</span><span>{formatCurrency(Math.round(solarBatteryMonthlyIncome4Years * 12 * 4))}円</span></div>
                    <div className="flex justify-between text-[3px]"><span>各経済効果 ×12ヶ月×6年=</span><span>{formatCurrency(Math.round(solarBatteryMonthlyIncome6Years * 12 * 6))}円</span></div>
                    <div className="flex justify-between font-bold"><span>トータル経済効果 (10年)</span><span>{formatCurrency(data.solarBatteryEffect.tenYearTotalEffect)}円</span></div>
                    <div className="flex justify-between"><span>利回り</span><span>{(data.solarBatteryEffect.returnRate * 100).toFixed(2)}%</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-0.5 text-[4px] text-gray-500 border-t pt-0.5">
                ※１ヶ月の消費電力を約460kWh/月→約13kWh/日、昼間の消費電力を5kWh夜の消費電力を10kWhとして試算<br />
                ※ 2025年10月以降の売電単価24円(10kw未満・変動10年（最初4年間24円、残り6年間8.3円）・税込)<br />
                ※平均電気代16,533円×夜（62.4%）として試算
              </div>
            </div>

            {/* 注意事項 */}
            <div className="border rounded p-1 text-[4px] text-gray-600">
              <div className="space-y-0.5">
                <p>※ 本資金計画は概算です。実際の費用は条件により変動します。</p>
                <p>※ 建築予定地の状況により、別途費用が発生する場合があります。</p>
                <p>※ 住宅ローンの金利・融資条件・借入可能額は、金融機関の審査により異なります。</p>
                <p>※ 固定資産税・登記費用などは概算であり、土地や建物の条件により変動します。</p>
                <p>※ 火災保険料は概算です。保険会社・申込時期・金融機関により異なる場合があります。</p>
                <p>※ 太陽光発電の予測発電量は、建築地・周辺環境・天候により変動します。</p>
                <p>※ 本見積金額の有効期限は提出日より1か月です。</p>
                <p className="mt-1">打合せの結果、計画が変更となった場合は、構造検討の結果により追加費用が発生する場合があります。</p>
                <p>地中障害物が判明した際の撤去費用は、本見積には含まれておりません。</p>
              </div>
            </div>

            {/* 最終合計（大きく表示） */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded text-center">
              <div className="text-[7px] opacity-90">最終合計（税込）</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.grandTotal)}円</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
