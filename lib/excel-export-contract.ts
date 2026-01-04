/**
 * 請負契約書 Excel出力ユーティリティ
 *
 * テンプレートの書式・数式・印刷設定を完全に保持したまま
 * セル値のみを書き換えてエクスポートします。
 *
 * 対応項目:
 * - 数式の保持（初期入力 → 各シートへの参照）
 * - 塗りつぶし・フォント・罫線
 * - 行の高さ・列の幅
 * - 印刷範囲・印刷設定
 * - 結合セル
 * - ヘッダー/フッター
 *
 * 重要:
 * テンプレートのセル位置は lib/contract/cell-mapping.ts で管理
 * テンプレートが変更された場合はセルマッピングを更新してください
 */

import ExcelJS from 'exceljs'
import type { ContractData } from '@/types/contract'
import {
  CONTRACT_SECTIONS,
  getVerifiedContractMappings,
  getNestedValue,
  dateToExcelSerial,
  booleanToCircle,
  getContractMappingStats,
} from './contract/cell-mapping'

// ============================================
// 警告・ログ機能
// ============================================

export interface ContractExportWarning {
  type: 'unmapped_field' | 'unverified_cell' | 'missing_value' | 'cell_not_found'
  message: string
  field?: string
  cellAddress?: string
}

let contractExportWarnings: ContractExportWarning[] = []

function clearContractWarnings(): void {
  contractExportWarnings = []
}

function addContractWarning(warning: ContractExportWarning): void {
  contractExportWarnings.push(warning)
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Contract Export] ${warning.type}: ${warning.message}`)
  }
}

export function getContractExportWarnings(): ContractExportWarning[] {
  return [...contractExportWarnings]
}

// ============================================
// メイン関数: テンプレートベース完全コピー版
// ============================================

/**
 * テンプレートを使用して請負契約書をExcel出力（完全コピー版）
 * 書式・数式・印刷設定をすべて保持します
 *
 * @param data - 請負契約書データ
 * @param filename - 出力ファイル名（省略時は自動生成）
 * @param options - オプション
 * @returns 警告情報の配列
 */
export async function exportContractWithExcelJS(
  data: ContractData,
  filename?: string,
  options?: {
    showWarnings?: boolean
    skipUnverified?: boolean
  }
): Promise<ContractExportWarning[]> {
  clearContractWarnings()

  const { showWarnings = true, skipUnverified = true } = options || {}

  try {
    // マッピング状況をチェック
    const stats = getContractMappingStats()
    if (stats.unverified > 0 && showWarnings) {
      addContractWarning({
        type: 'unverified_cell',
        message: `未検証セル: ${stats.unverified}件`,
      })
    }

    // テンプレートファイルを読み込み
    const templatePath = '/templates/請負契約書のコピー.xlsx'
    const response = await fetch(templatePath)

    if (!response.ok) {
      throw new Error(`テンプレートファイルの読み込みに失敗しました: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    // ExcelJSでワークブックを読み込み
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    // 初期入力シートを取得
    const inputSheet = workbook.getWorksheet('初期入力')
    if (inputSheet) {
      fillContractInputSheet(inputSheet, data, skipUnverified)
    } else {
      addContractWarning({
        type: 'cell_not_found',
        message: '初期入力シートが見つかりません',
      })
    }

    // Blobとしてダウンロード
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const defaultFilename = `請負契約書_${data.constructionName || data.customerName}_${new Date().toISOString().split('T')[0]}`
    downloadBlob(blob, filename || `${defaultFilename}.xlsx`)

    // 警告をコンソールに表示
    if (showWarnings && contractExportWarnings.length > 0) {
      console.log(`[Contract Export] ${contractExportWarnings.length}件の警告があります:`)
      contractExportWarnings.forEach((w, i) => console.log(`  ${i + 1}. ${w.message}`))
    }

    return getContractExportWarnings()
  } catch (error) {
    console.error('Contract Excel出力エラー:', error)
    throw error
  }
}

// ============================================
// シートデータ書き込み関数
// ============================================

/**
 * 初期入力シートにデータを書き込み（マッピングベース）
 * セル位置は cell-mapping.ts で管理
 */
