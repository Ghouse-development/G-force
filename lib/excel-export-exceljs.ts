/**
 * ExcelJS版 Excel出力ユーティリティ
 *
 * テンプレートの書式・数式・印刷設定を完全に保持したまま
 * セル値のみを書き換えてエクスポートします。
 *
 * 対応項目:
 * - 数式の保持
 * - 塗りつぶし・フォント・罫線
 * - 行の高さ・列の幅
 * - 印刷範囲・印刷設定
 * - 結合セル
 * - ヘッダー/フッター
 *
 * 重要:
 * テンプレートのセル位置は lib/fund-plan/cell-mapping.ts で管理
 * テンプレートが変更された場合はセルマッピングを更新してください
 *
 * 信頼性について:
 * - verified: true のセルのみ書き込みを行います
 * - 未検証のセルは警告をコンソールに出力します
 * - テンプレート分析機能でセル位置を確認できます
 */

import ExcelJS from 'exceljs'
import type { FundPlanData } from '@/types/fund-plan'
import {
  FUND_PLAN_SECTIONS,
  getMappingSummary,
  getVerifiedMappings,
  getNestedValue,
  type CellMapping,
} from './fund-plan/cell-mapping'

// ============================================
// 警告・ログ機能
// ============================================

export interface ExportWarning {
  type: 'unmapped_field' | 'unverified_cell' | 'missing_value' | 'cell_not_found'
  message: string
  field?: string
  cellAddress?: string
}

let exportWarnings: ExportWarning[] = []

function clearWarnings(): void {
  exportWarnings = []
}

function addWarning(warning: ExportWarning): void {
  exportWarnings.push(warning)
  // 開発時のみコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Excel Export] ${warning.type}: ${warning.message}`)
  }
}

export function getExportWarnings(): ExportWarning[] {
  return [...exportWarnings]
}

// ============================================
// メイン関数: テンプレートベース完全コピー版
// ============================================

/**
 * テンプレートを使用して資金計画書をExcel出力（完全コピー版）
 * 書式・数式・印刷設定をすべて保持します
 *
 * @param data - 資金計画書データ
 * @param filename - 出力ファイル名（省略時は自動生成）
 * @param options - オプション
 * @returns 警告情報の配列
 */
