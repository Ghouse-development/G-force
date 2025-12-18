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

    return (
      <div
        ref={ref}
        className="bg-white text-[8px] leading-tight"
        style={{
          width: '420mm',
          height: '297mm',
          padding: '8mm',
          fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-2 pb-2 border-b-2 border-orange-500">
          <div className="flex items-baseline gap-4">
            <h1 className="text-lg font-bold">{data.teiName || '○○様邸'} 資金計画書</h1>
            <span className="text-sm font-semibold text-orange-600">{data.productType}</span>
            <span className="text-xs">仕様</span>
          </div>
          <div className="text-right text-[7px]">
            <div>工事名称: {data.constructionName || `${data.teiName}　新築工事`}</div>
            <div>建築場所: {data.constructionAddress || '-'}</div>
            <div className="flex gap-4 justify-end">
              <span>{data.fireProtectionZone}</span>
              <span>{data.buildingStructure}</span>
              <span>施工面積: {data.constructionArea}坪</span>
              <span>{data.floorCount}階</span>
            </div>
            <div className="mt-1">
              <span>見積作成日: {data.estimateDate}</span>
              <span className="ml-4">見積有効期限: {data.estimateValidDate}</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ 3カラム */}
        <div className="flex gap-3" style={{ height: 'calc(100% - 30mm)' }}>
          {/* ===== 左カラム: 標準仕様 + 建築費用 ===== */}
          <div className="flex-1 space-y-2" style={{ maxWidth: '35%' }}>
            {/* 標準仕様 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-gray-100 px-1 py-0.5">標準仕様</div>
              <div className="grid grid-cols-4 gap-1 text-[6px]">
                <div>
                  <p className="font-semibold text-orange-600">高性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.highPerformance.map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">断熱・気密・快適性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.insulationAirtight.map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-600">耐久性能</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.durability.map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-purple-600">テクノロジー</p>
                  <ul className="space-y-0.5">
                    {standardSpecifications.technology.map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-[5px] text-gray-500 mt-1 border-t pt-1">
                {specificationNotes.map((note, i) => (
                  <div key={i}>{note}</div>
                ))}
              </div>
            </div>

            {/* 建築費用 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-orange-100 px-1 py-0.5">建築費用</div>

              {/* ❶建物本体工事 */}
              <div className="mb-1.5 pb-1 border-b">
                <div className="flex justify-between text-[7px]">
                  <span className="font-medium">❶建物本体工事</span>
                  <span>小計①（税抜）<span className="font-bold ml-2">{formatCurrency(calculation.subtotalBuildingMain)}円</span></span>
                </div>
                <div className="text-[6px] text-gray-600 mt-0.5">
                  仕様: {data.productType} | 施工面積: {data.constructionArea}坪 × 坪単価: {formatCurrency(data.pricePerTsubo)}円 = {formatCurrency(calculation.subtotalBuildingMain)}円
                </div>
              </div>

              {/* ❷付帯工事費用A */}
              <div className="mb-1.5 pb-1 border-b">
                <div className="flex justify-between text-[7px]">
                  <span className="font-medium">❷付帯工事費用Ａ（建物本体工事以外にかかる費用）</span>
                  <span>小計②（税抜）<span className="font-bold ml-2">{formatCurrency(calculation.subtotalIncidentalA)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div>確認申請費用: {formatCurrency(data.incidentalCostA.confirmationApplicationFee)}</div>
                  <div>屋外電気・給水・排水・雨水工事: {formatCurrency(data.incidentalCostA.outdoorElectricWaterDrainageFee)}</div>
                  <div>構造計算: {formatCurrency(data.incidentalCostA.structuralCalculation)}</div>
                  <div>瑕疵保険・地盤保証・シロアリ保証: {formatCurrency(data.incidentalCostA.defectInsuranceGroundTermiteWarranty)}</div>
                  <div>構造図作成費用: {formatCurrency(data.incidentalCostA.structuralDrawingFee)}</div>
                  <div>設計・工事監理費用: {formatCurrency(data.incidentalCostA.designSupervisionFee)}</div>
                  <div>BELS評価書申請費用: {formatCurrency(data.incidentalCostA.belsApplicationFee)}</div>
                  <div>安全対策費用: {formatCurrency(data.incidentalCostA.safetyMeasuresFee)}</div>
                  <div>長期優良住宅申請費用: {formatCurrency(data.incidentalCostA.longTermHousingApplicationFee)}</div>
                  <div>仮設工事費用: {formatCurrency(data.incidentalCostA.temporaryConstructionFee)}</div>
                </div>
              </div>

              {/* ❸付帯工事費用B */}
              <div className="mb-1.5 pb-1 border-b">
                <div className="flex justify-between text-[7px]">
                  <span className="font-medium">❸付帯工事費用B（間取・オプションによって変わる費用）</span>
                  <span>小計③（税抜）<span className="font-bold ml-2">{formatCurrency(calculation.subtotalIncidentalB)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div>太陽光発電システム {data.incidentalCostB.solarPanelCount}枚 {data.incidentalCostB.solarPanelKw}kW: {formatCurrency(data.incidentalCostB.solarPanelCost)}</div>
                  <div>蓄電池 {data.incidentalCostB.storageBatteryType}: {formatCurrency(data.incidentalCostB.storageBatteryCost)}</div>
                  {data.incidentalCostB.eaveOverhangArea > 0 && <div>軒出・オーバーハング工事: {formatCurrency(data.incidentalCostB.eaveOverhangCost)}</div>}
                  {data.incidentalCostB.lowerRoofArea > 0 && <div>下屋工事: {formatCurrency(data.incidentalCostB.lowerRoofCost)}</div>}
                  {data.incidentalCostB.balconyVoidArea > 0 && <div>バルコニー・吹抜工事: {formatCurrency(data.incidentalCostB.balconyVoidCost)}</div>}
                  <div>照明器具費用: {formatCurrency(data.incidentalCostB.lightingCost)} (仮)</div>
                  <div>オプション工事: {formatCurrency(data.incidentalCostB.optionCost)} (仮)</div>
                </div>
              </div>

              {/* ❹付帯工事費用C */}
              <div className="mb-1.5 pb-1 border-b">
                <div className="flex justify-between text-[7px]">
                  <span className="font-medium">❹付帯工事費用C（土地によってかかる費用）</span>
                  <span>小計④（税抜）<span className="font-bold ml-2">{formatCurrency(calculation.subtotalIncidentalC)}円</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[6px] text-gray-600 mt-0.5">
                  <div>{data.fireProtectionZone}: {formatCurrency(data.incidentalCostC.fireProtectionCost)} (仮)</div>
                  <div>狭小道路割増: {formatCurrency(data.incidentalCostC.narrowRoadCubicExtra)} (仮)</div>
                  <div>解体工事: {formatCurrency(data.incidentalCostC.demolitionCost)} (仮)</div>
                  <div>深基礎割増: {formatCurrency(data.incidentalCostC.deepFoundationExtra)} (仮)</div>
                  <div>給排水引き込み工事: {formatCurrency(data.incidentalCostC.waterDrainageFee)} (仮)</div>
                  <div>高台割増: {formatCurrency(data.incidentalCostC.elevationExtra)} (仮)</div>
                  <div>地盤改良工事: {formatCurrency(data.incidentalCostC.groundImprovementFee)} (仮)</div>
                  <div>天空率 {data.incidentalCostC.skyFactorSides}面: {formatCurrency(data.incidentalCostC.skyFactorExtra)} (仮)</div>
                  <div>残土処理工事: {formatCurrency(data.incidentalCostC.soilDisposalFee)} (仮)</div>
                  <div>電線防護管: {formatCurrency(data.incidentalCostC.electricProtectionPipe)} (仮)</div>
                </div>
              </div>

              {/* 建築費用 合計 */}
              <div className="bg-gray-50 p-1.5 rounded text-[7px]">
                <div className="flex justify-between mb-0.5">
                  <span>最終建物工事費用（税抜）❶＋❷＋❸＋❹</span>
                  <span className="font-bold">{formatCurrency(calculation.totalBuildingConstruction)}円</span>
                </div>
                <div className="flex justify-between mb-0.5">
                  <span>消費税</span>
                  <span>{formatCurrency(calculation.consumptionTax)}円</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-orange-300 font-bold text-orange-700">
                  <span>最終建物工事費用（税込）❶＋❷＋❸＋❹</span>
                  <span>{formatCurrency(calculation.totalBuildingConstructionWithTax)}円</span>
                </div>
              </div>
            </div>

            {/* ❺諸費用 & ❻土地費用 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-1.5">
                <div className="flex justify-between text-[7px] mb-1">
                  <span className="font-medium">❺諸費用</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalMiscellaneous)}円</span>
                </div>
                <div className="text-[5px] text-gray-500 mb-1">概算の金額となりますので、ご注意ください。</div>
                <div className="text-[6px] text-gray-600 space-y-0.5">
                  <div>建物登記費用: {formatCurrency(data.miscellaneousCosts.buildingRegistrationFee)} (仮)</div>
                  <div>住宅ローン諸費用: {formatCurrency(data.miscellaneousCosts.housingLoanFee)} (仮)</div>
                  <div>つなぎローン諸費用: {formatCurrency(data.miscellaneousCosts.bridgeLoanFee)} (仮)</div>
                  <div>金銭消費貸借契約印紙代: {formatCurrency(data.miscellaneousCosts.loanContractStampDuty)} (仮)</div>
                  <div>建物請負工事契約印紙代: {formatCurrency(data.miscellaneousCosts.constructionContractStampDuty)}</div>
                  <div>火災保険料: {formatCurrency(data.miscellaneousCosts.fireInsurance)} (仮)</div>
                  <div>先行工事: {formatCurrency(data.miscellaneousCosts.advanceConstruction)} (仮)</div>
                  <div>外構工事: {formatCurrency(data.miscellaneousCosts.exteriorConstruction)} (仮)</div>
                  <div>造作工事: {formatCurrency(data.miscellaneousCosts.customConstruction)} (仮)</div>
                </div>
              </div>
              <div className="border rounded p-1.5">
                <div className="flex justify-between text-[7px] mb-1">
                  <span className="font-medium">❻土地費用</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalLand)}円</span>
                </div>
                <div className="text-[5px] text-gray-500 mb-1">概算の金額となりますので、ご注意ください。</div>
                <div className="text-[6px] text-gray-600 space-y-0.5">
                  <div>土地売買代金: {formatCurrency(data.landCosts.landPrice)} (仮)</div>
                  <div>固定資産税清算金: {formatCurrency(data.landCosts.propertyTaxSettlement)} (仮)</div>
                  <div>土地売買契約印紙代: {formatCurrency(data.landCosts.landContractStampDuty)} (仮)</div>
                  <div>土地仲介手数料: {formatCurrency(data.landCosts.brokerageFee)} (仮)</div>
                  <div>土地登記費用: {formatCurrency(data.landCosts.landRegistrationFee)} (仮)</div>
                  <div>滅失登記費用: {formatCurrency(data.landCosts.extinctionRegistrationFee)} (仮)</div>
                </div>
              </div>
            </div>

            {/* 会社情報 */}
            <div className="border rounded p-1.5 text-[6px]">
              <div className="font-bold">{companyInfo.name}</div>
              <div className="text-gray-600">〒{companyInfo.postalCode} {companyInfo.address}</div>
              <div className="mt-1 grid grid-cols-2">
                <div>担当者: <span className="font-medium">{data.salesRep || '-'}</span></div>
                <div>所属長: <span className="font-medium">{data.managerName || '-'}</span></div>
              </div>
            </div>
          </div>

          {/* ===== 中央カラム: 支払計画 + 工程 + 備考 ===== */}
          <div className="flex-1 space-y-2" style={{ maxWidth: '30%' }}>
            {/* 支払計画 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-blue-100 px-1 py-0.5">支払計画</div>

              <table className="w-full text-[6px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-0.5 text-left"></th>
                    <th className="py-0.5 text-center">基準</th>
                    <th className="py-0.5 text-center">お客様</th>
                    <th className="py-0.5 text-center">支払予定日</th>
                    <th className="py-0.5 text-right">支払金額(A+B)</th>
                    <th className="py-0.5 text-right">自己資金(A)</th>
                    <th className="py-0.5 text-right">銀行融資(B)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td colSpan={7} className="py-0.5 font-medium">工事請負金額以外</td>
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
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanOutside.miscellaneous.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-100">
                    <td colSpan={4} className="py-0.5 font-medium">工事請負代金以外合計</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(data.paymentPlanOutside.landPurchase.totalAmount + data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.selfFunding + data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.bankLoan + data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td colSpan={7} className="py-0.5 font-medium">工事請負金額</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建築申込金</td>
                    <td className="py-0.5 text-center">3万円</td>
                    <td className="py-0.5 text-center">3万円</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanConstruction.applicationFee.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">契約金</td>
                    <td className="py-0.5 text-center">10%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.contractFee.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanConstruction.contractFee.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(1)</td>
                    <td className="py-0.5 text-center">30%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.interimPayment1.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanConstruction.interimPayment1.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(2)</td>
                    <td className="py-0.5 text-center">30%</td>
                    <td className="py-0.5 text-center">{(data.paymentPlanConstruction.interimPayment2.standardRate * 100).toFixed(0)}%</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanConstruction.interimPayment2.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">最終金</td>
                    <td className="py-0.5 text-center">残代金</td>
                    <td className="py-0.5 text-center">残代金</td>
                    <td className="py-0.5 text-center text-[5px]">{data.paymentPlanConstruction.finalPayment.paymentDate || '-'}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.bankLoan)}</td>
                  </tr>
                  <tr className="border-b bg-gray-100">
                    <td colSpan={4} className="py-0.5 font-medium">工事請負代金合計</td>
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

            {/* 工程 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-green-100 px-1 py-0.5">工程</div>
              <div className="grid grid-cols-2 gap-x-4 text-[6px]">
                <div className="flex justify-between border-b py-0.5">
                  <span>土地契約</span>
                  <span>{data.schedule.landContract || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>建物契約</span>
                  <span>{data.schedule.buildingContract || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>初回間取ヒアリング</span>
                  <span>{data.schedule.initialPlanHearing || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>土地決済</span>
                  <span>{data.schedule.landSettlement || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>間取確定</span>
                  <span>{data.schedule.planFinalized || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>仕様最終打合せ</span>
                  <span>{data.schedule.finalSpecMeeting || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>変更契約</span>
                  <span>{data.schedule.changeContract || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>着工</span>
                  <span>{data.schedule.constructionStart || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>上棟</span>
                  <span>{data.schedule.roofRaising || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-0.5">
                  <span>竣工（完了検査）</span>
                  <span>{data.schedule.completion || '-'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>最終金お支払い</span>
                  <span>{data.schedule.finalPaymentDate || '-'}</span>
                </div>
              </div>
            </div>

            {/* 備考 */}
            <div className="border rounded p-1.5 bg-amber-50">
              <div className="text-[7px] font-bold mb-1">備考（必ずご確認をお願いします）</div>
              <ul className="text-[5px] text-gray-700 space-y-0.5">
                {defaultRemarks.map((remark, i) => (
                  <li key={i}>• {remark}</li>
                ))}
                {data.remarks && <li>• {data.remarks}</li>}
              </ul>
            </div>

            {/* 注意事項 */}
            <div className="border rounded p-1.5 text-[5px] text-gray-600">
              <div className="space-y-0.5">
                <p>※ 本資金計画は概算です。実際の費用は条件により変動します。</p>
                <p>※ 建築予定地の状況により、別途費用が発生する場合があります。</p>
                <p>※ 住宅ローンの金利・融資条件・借入可能額は、金融機関の審査により異なります。</p>
                <p>※ 固定資産税・登記費用などは概算であり、土地や建物の条件により変動します。</p>
                <p>※ 火災保険料は概算です。保険会社・申込時期・金融機関により異なる場合があります。</p>
                <p>※ 太陽光発電の予測発電量は、建築地・周辺環境・天候により変動します。</p>
                <p>※ 本見積金額の有効期限は提出日より1か月です。</p>
              </div>
            </div>
          </div>

          {/* ===== 右カラム: 借入計画 + 太陽光経済効果 ===== */}
          <div className="flex-1 space-y-2" style={{ maxWidth: '35%' }}>
            {/* 借入計画 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-purple-100 px-1 py-0.5">借入計画</div>
              <table className="w-full text-[6px]">
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
                    <td className="py-0.5">{data.loanPlan.bankA.bankName}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.amount)}</td>
                    <td className="py-0.5 text-right">{(data.loanPlan.bankA.interestRate * 100).toFixed(2)}%</td>
                    <td className="py-0.5 text-center">{data.loanPlan.bankA.rateType}</td>
                    <td className="py-0.5 text-right">{data.loanPlan.bankA.loanYears}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.principalMonthly)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.principalBonus)}</td>
                    <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentA)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentA)}</td>
                  </tr>
                  {data.loanPlan.bankB.amount > 0 && (
                    <tr className="border-b">
                      <td className="py-0.5">{data.loanPlan.bankB.bankName}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.amount)}</td>
                      <td className="py-0.5 text-right">{(data.loanPlan.bankB.interestRate * 100).toFixed(2)}%</td>
                      <td className="py-0.5 text-center">{data.loanPlan.bankB.rateType}</td>
                      <td className="py-0.5 text-right">{data.loanPlan.bankB.loanYears}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.principalMonthly)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.principalBonus)}</td>
                      <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentB)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentB)}</td>
                    </tr>
                  )}
                  {data.loanPlan.bankC.amount > 0 && (
                    <tr className="border-b">
                      <td className="py-0.5">{data.loanPlan.bankC.bankName}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.amount)}</td>
                      <td className="py-0.5 text-right">{(data.loanPlan.bankC.interestRate * 100).toFixed(2)}%</td>
                      <td className="py-0.5 text-center">{data.loanPlan.bankC.rateType}</td>
                      <td className="py-0.5 text-right">{data.loanPlan.bankC.loanYears}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.principalMonthly)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.principalBonus)}</td>
                      <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentC)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(calculation.bonusPaymentC)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* つなぎ融資 */}
            <div className="border rounded p-1.5">
              <div className="text-[7px] font-bold mb-1 bg-yellow-100 px-1 py-0.5">つなぎ融資</div>
              <table className="w-full text-[6px]">
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
                    <td className="py-0.5 text-right">{data.bridgeLoan.landBridge.months.toFixed(1)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.landBridge.amount * data.bridgeLoan.landBridge.interestRate / 12))}</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.landBridge.amount * data.bridgeLoan.landBridge.interestRate * data.bridgeLoan.landBridge.months / 12))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建物着工つなぎ</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.constructionStartBridge.amount)}</td>
                    <td className="py-0.5 text-right">{(data.bridgeLoan.constructionStartBridge.interestRate * 100).toFixed(1)}%</td>
                    <td className="py-0.5 text-right">{data.bridgeLoan.constructionStartBridge.months.toFixed(1)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.constructionStartBridge.amount * data.bridgeLoan.constructionStartBridge.interestRate / 12))}</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.constructionStartBridge.amount * data.bridgeLoan.constructionStartBridge.interestRate * data.bridgeLoan.constructionStartBridge.months / 12))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建物中間つなぎ</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.bridgeLoan.constructionInterimBridge.amount)}</td>
                    <td className="py-0.5 text-right">{(data.bridgeLoan.constructionInterimBridge.interestRate * 100).toFixed(1)}%</td>
                    <td className="py-0.5 text-right">{data.bridgeLoan.constructionInterimBridge.months.toFixed(1)}ヶ月</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.constructionInterimBridge.amount * data.bridgeLoan.constructionInterimBridge.interestRate / 12))}</td>
                    <td className="py-0.5 text-right">{formatCurrency(Math.round(data.bridgeLoan.constructionInterimBridge.amount * data.bridgeLoan.constructionInterimBridge.interestRate * data.bridgeLoan.constructionInterimBridge.months / 12))}</td>
                  </tr>
                  <tr className="bg-yellow-50 font-bold">
                    <td colSpan={5} className="py-0.5">つなぎ合計</td>
                    <td className="py-0.5 text-right">{formatCurrency(calculation.bridgeLoanInterestTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 現在の住居費 & 新居の住居費 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-1.5">
                <div className="text-[7px] font-bold mb-1">現在お支払いの住居費</div>
                <div className="text-[6px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>家賃</span>
                    <span>{formatCurrency(data.currentHousingCost.rent)}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>＋ 電気代</span>
                    <span>{formatCurrency(data.currentHousingCost.electricity)}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>＋ ガス・灯油代</span>
                    <span>{formatCurrency(data.currentHousingCost.gasOil)}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>＋ 駐車場・その他</span>
                    <span>{formatCurrency(data.currentHousingCost.parking)}円</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-bold">
                    <span>＝ 合計</span>
                    <span>{formatCurrency(currentHousingTotal)}円</span>
                  </div>
                </div>
              </div>
              <div className="border rounded p-1.5">
                <div className="text-[7px] font-bold mb-1">新居の住居費</div>
                <div className="text-[6px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>月々の返済額</span>
                    <span>{formatCurrency(calculation.totalMonthlyPayment)}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span>＋ 実質支払い光熱費</span>
                    <span>{formatCurrency(effectiveUtilityCost)}円</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-bold text-orange-600">
                    <span>＝ 毎月のお支払い</span>
                    <span>{formatCurrency(monthlyPayment)}円</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 太陽光経済効果 */}
            <div className="border rounded p-1.5">
              <div className="grid grid-cols-2 gap-2">
                {/* 太陽光パネルのみ */}
                <div>
                  <div className="text-[7px] font-bold mb-1 bg-green-100 px-1 py-0.5">太陽光パネルのみ</div>
                  <div className="text-[5px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>太陽光パネル容量</span>
                      <span>{data.incidentalCostB.solarPanelKw}kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>年間予測発電量</span>
                      <span>{formatCurrency(data.solarOnlyEffect.annualProduction)}kWh/年</span>
                    </div>
                    <div className="flex justify-between">
                      <span>日中の消費電力</span>
                      <span>{data.solarOnlyEffect.dailyConsumption}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>蓄電池への充電</span>
                      <span>{data.solarOnlyEffect.batteryCharge}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1日の売電量</span>
                      <span>{data.solarOnlyEffect.dailySale}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1ヶ月の売電量</span>
                      <span>{data.solarOnlyEffect.monthlySale.toFixed(1)}kWh/月</span>
                    </div>
                    <div className="flex justify-between">
                      <span>売電単価</span>
                      <span>{data.solarOnlyEffect.salePrice}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1ヶ月の売電収入</span>
                      <span>{formatCurrency(data.solarOnlyEffect.monthlySaleIncome)}円/月</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t font-bold text-green-600">
                      <span>トータル経済効果</span>
                      <span>{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円/月</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>10年間の効果</span>
                      <span>{formatCurrency(data.solarOnlyEffect.tenYearTotalEffect)}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>利回り</span>
                      <span>{(data.solarOnlyEffect.returnRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* 太陽光+蓄電池 */}
                <div>
                  <div className="text-[7px] font-bold mb-1 bg-blue-100 px-1 py-0.5">太陽光発電＆蓄電システム</div>
                  <div className="text-[5px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>太陽光パネル容量</span>
                      <span>{data.incidentalCostB.solarPanelKw}kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>年間予測発電量</span>
                      <span>{formatCurrency(data.solarBatteryEffect.annualProduction)}kWh/年</span>
                    </div>
                    <div className="flex justify-between">
                      <span>日中の消費電力</span>
                      <span>{data.solarBatteryEffect.dailyConsumption}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>蓄電池への充電</span>
                      <span>{data.solarBatteryEffect.batteryCharge}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1日の売電量</span>
                      <span>{data.solarBatteryEffect.dailySale}kWh/日</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1ヶ月の売電量</span>
                      <span>{data.solarBatteryEffect.monthlySale.toFixed(1)}kWh/月</span>
                    </div>
                    <div className="flex justify-between">
                      <span>売電単価</span>
                      <span>{data.solarBatteryEffect.salePrice}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1ヶ月の売電収入</span>
                      <span>{formatCurrency(data.solarBatteryEffect.monthlySaleIncome)}円/月</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t font-bold text-blue-600">
                      <span>トータル経済効果</span>
                      <span>{formatCurrency(data.solarBatteryEffect.monthlyTotalEffect)}円/月</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>10年間の効果</span>
                      <span>{formatCurrency(data.solarBatteryEffect.tenYearTotalEffect)}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>利回り</span>
                      <span>{(data.solarBatteryEffect.returnRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1 text-[5px] text-gray-500 border-t pt-1">
                ※１ヶ月の消費電力を約460kWh/月→約13kWh/日、昼間の消費電力を5kWh夜の消費電力を10kWhとして試算<br />
                ※ 2025年10月以降の売電単価24円(10kw未満・変動10年（最初4年間24円、残り6年間8.3円）・税込)
              </div>
            </div>

            {/* 最終合計 */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded text-center">
              <div className="text-[8px] opacity-90">最終合計（税込）</div>
              <div className="text-xl font-bold">{formatCurrency(calculation.grandTotal)}円</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
