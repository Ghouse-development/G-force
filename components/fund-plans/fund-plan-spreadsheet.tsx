'use client'

import { useState, useCallback, useMemo } from 'react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.min.css'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Download, Lock, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import type { FundPlanData, FundPlanCalculation, ProductType } from '@/types/fund-plan'
import { createDefaultFundPlanData } from '@/types/fund-plan'
import * as XLSX from 'xlsx'

// Register all Handsontable modules
registerAllModules()

// 商品マスタデータ
const PRODUCT_MASTER: { name: ProductType; pricePerTsubo: number }[] = [
  { name: 'LIFE', pricePerTsubo: 550000 },
  { name: 'LIFE +', pricePerTsubo: 600000 },
  { name: 'HOURS', pricePerTsubo: 650000 },
  { name: 'LACIE', pricePerTsubo: 700000 },
  { name: 'LIFE choose', pricePerTsubo: 520000 },
  { name: 'LIFE X(28～30坪)', pricePerTsubo: 580000 },
  { name: 'LIFE X(30～33坪)', pricePerTsubo: 570000 },
  { name: 'LIFE X(33～35坪)', pricePerTsubo: 560000 },
  { name: 'LIFE X(35～38坪)', pricePerTsubo: 550000 },
  { name: 'LIFE Limited', pricePerTsubo: 500000 },
  { name: 'LIFE+ Limited', pricePerTsubo: 530000 },
  { name: 'G-SMART平屋', pricePerTsubo: 620000 },
  { name: 'G-SMART平屋 Limited', pricePerTsubo: 580000 },
  { name: 'G-SMART平屋+', pricePerTsubo: 660000 },
  { name: 'G-SMART平屋+ Limited', pricePerTsubo: 620000 },
]

interface FundPlanSpreadsheetProps {
  initialData?: FundPlanData
  version?: number
  isLocked?: boolean
  lockType?: 'contract' | 'change_contract' | null
  onSave?: (data: FundPlanData) => void
  onExportExcel?: (data: FundPlanData) => void
}

// 金額フォーマット
function formatCurrency(value: number): string {
  if (!value && value !== 0) return ''
  return `¥${value.toLocaleString()}`
}

// 日付フォーマット（Excel形式の数値から日付へ）
function formatDate(excelDate: number | string | undefined): string {
  if (!excelDate) return ''
  if (typeof excelDate === 'string') return excelDate

  // Excelのシリアル値から日付に変換
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  return date.toLocaleDateString('ja-JP')
}