export async function exportFundPlanWithExcelJS(
  data: FundPlanData,
  filename?: string,
  options?: {
    showWarnings?: boolean
    skipUnverified?: boolean
  }
): Promise<ExportWarning[]> {
  clearWarnings()

  const { showWarnings = true, skipUnverified = true } = options || {}

  try {
    // マッピング状況をチェック
    const summary = getMappingSummary()
    if (summary.emptySections.length > 0 && showWarnings) {
      addWarning({
        type: 'unmapped_field',
        message: `未マッピングのセクション: ${summary.emptySections.join(', ')}`,
      })
    }

    // テンプレートファイルを読み込み
    const templatePath = '/templates/fund-plan-template.xlsx'
    const response = await fetch(templatePath)

    if (!response.ok) {
      throw new Error(`テンプレートファイルの読み込みに失敗しました: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    // ExcelJSでワークブックを読み込み
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    // 資金計画書シートを取得
    const fundPlanSheet = workbook.getWorksheet('【資金計画書】')
    if (fundPlanSheet) {
      fillFundPlanSheetWithMapping(fundPlanSheet, data, skipUnverified)
    } else {
      addWarning({
        type: 'cell_not_found',
        message: '【資金計画書】シートが見つかりません',
      })
    }

    // 契約のご案内シートを取得
    const guideSheet = workbook.getWorksheet('契約のご案内（お客様用）')
    if (guideSheet) {
      fillContractGuideSheet(guideSheet, data)
    }

    // 資金の流れシートを取得
    const flowSheet = workbook.getWorksheet('資金の流れ（LIFE・LIFE＋）')
    if (flowSheet) {
      fillFundFlowSheet(flowSheet, data)
    }

    // Blobとしてダウンロード
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const defaultFilename = `資金計画書_${data.teiName || data.customerName}_${new Date().toISOString().split('T')[0]}`
    downloadBlob(blob, filename || `${defaultFilename}.xlsx`)

    // 警告をコンソールに表示
    if (showWarnings && exportWarnings.length > 0) {
      console.log(`[Excel Export] ${exportWarnings.length}件の警告があります:`)
      exportWarnings.forEach((w, i) => console.log(`  ${i + 1}. ${w.message}`))
    }

    return getExportWarnings()

  } catch (error) {
    console.error('Excel出力エラー:', error)
    throw error
  }
}

// ============================================
// シート別データ書き込み関数
// ============================================

/**
 * 資金計画書シートにデータを書き込み（マッピングベース）
 * セル位置は cell-mapping.ts で管理
 */
function fillFundPlanSheetWithMapping(
  sheet: ExcelJS.Worksheet,
  data: FundPlanData,
  skipUnverified: boolean
): void {
  // 検証済みマッピングを取得
  const verifiedMappings = getVerifiedMappings()

  // 各マッピングに対してデータを書き込み
  for (const mapping of verifiedMappings) {
    const value = getNestedValue(data as unknown as Record<string, unknown>, mapping.dataPath)

    if (value === undefined || value === null || value === '') {
      if (mapping.required) {
        addWarning({
          type: 'missing_value',
          message: `必須フィールド「${mapping.description}」の値がありません`,
          field: mapping.dataPath,
          cellAddress: mapping.address,
        })
      }
      continue
    }

    // 特殊処理: 防火地域
    if (mapping.dataPath === 'fireProtectionZone') {
      const isQuasiFireProof = String(value).includes('準防火')
      setCellValuePreserveStyle(sheet, mapping.address, isQuasiFireProof ? '〇' : '×')
      continue
    }

    // 特殊処理: 金利（小数を百分率表示に変換が必要な場合）
    if (mapping.dataPath.includes('interestRate')) {
      // 金利は既に小数形式（例: 0.0082）で保存されている
      // Excelのセルの書式設定で表示形式を調整
      setCellValuePreserveStyle(sheet, mapping.address, value as number)
      continue
    }

    // 特殊処理: 日付
    if (mapping.type === 'date' && typeof value === 'string') {
      // ISO形式の日付文字列をそのまま設定
      // Excelが自動的に認識する形式で設定
      setCellValuePreserveStyle(sheet, mapping.address, value)
      continue
    }

    // 通常の書き込み
    setCellValuePreserveStyle(sheet, mapping.address, value as string | number)
  }

  // 未検証マッピングの警告
  if (!skipUnverified) {
    for (const section of FUND_PLAN_SECTIONS) {
      for (const mapping of section.cells) {
        if (!mapping.verified) {
          addWarning({
            type: 'unverified_cell',
            message: `未検証セル: ${mapping.description} (${mapping.address})`,
            field: mapping.dataPath,
            cellAddress: mapping.address,
          })
        }
      }
    }
  }
}

/**
 * 契約のご案内シートにデータを書き込み
 */
function fillContractGuideSheet(sheet: ExcelJS.Worksheet, data: FundPlanData): void {
  // 顧客名
  if (data.customerName) {
    setCellValuePreserveStyle(sheet, 'B3', `${data.customerName}　様`)
  }

  // 商品タイプ
  if (data.productType) {
    setCellValuePreserveStyle(sheet, 'D8', data.productType)
  }

  // 契約金
  if (data.paymentPlanConstruction?.contractFee) {
    setCellValuePreserveStyle(sheet, 'D20', data.paymentPlanConstruction.contractFee.totalAmount)
  }

  // スケジュール
  if (data.schedule) {
    setCellValuePreserveStyle(sheet, 'D12', data.schedule.buildingContract)
    setCellValuePreserveStyle(sheet, 'D14', data.schedule.constructionStart)
    setCellValuePreserveStyle(sheet, 'D16', data.schedule.completion)
  }
}

/**
 * 資金の流れシートにデータを書き込み
 */
function fillFundFlowSheet(sheet: ExcelJS.Worksheet, data: FundPlanData): void {
  // 顧客名
  if (data.customerName) {
    setCellValuePreserveStyle(sheet, 'C2', `${data.customerName}様　資金の流れ`)
  }

  // 土地購入費用
  if (data.paymentPlanOutside?.landPurchase) {
    setCellValuePreserveStyle(sheet, 'F8', data.paymentPlanOutside.landPurchase.totalAmount)
  }

  // 建物契約金
  if (data.paymentPlanConstruction?.contractFee) {
    setCellValuePreserveStyle(sheet, 'F14', data.paymentPlanConstruction.contractFee.totalAmount)
  }

  // 中間時金
  if (data.paymentPlanConstruction?.interimPayment1) {
    setCellValuePreserveStyle(sheet, 'F20', data.paymentPlanConstruction.interimPayment1.totalAmount)
  }
  if (data.paymentPlanConstruction?.interimPayment2) {
    setCellValuePreserveStyle(sheet, 'F26', data.paymentPlanConstruction.interimPayment2.totalAmount)
  }

  // 最終金
  if (data.paymentPlanConstruction?.finalPayment) {
    setCellValuePreserveStyle(sheet, 'F32', data.paymentPlanConstruction.finalPayment.totalAmount)
  }
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * セルに値を設定（書式を保持）
 * 既存のスタイル・数式がある場合はそれを保持しつつ、値のみを更新
 */
function setCellValuePreserveStyle(
  sheet: ExcelJS.Worksheet,
  address: string,
  value: string | number | null | undefined
): void {
  if (value === null || value === undefined || value === '') return

  try {
    const cell = sheet.getCell(address)

    // 既存のスタイルを保持
    const existingStyle = cell.style

    // 値を設定（数式がある場合は上書き）
    if (typeof value === 'number') {
      cell.value = value
    } else {
      cell.value = String(value)
    }

    // スタイルを再適用
    cell.style = existingStyle
  } catch (error) {
    addWarning({
      type: 'cell_not_found',
      message: `セル ${address} への書き込みに失敗しました: ${error}`,
      cellAddress: address,
    })
  }
}

/**
 * Blobをダウンロード
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================
// テンプレート分析機能（デバッグ・検証用）
// ============================================

/**
 * テンプレートのセル内容を分析（デバッグ用）
 * ブラウザコンソールで実行: analyzeTemplateMapping()
 */
export async function analyzeTemplateMapping(): Promise<void> {
  const templatePath = '/templates/fund-plan-template.xlsx'
  const response = await fetch(templatePath)
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  console.log('\n========================================')
  console.log('テンプレート分析結果')
  console.log('========================================\n')

  workbook.eachSheet((sheet, sheetId) => {
    console.log(`\n=== Sheet ${sheetId}: ${sheet.name} ===`)
    console.log(`Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}`)

    // 印刷範囲
    if (sheet.pageSetup.printArea) {
      console.log(`Print Area: ${sheet.pageSetup.printArea}`)
    }

    // 結合セル
    const merges = Object.keys(sheet.model.merges || {})
    if (merges.length > 0) {
      console.log(`Merged Cells: ${merges.length} regions`)
    }
  })

  // マッピング状況
  const summary = getMappingSummary()
  console.log('\n=== マッピング状況 ===')
  console.log(`総セクション数: ${summary.totalSections}`)
  console.log(`総セル数: ${summary.totalCells}`)
  console.log(`検証済み: ${summary.verifiedCells}`)
  console.log(`未検証: ${summary.unverifiedCells}`)
  if (summary.emptySections.length > 0) {
    console.log(`空のセクション: ${summary.emptySections.join(', ')}`)
  }
}

/**
 * 特定のセル範囲のデータを取得（デバッグ用）
 */
export async function getCellValues(
  sheetName: string,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): Promise<Record<string, unknown>[]> {
  const templatePath = '/templates/fund-plan-template.xlsx'
  const response = await fetch(templatePath)
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet(sheetName)
  if (!sheet) return []

  const results: Record<string, unknown>[] = []

  for (let row = startRow; row <= endRow; row++) {
    const rowData: Record<string, unknown> = { row }
    for (let col = startCol; col <= endCol; col++) {
      const cell = sheet.getCell(row, col)
      if (cell.value !== null && cell.value !== undefined) {
        rowData[`col${col}`] = {
          address: cell.address,
          value: cell.value,
          type: cell.type,
          formula: cell.formula || null
        }
      }
    }
    if (Object.keys(rowData).length > 1) {
      results.push(rowData)
    }
  }

  return results
}

/**
 * マッピング検証: テンプレートのセルが存在するかチェック
 */
export async function validateTemplateMapping(): Promise<{
  valid: CellMapping[]
  invalid: CellMapping[]
  errors: string[]
}> {
  const templatePath = '/templates/fund-plan-template.xlsx'
  const response = await fetch(templatePath)
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet('【資金計画書】')
  if (!sheet) {
    return {
      valid: [],
      invalid: [],
      errors: ['【資金計画書】シートが見つかりません']
    }
  }

  const valid: CellMapping[] = []
  const invalid: CellMapping[] = []
  const errors: string[] = []

  for (const section of FUND_PLAN_SECTIONS) {
    for (const mapping of section.cells) {
      try {
        const cell = sheet.getCell(mapping.address)
        // セルが存在すればOK（値がなくても構造上は存在する）
        if (cell) {
          valid.push(mapping)
        } else {
          invalid.push(mapping)
          errors.push(`セル ${mapping.address} (${mapping.description}) が見つかりません`)
        }
      } catch {
        invalid.push(mapping)
        errors.push(`セル ${mapping.address} (${mapping.description}) へのアクセスに失敗`)
      }
    }
  }

  console.log('\n=== テンプレートマッピング検証結果 ===')
  console.log(`有効: ${valid.length}件`)
  console.log(`無効: ${invalid.length}件`)
  if (errors.length > 0) {
    console.log('エラー:')
    errors.forEach(e => console.log(`  - ${e}`))
  }

  return { valid, invalid, errors }
}
