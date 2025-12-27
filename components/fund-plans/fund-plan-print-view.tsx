'use client'

import { forwardRef } from 'react'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { formatCurrency } from '@/lib/fund-plan/calculations'
import { companyInfo, standardSpecifications, defaultRemarks } from '@/lib/fund-plan/master-data'

interface FundPlanPrintViewProps {
  data: FundPlanData
  calculation: FundPlanCalculation
}

export const FundPlanPrintView = forwardRef<HTMLDivElement, FundPlanPrintViewProps>(
  function FundPlanPrintView({ data, calculation }, ref) {
    return (
      <div
        ref={ref}
        className="bg-white p-8 text-[10px] leading-relaxed"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif",
        }}
      >
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">資金計画書</h1>
          <p className="text-base font-semibold">{data.teiName || '○○様邸'}</p>
        </div>

        {/* 基本情報 */}
        <div className="mb-6 pb-4 border-b">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500">工事名称: </span>
              <span className="font-medium">{data.constructionName || `${data.teiName}　新築工事`}</span>
            </div>
            <div>
              <span className="text-gray-500">建築場所: </span>
              <span className="font-medium">{data.constructionAddress || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">商品: </span>
              <span className="font-medium">{data.productType}</span>
            </div>
            <div>
              <span className="text-gray-500">施工面積: </span>
              <span className="font-medium">{data.constructionArea}坪</span>
            </div>
            <div>
              <span className="text-gray-500">階数: </span>
              <span className="font-medium">{data.floorCount}階</span>
            </div>
            <div>
              <span className="text-gray-500">防火区分: </span>
              <span className="font-medium">{data.fireProtectionZone}</span>
            </div>
          </div>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-2 gap-6">
          {/* 左カラム: 費用詳細 */}
          <div>
            {/* 建築費用 */}
            <div className="mb-4">
              <h2 className="text-xs font-bold bg-orange-100 px-2 py-1 mb-2">建築費用</h2>

              <table className="w-full text-[9px]">
                <tbody>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❶建物本体工事</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalBuildingMain)}円</td>
                  </tr>
                  <tr className="border-b text-gray-600">
                    <td className="py-0.5 pl-2" colSpan={2}>
                      {data.productType} × {data.constructionArea}坪 × {formatCurrency(data.pricePerTsubo)}円
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❷付帯工事費用A</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalIncidentalA)}円</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❸付帯工事費用B</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalIncidentalB)}円</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❹付帯工事費用C</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalIncidentalC)}円</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-1">最終建物工事費用（税抜）</td>
                    <td className="py-1 text-right">{formatCurrency(calculation.totalBuildingConstruction)}円</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-1">消費税（10%）</td>
                    <td className="py-1 text-right">{formatCurrency(calculation.consumptionTax)}円</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="py-1 font-bold text-orange-700">最終建物工事費用（税込）</td>
                    <td className="py-1 text-right font-bold text-orange-700">
                      {formatCurrency(calculation.totalBuildingConstructionWithTax)}円
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 諸費用・土地費用 */}
            <div className="mb-4">
              <h2 className="text-xs font-bold bg-blue-100 px-2 py-1 mb-2">諸費用・土地費用</h2>

              <table className="w-full text-[9px]">
                <tbody>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❺諸費用</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalMiscellaneous)}円</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium">❻土地費用</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(calculation.subtotalLand)}円</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 総合計 */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded text-center mb-4">
              <div className="text-[9px] opacity-90">最終合計（税込）</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.grandTotal)}円</div>
            </div>

            {/* 支払計画 */}
            <div className="mb-4">
              <h2 className="text-xs font-bold bg-purple-100 px-2 py-1 mb-2">支払計画</h2>

              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-1 text-left">項目</th>
                    <th className="py-1 text-right">支払金額</th>
                    <th className="py-1 text-right">自己資金</th>
                    <th className="py-1 text-right">銀行融資</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-0.5">土地購入費用</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">諸費用</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">建築申込金</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">契約金</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(1)</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">中間時金(2)</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.bankLoan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-0.5">最終金</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.totalAmount)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.selfFunding)}</td>
                    <td className="py-0.5 text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.bankLoan)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-1">合計</td>
                    <td className="py-1 text-right">{formatCurrency(calculation.paymentTotal)}</td>
                    <td className="py-1 text-right">{formatCurrency(calculation.selfFundingTotal)}</td>
                    <td className="py-1 text-right">{formatCurrency(calculation.bankLoanTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 右カラム: 借入計画・太陽光・仕様 */}
          <div>
            {/* 借入計画 */}
            <div className="mb-4">
              <h2 className="text-xs font-bold bg-green-100 px-2 py-1 mb-2">借入計画</h2>

              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-1 text-left">銀行</th>
                    <th className="py-1 text-right">借入額</th>
                    <th className="py-1 text-right">金利</th>
                    <th className="py-1 text-right">年数</th>
                    <th className="py-1 text-right">月々返済</th>
                  </tr>
                </thead>
                <tbody>
                  {data.loanPlan.bankA.amount > 0 && (
                    <tr className="border-b">
                      <td className="py-0.5">{data.loanPlan.bankA.bankName}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankA.amount)}</td>
                      <td className="py-0.5 text-right">{(data.loanPlan.bankA.interestRate * 100).toFixed(2)}%</td>
                      <td className="py-0.5 text-right">{data.loanPlan.bankA.loanYears}年</td>
                      <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentA)}</td>
                    </tr>
                  )}
                  {data.loanPlan.bankB.amount > 0 && (
                    <tr className="border-b">
                      <td className="py-0.5">{data.loanPlan.bankB.bankName}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankB.amount)}</td>
                      <td className="py-0.5 text-right">{(data.loanPlan.bankB.interestRate * 100).toFixed(2)}%</td>
                      <td className="py-0.5 text-right">{data.loanPlan.bankB.loanYears}年</td>
                      <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentB)}</td>
                    </tr>
                  )}
                  {data.loanPlan.bankC.amount > 0 && (
                    <tr className="border-b">
                      <td className="py-0.5">{data.loanPlan.bankC.bankName}</td>
                      <td className="py-0.5 text-right">{formatCurrency(data.loanPlan.bankC.amount)}</td>
                      <td className="py-0.5 text-right">{(data.loanPlan.bankC.interestRate * 100).toFixed(2)}%</td>
                      <td className="py-0.5 text-right">{data.loanPlan.bankC.loanYears}年</td>
                      <td className="py-0.5 text-right font-bold">{formatCurrency(calculation.monthlyPaymentC)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="bg-blue-50 p-2 rounded mt-2 flex justify-between items-center">
                <span className="font-medium">月々返済額合計</span>
                <span className="text-base font-bold text-blue-700">{formatCurrency(calculation.totalMonthlyPayment)}円</span>
              </div>
            </div>

            {/* 太陽光経済効果 */}
            {data.incidentalCostB.solarPanelKw > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-bold bg-yellow-100 px-2 py-1 mb-2">太陽光発電経済効果</h2>

                <div className="text-[9px] space-y-1">
                  <div className="flex justify-between">
                    <span>太陽光パネル容量</span>
                    <span>{data.incidentalCostB.solarPanelKw} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>年間予測発電量</span>
                    <span>{formatCurrency(data.solarOnlyEffect.annualProduction)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>売電単価</span>
                    <span>{data.solarOnlyEffect.salePrice}円/kWh</span>
                  </div>
                </div>

                <div className="bg-green-50 p-2 rounded mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">トータル経済効果（月額）</span>
                    <span className="font-bold text-green-700">{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円</span>
                  </div>
                </div>
              </div>
            )}

            {/* 標準仕様 */}
            <div className="mb-4">
              <h2 className="text-xs font-bold bg-gray-100 px-2 py-1 mb-2">標準仕様</h2>

              <div className="grid grid-cols-2 gap-2 text-[8px]">
                <div>
                  <p className="font-semibold text-orange-600 mb-1">高性能</p>
                  <ul className="space-y-0.5 text-gray-600">
                    {standardSpecifications.highPerformance.slice(0, 4).map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-blue-600 mb-1">断熱・気密</p>
                  <ul className="space-y-0.5 text-gray-600">
                    {standardSpecifications.insulationAirtight.slice(0, 4).map((item, i) => (
                      <li key={i}>● {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 備考 */}
            {data.remarks && (
              <div className="mb-4">
                <h2 className="text-xs font-bold bg-gray-100 px-2 py-1 mb-2">備考</h2>
                <p className="text-[9px] whitespace-pre-wrap">{data.remarks}</p>
              </div>
            )}

            {/* 注意事項 */}
            <div className="mb-4 bg-amber-50 p-2 rounded border border-amber-200">
              <h3 className="text-[9px] font-bold text-amber-700 mb-1">重要な注意事項</h3>
              <ul className="text-[8px] text-amber-800 space-y-0.5">
                {defaultRemarks.map((remark, i) => (
                  <li key={i}>• {remark}</li>
                ))}
              </ul>
            </div>

            {/* 会社情報 */}
            <div className="border-t pt-3">
              <div className="font-bold text-[10px] mb-1">{companyInfo.name}</div>
              <div className="text-[9px] text-gray-600">
                〒{companyInfo.postalCode} {companyInfo.address}
              </div>
              <div className="mt-2 flex gap-4 text-[9px]">
                <div>
                  <span className="text-gray-500">担当者: </span>
                  <span className="font-medium">{data.salesRep || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">連絡先: </span>
                  <span>{data.salesRepPhone || '-'}</span>
                </div>
              </div>
              <div className="mt-2 text-[8px] text-gray-500">
                見積作成日: {data.estimateDate} / 見積有効期限: {data.estimateValidDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
