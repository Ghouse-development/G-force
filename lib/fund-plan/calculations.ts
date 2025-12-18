import type { FundPlanData, FundPlanCalculation, BankLoanPlan, BridgeLoanItem } from '@/types/fund-plan'
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
    data.lowerRoofCost +
    data.balconyVoidCost +
    data.threeStoryDifference +
    data.roofLengthExtra +
    data.narrowRoadExtra +
    data.areaSizeExtra +
    data.lightingCost +
    data.optionCost
  )
}

// 付帯工事費用C 小計計算
export function calculateIncidentalCostC(data: FundPlanData['incidentalCostC']): number {
  return (
    data.fireProtectionCost +
    data.demolitionCost +
    data.applicationManagementFee +
    data.waterDrainageFee +
    data.groundImprovementFee +
    data.soilDisposalFee +
    data.electricProtectionPipe +
    data.narrowRoadCubicExtra +
    data.deepFoundationExtra +
    data.elevationExtra +
    data.flagLotExtra +
    data.skyFactorExtra +
    data.quasiFireproofExtra +
    data.roadTimeRestrictionExtra
  )
}

// 諸費用 小計計算
export function calculateMiscellaneousCosts(data: FundPlanData['miscellaneousCosts']): number {
  return (
    data.buildingRegistrationFee +
    data.housingLoanFee +
    data.bridgeLoanFee +
    data.loanContractStampDuty +
    data.constructionContractStampDuty +
    data.fireInsurance +
    data.advanceConstruction +
    data.exteriorConstruction +
    data.customConstruction
  )
}

// 土地費用 小計計算
export function calculateLandCosts(data: FundPlanData['landCosts']): number {
  return (
    data.landPrice +
    data.propertyTaxSettlement +
    data.landContractStampDuty +
    data.brokerageFee +
    data.landRegistrationFee +
    data.extinctionRegistrationFee
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

// ボーナス時返済額計算
export function calculateBonusPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate <= 0) return Math.round(principal / (years * 2))

  const semiAnnualRate = annualRate / 2
  const numPayments = years * 2
  const payment =
    (principal * semiAnnualRate * Math.pow(1 + semiAnnualRate, numPayments)) /
    (Math.pow(1 + semiAnnualRate, numPayments) - 1)

  return Math.round(payment)
}

// 銀行ローンの返済額を計算
export function calculateBankLoanPayments(loan: BankLoanPlan): {
  monthlyPayment: number
  bonusPayment: number
} {
  const monthlyPayment = calculateMonthlyPayment(
    loan.principalMonthly,
    loan.interestRate,
    loan.loanYears
  )
  const bonusPayment = calculateBonusPayment(
    loan.principalBonus,
    loan.interestRate,
    loan.loanYears
  )
  return { monthlyPayment, bonusPayment }
}

// つなぎ融資利息計算
export function calculateBridgeLoanInterest(
  amount: number,
  annualRate: number,
  months: number
): { monthlyInterest: number; totalInterest: number } {
  if (amount <= 0 || annualRate <= 0 || months <= 0) {
    return { monthlyInterest: 0, totalInterest: 0 }
  }
  const monthlyInterest = Math.round((amount * annualRate) / 12)
  const totalInterest = Math.round((amount * annualRate * months) / 12)
  return { monthlyInterest, totalInterest }
}

// つなぎ融資の利息を計算して更新
export function updateBridgeLoanInterest(loan: BridgeLoanItem): BridgeLoanItem {
  const { monthlyInterest, totalInterest } = calculateBridgeLoanInterest(
    loan.amount,
    loan.interestRate,
    loan.months
  )
  return {
    ...loan,
    monthlyInterest,
    totalInterest,
  }
}

