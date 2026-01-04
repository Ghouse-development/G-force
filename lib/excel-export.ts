/**
 * Excel出力ユーティリティ
 * 資金計画書・請負契約書のExcel出力
 *
 * ExcelJS版を使用して、書式・数式・印刷設定を完全に保持
 */

import type { FundPlanData } from '@/types/fund-plan'
import type { ContractData as ContractDataType } from '@/types/contract'
import { createContractDataFromFundPlan, createDefaultContractData } from '@/types/contract'

// ExcelJS版をエクスポート（完全コピー版として使用）
export { exportFundPlanWithExcelJS } from './excel-export-exceljs'
export { exportContractWithExcelJS } from './excel-export-contract'

// 型のエクスポート
export type { ContractData } from '@/types/contract'

// ============================================
// テンプレートベースExcel出力（完全一致版）
// ============================================

/**
 * テンプレートを使用して資金計画書をExcel出力
 * ExcelJS版を使用して書式・数式・印刷設定を完全に保持
 */
export async function exportFundPlanFromTemplate(
  data: FundPlanData,
  filename?: string
): Promise<void> {
  const { exportFundPlanWithExcelJS } = await import('./excel-export-exceljs')
  await exportFundPlanWithExcelJS(data, filename)
}

/**
 * テンプレートを使用して請負契約書をExcel出力
 * ExcelJS版を使用して書式・数式・印刷設定を完全に保持
 */
export async function exportContractFromTemplate(
  data: ContractDataType,
  filename?: string
): Promise<void> {
  const { exportContractWithExcelJS } = await import('./excel-export-contract')
  await exportContractWithExcelJS(data, filename)
}

/**
 * 資金計画書データから請負契約書をExcel出力
 * データ連携: 資金計画書 → 請負契約書への自動変換
 */
export async function exportContractFromFundPlan(
  fundPlanData: FundPlanData,
  additionalContractData?: Partial<ContractDataType>,
  filename?: string
): Promise<void> {
  // 資金計画書から請負契約書データを生成
  const contractData = createContractDataFromFundPlan(fundPlanData)

  // 追加データをマージ
  const mergedData = {
    ...contractData,
    ...additionalContractData,
  } as ContractDataType

  // 請負契約書を出力
  await exportContractFromTemplate(mergedData, filename)
}

/**
 * 資金計画書と請負契約書を両方出力
 */
export async function exportBothDocuments(
  fundPlanData: FundPlanData,
  additionalContractData?: Partial<ContractDataType>
): Promise<void> {
  // 資金計画書を出力
  await exportFundPlanFromTemplate(fundPlanData)

  // 請負契約書を出力
  await exportContractFromFundPlan(fundPlanData, additionalContractData)
}

// ============================================
// 後方互換性のためのレガシー型定義とアダプター
// ============================================

/**
 * @deprecated 新しいContractData型を使用してください
 * app/contracts/[id]/page.tsxからの移行用
 */
export interface LegacyContractData {
  contractNumber: string
  contractDate: string
  customerName: string
  customerAddress: string
  customerPhone?: string
  teiName: string
  constructionAddress: string
  constructionArea: number
  contractAmount: number
  taxAmount: number
  totalAmount: number
  startDate: string
  completionDate: string
  deliveryDate: string
  paymentTerms: {
    atContract: { amount: number; date: string }
    atStart: { amount: number; date: string }
    atFraming: { amount: number; date: string }
    atCompletion: { amount: number; date: string }
  }
  specifications?: string
  notes?: string
  salesRep: string
  managerName: string
}

/**
 * @deprecated exportContractFromTemplate を使用してください
 * レガシー型からの変換アダプター
 */
export async function exportContractToExcel(
  data: LegacyContractData,
  filename?: string
): Promise<void> {
  // レガシー型から新しい型へ変換
  const defaultData = createDefaultContractData()
  const convertedData: ContractDataType = {
    ...defaultData,
    contractNumber: data.contractNumber,
    customerName: data.customerName,
    customerAddress: data.customerAddress,
    constructionName: `${data.teiName} 新築工事`,
    constructionSite: data.constructionAddress,
    constructionArea: data.constructionArea,
    constructionPrice: data.contractAmount,
    startDate: data.startDate,
    completionDate: data.completionDate,
    deliveryDate: data.deliveryDate,
    contractDate: data.contractDate,
    salesRep: data.salesRep,
    payment1Amount: data.paymentTerms.atContract.amount,
    payment1Date: data.paymentTerms.atContract.date,
    payment2Amount: data.paymentTerms.atStart.amount,
    payment2Date: data.paymentTerms.atStart.date,
    payment3Amount: data.paymentTerms.atFraming.amount,
    payment3Date: data.paymentTerms.atFraming.date,
    payment4Amount: data.paymentTerms.atCompletion.amount,
    payment4Date: data.paymentTerms.atCompletion.date,
  }

  await exportContractFromTemplate(convertedData, filename)
}