function fillContractInputSheet(
  sheet: ExcelJS.Worksheet,
  data: ContractData,
  skipUnverified: boolean
): void {
  // 検証済みマッピングを取得
  const verifiedMappings = getVerifiedContractMappings()

  // 各マッピングに対してデータを書き込み
  for (const mapping of verifiedMappings) {
    const value = getNestedValue(data as unknown as Record<string, unknown>, mapping.dataPath)

    if (value === undefined || value === null || value === '') {
      continue
    }

    // 型に応じた変換処理
    let cellValue: ExcelJS.CellValue

    switch (mapping.type) {
      case 'boolean':
        cellValue = booleanToCircle(value as boolean)
        break

      case 'dateSerial':
        if (typeof value === 'string') {
          cellValue = dateToExcelSerial(value)
        } else {
          cellValue = value as number
        }
        break

      case 'date':
        if (typeof value === 'string') {
          cellValue = new Date(value)
        } else {
          cellValue = value as Date
        }
        break

      case 'number':
        cellValue = value as number
        break

      case 'string':
      default:
        cellValue = String(value)
        break
    }

    // セルに値を設定（書式を保持）
    setCellValuePreserveStyle(sheet, mapping.address, cellValue)
  }

  // 未検証マッピングの警告
  if (!skipUnverified) {
    for (const section of CONTRACT_SECTIONS) {
      for (const mapping of section.cells) {
        if (!mapping.verified) {
          addContractWarning({
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

// ============================================
// ユーティリティ関数
// ============================================

/**
 * セルに値を設定（書式を保持）
 */
function setCellValuePreserveStyle(
  sheet: ExcelJS.Worksheet,
  address: string,
  value: ExcelJS.CellValue
): void {
  if (value === null || value === undefined || value === '') return

  try {
    const cell = sheet.getCell(address)

    // 既存のスタイルを保持
    const existingStyle = cell.style

    // 値を設定
    cell.value = value

    // スタイルを再適用
    cell.style = existingStyle
  } catch (error) {
    addContractWarning({
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
 */
export async function analyzeContractTemplate(): Promise<void> {
  const templatePath = '/templates/請負契約書のコピー.xlsx'
  const response = await fetch(templatePath)
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  console.log('\n========================================')
  console.log('請負契約書テンプレート分析結果')
  console.log('========================================\n')

  workbook.eachSheet((sheet, sheetId) => {
    console.log(`\n=== Sheet ${sheetId}: ${sheet.name} ===`)
    console.log(`Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}`)
  })

  // マッピング状況
  const stats = getContractMappingStats()
  console.log('\n=== マッピング状況 ===')
  console.log(`総セル数: ${stats.total}`)
  console.log(`検証済み: ${stats.verified}`)
  console.log(`未検証: ${stats.unverified}`)
  console.log('\nセクション別:')
  stats.bySection.forEach((s) => {
    console.log(`  ${s.name}: ${s.verified}/${s.total}`)
  })
}

/**
 * マッピング検証: テンプレートのセルが存在するかチェック
 */
export async function validateContractMapping(): Promise<{
  valid: number
  invalid: number
  errors: string[]
}> {
  const templatePath = '/templates/請負契約書のコピー.xlsx'
  const response = await fetch(templatePath)
  const arrayBuffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.getWorksheet('初期入力')
  if (!sheet) {
    return {
      valid: 0,
      invalid: 0,
      errors: ['初期入力シートが見つかりません'],
    }
  }

  let valid = 0
  let invalid = 0
  const errors: string[] = []

  for (const section of CONTRACT_SECTIONS) {
    for (const mapping of section.cells) {
      try {
        const cell = sheet.getCell(mapping.address)
        if (cell) {
          valid++
        } else {
          invalid++
          errors.push(`セル ${mapping.address} (${mapping.description}) が見つかりません`)
        }
      } catch {
        invalid++
        errors.push(`セル ${mapping.address} (${mapping.description}) へのアクセスに失敗`)
      }
    }
  }

  console.log('\n=== 請負契約書テンプレートマッピング検証結果 ===')
  console.log(`有効: ${valid}件`)
  console.log(`無効: ${invalid}件`)
  if (errors.length > 0) {
    console.log('エラー:')
    errors.forEach((e) => console.log(`  - ${e}`))
  }

  return { valid, invalid, errors }
}