// 太陽光発電経済効果計算
export function calculateSolarEffect(
  panelCapacityKw: number,
  annualProductionPerKw: number,
  dailyConsumption: number,
  batteryCharge: number,
  salePrice: number,
  averageElectricityCost: number
): {
  annualProduction: number
  dailyProduction: number
  dailySale: number
  monthlySale: number
  monthlySaleIncome: number
  monthlyTotalEffect: number
  tenYearTotalEffect: number
  returnRate: number
} {
  // 年間・日間発電量
  const annualProduction = panelCapacityKw * annualProductionPerKw
  const dailyProduction = annualProduction / 365

  // 売電量
  const dailySale = Math.max(0, dailyProduction - dailyConsumption - batteryCharge)
  const monthlySale = dailySale * 365 / 12

  // 売電収入
  const monthlySaleIncome = Math.round(monthlySale * salePrice)

  // 買わずに済んだ電気代（自家消費分）
  const selfConsumption = dailyConsumption + batteryCharge
  const monthlySelfConsumption = selfConsumption * 365 / 12
  // 平均電気代から自家消費で節約した金額を計算
  const savedElectricityCost = Math.round(averageElectricityCost * (selfConsumption / (selfConsumption + dailySale)))

  // トータル経済効果（月額）
  const monthlyTotalEffect = monthlySaleIncome + savedElectricityCost

  // 10年間のトータル経済効果（4年売電 + 6年自家消費として計算）
  const fourYearEffect = monthlySaleIncome * 12 * 4
  const sixYearEffect = savedElectricityCost * 12 * 6
  const tenYearTotalEffect = fourYearEffect + sixYearEffect

  // 利回り（簡易計算）
  const returnRate = panelCapacityKw > 0 ? monthlyTotalEffect * 12 / (panelCapacityKw * 209500) : 0

  return {
    annualProduction: Math.round(annualProduction),
    dailyProduction: Math.round(dailyProduction * 100) / 100,
    dailySale: Math.round(dailySale * 100) / 100,
    monthlySale: Math.round(monthlySale * 100) / 100,
    monthlySaleIncome,
    monthlyTotalEffect,
    tenYearTotalEffect,
    returnRate: Math.round(returnRate * 10000) / 10000,
  }
}

