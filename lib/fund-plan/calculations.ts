import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { taxRate } from './master-data'

// 付帯工事費用A 小計計算
export function calculateIncidentalCostA(data: FundPlanData['incidentalCostA']): number {
  return (
    data.confirmationApplicationFee +
    data.structuralCalculation +
    data.structuralDrawingFee +
    data.belsApplicationFee +
    data.longTermHousingApplicationFee +
    data.outdoorElectricWaterDrainageFee +
    data.defectInsuranceGroundTermiteWarranty +
    data.designSupervisionFee +
    data.safetyMeasuresFee +
    data.temporaryConstructionFee
  )
}

// 付帯工事費用B 小計計算
export function calculateIncidentalCostB(data: FundPlanData['incidentalCostB']): number {
  return (
    data.solarPanelCost +
    data.storageBatteryCost +
    data.eaveOverhangCost +
    data.threeStoryDifference +
    data.roofLengthExtra +
    data.narrowRoadExtra +
    data.areaSizeExtra
  )
}

// 付帯工事費用C 小計計算
export function calculateIncidentalCostC(data: FundPlanData['incidentalCostC']): number {
  return (
    data.landSurveyFee +
    data.groundImprovementFee +
    data.demolitionFee +
    data.retainingWallFee +
    data.exteriorFee +
    data.otherFee
  )
}

// 諸費用 小計計算
export function calculateMiscellaneousCosts(data: FundPlanData['miscellaneousCosts']): number {
  return (
    data.registrationFee +
    data.stampDuty +
    data.loanFee +
    data.fireInsurance +
    data.bridgeLoanInterest +
    data.otherFee
  )
}

// 土地費用 小計計算
export function calculateLandCosts(data: FundPlanData['landCosts']): number {
  return (
    data.landPrice +
    data.brokerageFee +
    data.propertyTaxSettlement +
    data.landRegistrationFee
  )
}

// 月々返済額計算（元利均等返済）
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate <= 0) return Math.round(principal / (years * 12))

  const monthlyRate = annualRate / 12
  const numPayments = years * 12
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)

  return Math.round(payment)
}

// つなぎ融資利息計算
export function calculateBridgeLoanInterest(
  amount: number,
  annualRate: number,
  months: number
): number {
  if (amount <= 0 || annualRate <= 0 || months <= 0) return 0
  return Math.round((amount * annualRate * months) / 12)
}

// 資金計画書全体計算
export function calculateFundPlan(data: FundPlanData): FundPlanCalculation {
  // 建物本体工事
  const subtotalBuildingMain = data.constructionArea * data.pricePerTsubo

  // 各小計
  const subtotalIncidentalA = calculateIncidentalCostA(data.incidentalCostA)
  const subtotalIncidentalB = calculateIncidentalCostB(data.incidentalCostB)
  const subtotalIncidentalC = calculateIncidentalCostC(data.incidentalCostC)
  const subtotalMiscellaneous = calculateMiscellaneousCosts(data.miscellaneousCosts)
  const subtotalLand = calculateLandCosts(data.landCosts)

  // 工事請負金額合計（税抜）
  const totalConstruction =
    subtotalBuildingMain +
    subtotalIncidentalA +
    subtotalIncidentalB +
    subtotalIncidentalC

  // 工事請負金額合計（税込）
  const totalConstructionWithTax = Math.round(totalConstruction * (1 + taxRate))

  // 土地建物総額
  const totalLandAndBuilding = totalConstructionWithTax + subtotalLand

  // 総合計
  const grandTotal = totalLandAndBuilding + subtotalMiscellaneous

  // 月々返済額
  const monthlyPaymentA = calculateMonthlyPayment(
    data.loanPlan.bankA.amount,
    data.loanPlan.bankA.interestRate,
    data.loanPlan.bankA.loanYears
  )
  const monthlyPaymentB = calculateMonthlyPayment(
    data.loanPlan.bankB.amount,
    data.loanPlan.bankB.interestRate,
    data.loanPlan.bankB.loanYears
  )
  const monthlyPaymentC = calculateMonthlyPayment(
    data.loanPlan.bankC.amount,
    data.loanPlan.bankC.interestRate,
    data.loanPlan.bankC.loanYears
  )
  const totalMonthlyPayment = monthlyPaymentA + monthlyPaymentB + monthlyPaymentC

  // つなぎ融資利息
  const landBridgeInterest = calculateBridgeLoanInterest(
    data.bridgeLoan.landBridge.amount,
    data.bridgeLoan.landBridge.interestRate,
    data.bridgeLoan.landBridge.months
  )
  const constructionBridgeInterest = calculateBridgeLoanInterest(
    data.bridgeLoan.constructionBridge.amount,
    data.bridgeLoan.constructionBridge.interestRate,
    data.bridgeLoan.constructionBridge.months
  )
  const bridgeLoanInterestTotal = landBridgeInterest + constructionBridgeInterest

  return {
    subtotalBuildingMain,
    subtotalIncidentalA,
    subtotalIncidentalB,
    subtotalIncidentalC,
    subtotalMiscellaneous,
    subtotalLand,
    totalConstruction,
    totalConstructionWithTax,
    totalLandAndBuilding,
    grandTotal,
    monthlyPaymentA,
    monthlyPaymentB,
    monthlyPaymentC,
    totalMonthlyPayment,
    bridgeLoanInterestTotal,
  }
}

// 金額フォーマット
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP').format(amount)
}

// 金額フォーマット（円付き）
export function formatCurrencyWithUnit(amount: number): string {
  return `${formatCurrency(amount)}円`
}

// 金額フォーマット（万円）
export function formatCurrencyInMan(amount: number): string {
  const man = amount / 10000
  if (Number.isInteger(man)) {
    return `${formatCurrency(man)}万円`
  }
  return `${formatCurrency(Math.round(man * 10) / 10)}万円`
}