export function FundPlanSpreadsheet({
  initialData,
  version = 1,
  isLocked = false,
  lockType = null,
  onSave,
  onExportExcel,
}: FundPlanSpreadsheetProps) {
  const [data, setData] = useState<FundPlanData>(initialData || createDefaultFundPlanData())
  const [activeSheet, setActiveSheet] = useState('main')

  // 計算結果
  const calculation = useMemo((): FundPlanCalculation => {
    const d = data

    // 建物本体工事
    const subtotalBuildingMain = d.constructionArea * d.pricePerTsubo

    // 付帯工事A
    const subtotalIncidentalA = Object.values(d.incidentalCostA).reduce((sum, val) =>
      sum + (typeof val === 'number' ? val : 0), 0)

    // 付帯工事B（数値のみ）
    const subtotalIncidentalB = [
      d.incidentalCostB.solarPanelCost,
      d.incidentalCostB.storageBatteryCost,
      d.incidentalCostB.eaveOverhangCost,
      d.incidentalCostB.lowerRoofCost,
      d.incidentalCostB.balconyVoidCost,
      d.incidentalCostB.threeStoryDifference,
      d.incidentalCostB.roofLengthExtra,
      d.incidentalCostB.narrowRoadExtra,
      d.incidentalCostB.areaSizeExtra,
      d.incidentalCostB.lightingCost,
      d.incidentalCostB.optionCost,
    ].reduce((sum, val) => sum + (val || 0), 0)

    // 付帯工事C
    const subtotalIncidentalC = [
      d.incidentalCostC.fireProtectionCost,
      d.incidentalCostC.demolitionCost,
      d.incidentalCostC.applicationManagementFee,
      d.incidentalCostC.waterDrainageFee,
      d.incidentalCostC.groundImprovementFee,
      d.incidentalCostC.soilDisposalFee,
      d.incidentalCostC.electricProtectionPipe,
      d.incidentalCostC.narrowRoadCubicExtra,
      d.incidentalCostC.deepFoundationExtra,
      d.incidentalCostC.elevationExtra,
      d.incidentalCostC.flagLotExtra,
      d.incidentalCostC.skyFactorExtra,
      d.incidentalCostC.quasiFireproofExtra,
      d.incidentalCostC.roadTimeRestrictionExtra,
    ].reduce((sum, val) => sum + (val || 0), 0)

    // 諸費用
    const subtotalMiscellaneous = Object.values(d.miscellaneousCosts).reduce((sum, val) =>
      sum + (typeof val === 'number' ? val : 0), 0)

    // 土地費用
    const subtotalLand = Object.values(d.landCosts).reduce((sum, val) =>
      sum + (typeof val === 'number' ? val : 0), 0)

    // 建物工事費用合計
    const totalBuildingConstruction = subtotalBuildingMain + subtotalIncidentalA + subtotalIncidentalB + subtotalIncidentalC
    const consumptionTax = Math.floor(totalBuildingConstruction * 0.1)
    const totalBuildingConstructionWithTax = totalBuildingConstruction + consumptionTax

    // 工事請負金額以外
    const totalOutsideConstruction = subtotalLand + subtotalMiscellaneous

    // 支払合計
    const paymentTotal = totalBuildingConstructionWithTax + totalOutsideConstruction
    const selfFundingTotal = d.paymentPlanConstruction.applicationFee.selfFunding +
      d.paymentPlanConstruction.contractFee.selfFunding +
      d.paymentPlanConstruction.interimPayment1.selfFunding +
      d.paymentPlanConstruction.interimPayment2.selfFunding +
      d.paymentPlanConstruction.finalPayment.selfFunding
    const bankLoanTotal = paymentTotal - selfFundingTotal

    // 月々返済額（元利均等返済）
    const calculateMonthlyPayment = (principal: number, annualRate: number, years: number) => {
      if (principal <= 0 || years <= 0) return 0
      const monthlyRate = annualRate / 12
      const months = years * 12
      if (monthlyRate === 0) return principal / months
      return Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
    }

    const monthlyPaymentA = calculateMonthlyPayment(d.loanPlan.bankA.amount, d.loanPlan.bankA.interestRate, d.loanPlan.bankA.loanYears)
    const monthlyPaymentB = calculateMonthlyPayment(d.loanPlan.bankB.amount, d.loanPlan.bankB.interestRate, d.loanPlan.bankB.loanYears)
    const monthlyPaymentC = calculateMonthlyPayment(d.loanPlan.bankC.amount, d.loanPlan.bankC.interestRate, d.loanPlan.bankC.loanYears)

    // つなぎ利息
    const bridgeLoanInterestTotal =
      (d.bridgeLoan.landBridge.amount * d.bridgeLoan.landBridge.interestRate * d.bridgeLoan.landBridge.months / 12) +
      (d.bridgeLoan.constructionStartBridge.amount * d.bridgeLoan.constructionStartBridge.interestRate * d.bridgeLoan.constructionStartBridge.months / 12) +
      (d.bridgeLoan.constructionInterimBridge.amount * d.bridgeLoan.constructionInterimBridge.interestRate * d.bridgeLoan.constructionInterimBridge.months / 12)

    return {
      subtotalBuildingMain,
      subtotalIncidentalA,
      subtotalIncidentalB,
      subtotalIncidentalC,
      subtotalMiscellaneous,
      subtotalLand,
      totalBuildingConstruction,
      consumptionTax,
      totalBuildingConstructionWithTax,
      totalOutsideConstruction,
      paymentTotal,
      selfFundingTotal,
      bankLoanTotal,
      grandTotal: paymentTotal,
      differenceFromContract: paymentTotal - (d.contractTotalAtSigning || 0),
      monthlyPaymentA,
      monthlyPaymentB,
      monthlyPaymentC,
      totalMonthlyPayment: monthlyPaymentA + monthlyPaymentB + monthlyPaymentC,
      bonusPaymentA: 0,
      bonusPaymentB: 0,
      bonusPaymentC: 0,
      totalBonusPayment: 0,
      bridgeLoanInterestTotal,
      newMonthlyPayment: monthlyPaymentA + monthlyPaymentB + monthlyPaymentC,
      effectiveUtilityCost: d.solarOnlyEffect.monthlyTotalEffect * -1,
      totalNewMonthlyCost: monthlyPaymentA + monthlyPaymentB + monthlyPaymentC - d.solarOnlyEffect.monthlyTotalEffect,
    }
  }, [data])

  // メインシートのデータを生成
  const mainSheetData = useMemo(() => {
    const d = data
    const _c = calculation

    // Excel風のグリッドデータを生成
    // 各行は配列で、セル結合はHandsontableのmergeCellsで制御
    return [
      // Row 1: ヘッダー
      ['', '', '', '', '', `${d.teiName || '○○様'} 資金計画書`, '', '', '', '', '', '', '', d.productType, '', '', '', '', '', '', '', '', '', '', '仕様', '', '', '', '', '工事名称', '', '', '', '', '', '', '', `${d.teiName || '○○様'}邸　新築工事`],
      // Row 2: 空行
      [],
      // Row 3
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '見積有効期限：', '', '', '', '', '', formatDate(d.estimateValidDate)],
      // Row 4: 標準仕様
      ['標準仕様'],
      // Row 5: 空行
      [],
      // Row 6: 性能カテゴリヘッダー
      ['高性能', '', '', '', '', '', '', '', '', '', '断熱・気密・快適性能', '', '', '', '', '', '', '', '', '', '耐久性能', '', '', '', '', '', '', '', '', '', 'テクノロジー', '', '', '', '', '', '', '', '', '', '', '', '', '支払計画', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '基準', '', '', '', 'お客様', '', '', '', '支払予定日', '', '', '', '', '', '', '支払金額（A+B）', '', '', '', '', '', '', '自己資金（A)', '', '', '', '', '', '', '銀行融資（B)'],
      // Row 7: 空行
      [],
      // Row 8: 仕様詳細1
      ['●', '木造ハイブリッド工法', '', '', '', '', '', '', '', '', '●', 'ZEH仕様(BELS★★★★★)', '', '', '', '', '', '', '', '', '●', '二重防水構造', '', '', '', '', '', '', '', '', '●', '熱交換型第一種換気システム', '', '', '', '', '', '', '', '', '', '', '', '工事請負金額以外', '', '', '', '', '', '', '', '土地購入費用', '', '', '', '', '', '', '', '', '', '', '', '', formatDate(d.paymentPlanOutside.landPurchase.paymentDate), '', '', '', '', '', '', formatCurrency(d.paymentPlanOutside.landPurchase.totalAmount), '', '', '', '', '', '', formatCurrency(d.paymentPlanOutside.landPurchase.selfFunding), '', '', '', '', '', '', formatCurrency(d.paymentPlanOutside.landPurchase.bankLoan)],
      // Continue with more rows...
    ]
  }, [data, calculation])

  // Excel出力
  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new()

      // メインシート
      const mainWs = XLSX.utils.aoa_to_sheet(mainSheetData)
      XLSX.utils.book_append_sheet(wb, mainWs, '【資金計画書】')

      // 契約のご案内シート
      const contractGuideData = [
        ['', '', '', '', '', '', '', '', '', '', '', formatDate(data.schedule.buildingContract)],
        [],
        ['', `${data.customerName}　様`],
        [],
        [],
        ['', '', '建物請負工事契約のご案内'],
      ]
      const contractWs = XLSX.utils.aoa_to_sheet(contractGuideData)
      XLSX.utils.book_append_sheet(wb, contractWs, '契約のご案内（お客様用）')

      // 資金の流れシート
      const fundFlowData = [
        [],
        ['', '', `${data.customerName}様　資金の流れ`],
        [],
        ['', '支払段階', '支払日', '支払項目', '支払先', '支払金額', '', '当日必要資金', 'ローン', '必要自己資金', '手出し分 合計'],
      ]
      const fundFlowWs = XLSX.utils.aoa_to_sheet(fundFlowData)
      XLSX.utils.book_append_sheet(wb, fundFlowWs, '資金の流れ（LIFE・LIFE＋）')

      // マスタシート
      const masterData = PRODUCT_MASTER.map(p => [p.name, p.pricePerTsubo])
      const masterWs = XLSX.utils.aoa_to_sheet([['商品名', '坪単価'], ...masterData])
      XLSX.utils.book_append_sheet(wb, masterWs, 'マスタ')

      // ダウンロード
      XLSX.writeFile(wb, `${data.teiName || '資金計画書'}_v${version}.xlsx`)
      toast.success('Excelファイルを出力しました')

      if (onExportExcel) {
        onExportExcel(data)
      }
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Excel出力に失敗しました')
    }
  }, [data, mainSheetData, version, onExportExcel])

  // 保存
  const handleSave = useCallback(() => {
    if (isLocked) {
      toast.error('このバージョンはロックされているため編集できません')
      return
    }
    if (onSave) {
      onSave(data)
      toast.success('保存しました')
    }
  }, [data, isLocked, onSave])

  // 簡易的なスプレッドシート表示（メインシート）
  const renderMainSheet = () => {
    return (
      <div className="overflow-auto border rounded-lg bg-white" style={{ height: 'calc(100vh - 300px)' }}>
        <table className="min-w-full border-collapse text-xs">
          <tbody>
            {/* ヘッダー行 */}
            <tr className="bg-gray-100">
              <td colSpan={6} className="border p-2 font-bold text-lg text-center bg-gradient-to-r from-orange-100 to-yellow-100">
                {data.teiName || '○○様'} 資金計画書
              </td>
              <td colSpan={2} className="border p-2 text-center">
                <Badge variant="outline">{data.productType}</Badge>
              </td>
            </tr>

            {/* 基本情報セクション */}
            <tr className="bg-gray-50">
              <td className="border p-1 font-medium w-24">工事名称</td>
              <td colSpan={3} className="border p-1">
                <input
                  type="text"
                  value={data.constructionName || `${data.teiName || '○○様'}邸　新築工事`}
                  onChange={(e) => setData({ ...data, constructionName: e.target.value })}
                  className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1"
                  disabled={isLocked}
                />
              </td>
              <td className="border p-1 font-medium w-20">建築場所</td>
              <td colSpan={3} className="border p-1">
                <input
                  type="text"
                  value={data.constructionAddress}
                  onChange={(e) => setData({ ...data, constructionAddress: e.target.value })}
                  className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1"
                  disabled={isLocked}
                />
              </td>
            </tr>

            <tr>
              <td className="border p-1 font-medium">防火区分</td>
              <td className="border p-1">
                <select
                  value={data.fireProtectionZone}
                  onChange={(e) => setData({ ...data, fireProtectionZone: e.target.value as typeof data.fireProtectionZone })}
                  className="w-full border-0 bg-transparent focus:outline-none px-1"
                  disabled={isLocked}
                >
                  <option value="防火地域">防火地域</option>
                  <option value="準防火地域">準防火地域</option>
                  <option value="法22条地域">法22条地域</option>
                  <option value="なし">なし</option>
                </select>
              </td>
              <td className="border p-1 font-medium">建物構造</td>
              <td className="border p-1">木造軸組工法 ガルバリウム鋼板葺</td>
              <td className="border p-1 font-medium">施工面積</td>
              <td className="border p-1">
                <input
                  type="number"
                  value={data.constructionArea}
                  onChange={(e) => setData({ ...data, constructionArea: Number(e.target.value) })}
                  className="w-16 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
                <span className="ml-1">坪</span>
              </td>
              <td className="border p-1 font-medium">階数</td>
              <td className="border p-1">
                <select
                  value={data.floorCount}
                  onChange={(e) => setData({ ...data, floorCount: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full border-0 bg-transparent focus:outline-none px-1"
                  disabled={isLocked}
                >
                  <option value={1}>1階</option>
                  <option value={2}>2階</option>
                  <option value={3}>3階</option>
                </select>
              </td>
            </tr>

            {/* 建築費用セクション */}
            <tr className="bg-orange-50">
              <td colSpan={8} className="border p-2 font-bold">建築費用</td>
            </tr>

            {/* ➊建物本体工事 */}
            <tr>
              <td colSpan={2} className="border p-1 font-medium bg-blue-50">➊建物本体工事</td>
              <td className="border p-1 text-center">仕様</td>
              <td className="border p-1">
                <select
                  value={data.productType}
                  onChange={(e) => {
                    const product = PRODUCT_MASTER.find(p => p.name === e.target.value)
                    setData({
                      ...data,
                      productType: e.target.value as ProductType,
                      pricePerTsubo: product?.pricePerTsubo || data.pricePerTsubo,
                    })
                  }}
                  className="w-full border-0 bg-transparent focus:outline-none px-1"
                  disabled={isLocked}
                >
                  {PRODUCT_MASTER.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </td>
              <td className="border p-1 text-center">坪単価</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.pricePerTsubo}
                  onChange={(e) => setData({ ...data, pricePerTsubo: Number(e.target.value) })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
                <span className="ml-1">円</span>
              </td>
              <td className="border p-1 font-medium text-right bg-yellow-50">小計①（税抜）</td>
              <td className="border p-1 text-right font-bold bg-yellow-50">
                {formatCurrency(calculation.subtotalBuildingMain)}
              </td>
            </tr>

            {/* ➋付帯工事費用A */}
            <tr>
              <td colSpan={2} className="border p-1 font-medium bg-green-50">➋付帯工事費用A</td>
              <td colSpan={4} className="border p-1 text-xs text-gray-500">建物本体工事以外にかかる費用</td>
              <td className="border p-1 font-medium text-right bg-yellow-50">小計②（税抜）</td>
              <td className="border p-1 text-right font-bold bg-yellow-50">
                {formatCurrency(calculation.subtotalIncidentalA)}
              </td>
            </tr>

            {/* 付帯工事Aの詳細 */}
            <tr>
              <td className="border p-1 pl-4">確認申請費用</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.incidentalCostA.confirmationApplicationFee}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostA: { ...data.incidentalCostA, confirmationApplicationFee: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
              <td className="border p-1 pl-4">構造計算</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.incidentalCostA.structuralCalculation}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostA: { ...data.incidentalCostA, structuralCalculation: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
              <td className="border p-1 pl-4">構造図作成費用</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.incidentalCostA.structuralDrawingFee}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostA: { ...data.incidentalCostA, structuralDrawingFee: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
              <td className="border p-1 pl-4">BELS評価書申請</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.incidentalCostA.belsApplicationFee}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostA: { ...data.incidentalCostA, belsApplicationFee: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
            </tr>

            {/* ➌付帯工事費用B */}
            <tr>
              <td colSpan={2} className="border p-1 font-medium bg-purple-50">➌付帯工事費用B</td>
              <td colSpan={4} className="border p-1 text-xs text-gray-500">間取・オプションによって変わる費用</td>
              <td className="border p-1 font-medium text-right bg-yellow-50">小計③（税抜）</td>
              <td className="border p-1 text-right font-bold bg-yellow-50">
                {formatCurrency(calculation.subtotalIncidentalB)}
              </td>
            </tr>

            {/* 太陽光 */}
            <tr>
              <td className="border p-1 pl-4">太陽光発電システム</td>
              <td className="border p-1">
                <input
                  type="number"
                  value={data.incidentalCostB.solarPanelCount}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostB: { ...data.incidentalCostB, solarPanelCount: Number(e.target.value) }
                  })}
                  className="w-12 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
                <span className="ml-1">枚</span>
              </td>
              <td className="border p-1 text-right">{data.incidentalCostB.solarPanelKw} kW</td>
              <td className="border p-1 text-right">
                <input
                  type="number"
                  value={data.incidentalCostB.solarPanelCost}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostB: { ...data.incidentalCostB, solarPanelCost: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
              <td className="border p-1 pl-4">蓄電池</td>
              <td className="border p-1">
                <select
                  value={data.incidentalCostB.storageBatteryType}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostB: { ...data.incidentalCostB, storageBatteryType: e.target.value as typeof data.incidentalCostB.storageBatteryType }
                  })}
                  className="w-full border-0 bg-transparent focus:outline-none px-1"
                  disabled={isLocked}
                >
                  <option value="なし">なし</option>
                  <option value="蓄電池">蓄電池</option>
                  <option value="V2H/V2X">V2H/V2X</option>
                </select>
              </td>
              <td className="border p-1" colSpan={2}>
                <input
                  type="number"
                  value={data.incidentalCostB.storageBatteryCost}
                  onChange={(e) => setData({
                    ...data,
                    incidentalCostB: { ...data.incidentalCostB, storageBatteryCost: Number(e.target.value) }
                  })}
                  className="w-24 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-300 px-1 text-right"
                  disabled={isLocked}
                />
              </td>
            </tr>

            {/* ➍付帯工事費用C */}
            <tr>
              <td colSpan={2} className="border p-1 font-medium bg-red-50">➍付帯工事費用C</td>
              <td colSpan={4} className="border p-1 text-xs text-gray-500">土地によってかかる費用</td>
              <td className="border p-1 font-medium text-right bg-yellow-50">小計④（税抜）</td>
              <td className="border p-1 text-right font-bold bg-yellow-50">
                {formatCurrency(calculation.subtotalIncidentalC)}
              </td>
            </tr>

            {/* 合計セクション */}
            <tr className="bg-orange-100">
              <td colSpan={4} className="border p-2 font-bold">工事請負金額合計（税抜）</td>
              <td colSpan={4} className="border p-2 text-right font-bold text-lg">
                {formatCurrency(calculation.totalBuildingConstruction)}
              </td>
            </tr>
            <tr className="bg-orange-50">
              <td colSpan={4} className="border p-2 font-medium">消費税（10%）</td>
              <td colSpan={4} className="border p-2 text-right">
                {formatCurrency(calculation.consumptionTax)}
              </td>
            </tr>
            <tr className="bg-orange-200">
              <td colSpan={4} className="border p-2 font-bold">工事請負金額合計（税込）</td>
              <td colSpan={4} className="border p-2 text-right font-bold text-xl text-orange-700">
                {formatCurrency(calculation.totalBuildingConstructionWithTax)}
              </td>
            </tr>

            {/* 諸費用・土地費用 */}
            <tr className="bg-gray-50">
              <td colSpan={2} className="border p-1 font-medium">➎諸費用</td>
              <td colSpan={2} className="border p-1 text-right">{formatCurrency(calculation.subtotalMiscellaneous)}</td>
              <td colSpan={2} className="border p-1 font-medium">➏土地費用</td>
              <td colSpan={2} className="border p-1 text-right">{formatCurrency(calculation.subtotalLand)}</td>
            </tr>

            {/* 総合計 */}
            <tr className="bg-gradient-to-r from-orange-300 to-yellow-300">
              <td colSpan={4} className="border p-3 font-bold text-lg">総支払金額</td>
              <td colSpan={4} className="border p-3 text-right font-bold text-2xl text-orange-800">
                {formatCurrency(calculation.grandTotal)}
              </td>
            </tr>

            {/* 月々返済 */}
            <tr className="bg-blue-50">
              <td colSpan={4} className="border p-2 font-medium">月々の返済額</td>
              <td colSpan={4} className="border p-2 text-right font-bold text-lg text-blue-700">
                {formatCurrency(calculation.totalMonthlyPayment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-orange-500" />
          <span className="font-medium">{data.teiName || '新規'} 資金計画書</span>
          <Badge variant="outline">v{version}</Badge>
          {isLocked && (
            <Badge className="bg-red-100 text-red-700">
              <Lock className="w-3 h-3 mr-1" />
              {lockType === 'contract' ? '請負契約時' : lockType === 'change_contract' ? '変更契約時' : 'ロック中'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel出力
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLocked}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* シートタブ */}
      <Tabs value={activeSheet} onValueChange={setActiveSheet}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="main" className="data-[state=active]:bg-white">
            【資金計画書】
          </TabsTrigger>
          <TabsTrigger value="contract" className="data-[state=active]:bg-white">
            契約のご案内
          </TabsTrigger>
          <TabsTrigger value="flow" className="data-[state=active]:bg-white">
            資金の流れ
          </TabsTrigger>
          <TabsTrigger value="master" className="data-[state=active]:bg-white">
            マスタ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-0">
          {renderMainSheet()}
        </TabsContent>

        <TabsContent value="contract" className="mt-0">
          <div className="border rounded-lg p-6 bg-white" style={{ height: 'calc(100vh - 300px)' }}>
            <h2 className="text-xl font-bold mb-4">契約のご案内（お客様用）</h2>
            <p className="text-gray-500">このシートは契約手続きのご案内用です</p>
            {/* 契約のご案内の内容 */}
          </div>
        </TabsContent>

        <TabsContent value="flow" className="mt-0">
          <div className="border rounded-lg p-6 bg-white" style={{ height: 'calc(100vh - 300px)' }}>
            <h2 className="text-xl font-bold mb-4">資金の流れ（LIFE・LIFE＋）</h2>
            <p className="text-gray-500">各段階での支払い詳細</p>
            {/* 資金の流れの内容 */}
          </div>
        </TabsContent>

        <TabsContent value="master" className="mt-0">
          <div className="border rounded-lg p-6 bg-white" style={{ height: 'calc(100vh - 300px)' }}>
            <h2 className="text-xl font-bold mb-4">マスタ</h2>
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">商品名</th>
                  <th className="border p-2 text-right">坪単価</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCT_MASTER.map(p => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="border p-2">{p.name}</td>
                    <td className="border p-2 text-right">{formatCurrency(p.pricePerTsubo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