// 資金計画書全体計算
export function calculateFundPlan(data: FundPlanData): FundPlanCalculation {
  // ➊建物本体工事（税抜）
  const subtotalBuildingMain = data.constructionArea * data.pricePerTsubo

  // 各小計（税抜）
  const subtotalIncidentalA = calculateIncidentalCostA(data.incidentalCostA)
  const subtotalIncidentalB = calculateIncidentalCostB(data.incidentalCostB)
  const subtotalIncidentalC = calculateIncidentalCostC(data.incidentalCostC)
  const subtotalMiscellaneous = calculateMiscellaneousCosts(data.miscellaneousCosts)
  const subtotalLand = calculateLandCosts(data.landCosts)

  // 最終建物工事費用（税抜）❶+❷+❸+❹
  const totalBuildingConstruction =
    subtotalBuildingMain +
    subtotalIncidentalA +
    subtotalIncidentalB +
    subtotalIncidentalC

  // 消費税
  const consumptionTax = Math.round(totalBuildingConstruction * taxRate)

  // 最終建物工事費用（税込）
  const totalBuildingConstructionWithTax = totalBuildingConstruction + consumptionTax

  // 工事請負金額以外合計
  const totalOutsideConstruction = subtotalLand + subtotalMiscellaneous

  // 支払合計計算
  const paymentTotal =
    data.paymentPlanOutside.landPurchase.totalAmount +
    data.paymentPlanOutside.miscellaneous.totalAmount +
    data.paymentPlanConstruction.applicationFee.totalAmount +
    data.paymentPlanConstruction.contractFee.totalAmount +
    data.paymentPlanConstruction.interimPayment1.totalAmount +
    data.paymentPlanConstruction.interimPayment2.totalAmount +
    data.paymentPlanConstruction.finalPayment.totalAmount

  const selfFundingTotal =
    data.paymentPlanOutside.landPurchase.selfFunding +
    data.paymentPlanOutside.miscellaneous.selfFunding +
    data.paymentPlanConstruction.applicationFee.selfFunding +
    data.paymentPlanConstruction.contractFee.selfFunding +
    data.paymentPlanConstruction.interimPayment1.selfFunding +
    data.paymentPlanConstruction.interimPayment2.selfFunding +
    data.paymentPlanConstruction.finalPayment.selfFunding

  const bankLoanTotal =
    data.paymentPlanOutside.landPurchase.bankLoan +
    data.paymentPlanOutside.miscellaneous.bankLoan +
    data.paymentPlanConstruction.applicationFee.bankLoan +
    data.paymentPlanConstruction.contractFee.bankLoan +
    data.paymentPlanConstruction.interimPayment1.bankLoan +
    data.paymentPlanConstruction.interimPayment2.bankLoan +
    data.paymentPlanConstruction.finalPayment.bankLoan

  // 最終合計（税込）
  const grandTotal = totalBuildingConstructionWithTax + subtotalMiscellaneous + subtotalLand

  // 請負契約時からの差額
  const differenceFromContract = data.contractTotalAtSigning > 0
    ? grandTotal - data.contractTotalAtSigning
    : grandTotal

  // 月々返済額
  const paymentsA = calculateBankLoanPayments(data.loanPlan.bankA)
  const paymentsB = calculateBankLoanPayments(data.loanPlan.bankB)
  const paymentsC = calculateBankLoanPayments(data.loanPlan.bankC)

  const monthlyPaymentA = paymentsA.monthlyPayment
  const monthlyPaymentB = paymentsB.monthlyPayment
  const monthlyPaymentC = paymentsC.monthlyPayment
  const totalMonthlyPayment = monthlyPaymentA + monthlyPaymentB + monthlyPaymentC

  const bonusPaymentA = paymentsA.bonusPayment
  const bonusPaymentB = paymentsB.bonusPayment
  const bonusPaymentC = paymentsC.bonusPayment
  const totalBonusPayment = bonusPaymentA + bonusPaymentB + bonusPaymentC

  // つなぎ融資利息
  const landBridgeInterest = calculateBridgeLoanInterest(
    data.bridgeLoan.landBridge.amount,
    data.bridgeLoan.landBridge.interestRate,
    data.bridgeLoan.landBridge.months
  )
  const constructionStartInterest = calculateBridgeLoanInterest(
    data.bridgeLoan.constructionStartBridge.amount,
    data.bridgeLoan.constructionStartBridge.interestRate,
    data.bridgeLoan.constructionStartBridge.months
  )
  const constructionInterimInterest = calculateBridgeLoanInterest(
    data.bridgeLoan.constructionInterimBridge.amount,
    data.bridgeLoan.constructionInterimBridge.interestRate,
    data.bridgeLoan.constructionInterimBridge.months
  )
  const bridgeLoanInterestTotal =
    landBridgeInterest.totalInterest +
    constructionStartInterest.totalInterest +
    constructionInterimInterest.totalInterest

  // 新居の住居費
  const newMonthlyPayment = totalMonthlyPayment
  const effectiveUtilityCost = data.solarOnlyEffect.monthlyTotalEffect > 0
    ? -data.solarOnlyEffect.monthlyTotalEffect + 16533 // 平均電気代 - 経済効果
    : 16533
  const totalNewMonthlyCost = newMonthlyPayment + Math.max(0, effectiveUtilityCost)

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
    grandTotal,
    differenceFromContract,
    monthlyPaymentA,
    monthlyPaymentB,
    monthlyPaymentC,
    totalMonthlyPayment,
    bonusPaymentA,
    bonusPaymentB,
    bonusPaymentC,
    totalBonusPayment,
    bridgeLoanInterestTotal,
    newMonthlyPayment,
    effectiveUtilityCost,
    totalNewMonthlyCost,
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

// パーセント表示
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

// 日付フォーマット（和暦表示用）
export function formatDateJP(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${year}/${month}/${day} (${dayOfWeek})`
}

// Excelシリアル値から日付に変換
export function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569)
  const utcValue = utcDays * 86400
  return new Date(utcValue * 1000)
}

// 太陽光パネル枚数からkW数を計算
export function calculateSolarKw(panelCount: number): number {
  return Math.round(panelCount * 0.465 * 100) / 100
}

// 太陽光パネル費用を計算
export function calculateSolarPanelCost(kw: number): number {
  return Math.round(kw * 209500)
}
