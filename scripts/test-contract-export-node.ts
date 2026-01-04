/**
 * 請負契約書Excel出力テストスクリプト（Node.js版）
 *
 * 直接ExcelJSを使用してファイルを読み書きします。
 *
 * 実行方法:
 * npx tsx scripts/test-contract-export-node.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import { createDefaultContractData } from '../types/contract'
import {
  CONTRACT_SECTIONS,
  getNestedValue,
  dateToExcelSerial,
  booleanToCircle,
  getContractMappingStats,
} from '../lib/contract/cell-mapping'

async function testContractExportNode() {
  console.log('======================================')
  console.log('請負契約書Excel出力テスト（Node.js版）')
  console.log('======================================\n')

  const templatePath = path.join(__dirname, '../public/templates/請負契約書のコピー.xlsx')
  const outputPath = path.join(__dirname, '../test-output-contract.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  // テストデータを作成
  const testData = createDefaultContractData()

  // 基本情報
  testData.constructionName = '大阪市旭区新森　テスト太郎様邸新築工事'
  testData.customerName = 'テスト太郎'
  testData.customerAddress = '大阪府大阪市中央区本町1-1-1'
  testData.customerName2 = 'テスト花子'
  testData.customerAddress2 = '大阪府大阪市中央区本町1-1-1'

  // 担当者情報
  testData.importantMatterExplainer.name = '田中　聡'
  testData.ownershipType = '共有'
  testData.salesRep = '田畑　美香'

  // 契約日
  testData.contractYear = 2026
  testData.contractMonth = 1
  testData.contractDay = 15

  // 建物情報
  testData.constructionSite = '大阪府大阪市旭区新森1-2-3'
  testData.structure = '木造軸組工法'
  testData.floorCount = 2
  testData.buildingCount = 1
  testData.floor1Area = 49.04
  testData.floor1Included = true
  testData.floor2Area = 44.81
  testData.floor2Included = true
  testData.floor3Area = 0
  testData.floor3Included = false
  testData.constructionArea = 28.4
  testData.constructionAreaIncluded = true

  // 工期
  testData.startDate = '2026-05-01'
  testData.completionDate = '2026-09-30'
  testData.deliveryDate = '2026-10-15'
  testData.contractDate = '2026-01-15'

  // 金額
  testData.constructionPrice = 25208700

  // 支払計画
  testData.payment1Amount = 100000
  testData.payment1Date = '2025-12-01'
  testData.payment2Amount = 1000000
  testData.payment2Date = '2026-01-15'
  testData.payment3Amount = 8300000
  testData.payment3Date = '2026-05-01'
  testData.payment4Amount = 8300000
  testData.payment4Date = '2026-06-15'

  // その他
  testData.contractNumber = '103999'
  testData.defectInsuranceCompany = '株式会社　日本住宅保証検査機構'

  // 変更契約
  testData.changeContract.changeContractYear = 2026
  testData.changeContract.changeContractMonth = 3
  testData.changeContract.changeContractDay = 15
  testData.changeContract.floorCount = 2
  testData.changeContract.buildingCount = 1

  console.log('テストデータ:')
  console.log('  工事名称:', testData.constructionName)
  console.log('  客先氏名:', testData.customerName)
  console.log('  階数:', testData.floorCount)
  console.log('  工事価格:', testData.constructionPrice.toLocaleString(), '円')
  console.log('')

  // マッピング統計
  const stats = getContractMappingStats()
  console.log('セルマッピング統計:')
  console.log(`  総セル数: ${stats.total}`)
  console.log(`  検証済み: ${stats.verified}`)
  console.log(`  未検証: ${stats.unverified}`)
  console.log('')

  try {
    // テンプレートを読み込み
    console.log('テンプレート読み込み中...')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const sheet = workbook.getWorksheet('初期入力')
    if (!sheet) {
      throw new Error('初期入力シートが見つかりません')
    }

    // セルに値を書き込み
    console.log('セルに値を書き込み中...')
    let writtenCount = 0
    const writtenCells: string[] = []

    for (const section of CONTRACT_SECTIONS) {
      for (const cellMapping of section.cells) {
        if (!cellMapping.verified) continue

        const value = getNestedValue(testData as unknown as Record<string, unknown>, cellMapping.dataPath)
        if (value === undefined || value === null || value === '') continue

        const cell = sheet.getCell(cellMapping.address)
        const originalStyle = cell.style

        // 型に応じた変換
        let cellValue: ExcelJS.CellValue

        switch (cellMapping.type) {
          case 'boolean':
            cellValue = booleanToCircle(value as boolean)
            break
          case 'dateSerial':
            cellValue = dateToExcelSerial(value as string)
            break
          case 'date':
            cellValue = new Date(value as string)
            break
          case 'number':
            cellValue = value as number
            break
          default:
            cellValue = String(value)
        }

        cell.value = cellValue
        cell.style = originalStyle

        writtenCells.push(`${cellMapping.address}: ${cellValue}`)
        writtenCount++
      }
    }

    console.log(`  書き込み完了: ${writtenCount}セル`)
    console.log('')

    // ファイルを保存
    console.log('ファイル保存中...')
    await workbook.xlsx.writeFile(outputPath)

    console.log('')
    console.log('======================================')
    console.log('出力完了!')
    console.log('======================================')
    console.log('')
    console.log('出力ファイル:', outputPath)
    console.log('')
    console.log('【書き込んだセル一覧】')
    for (const cell of writtenCells) {
      console.log('  ', cell)
    }
    console.log('')
    console.log('【確認手順】')
    console.log('1. 出力ファイルをExcelで開く')
    console.log('2. 元テンプレートと比較')
    console.log('3. 以下を確認:')
    console.log('   - 初期入力シートに値が正しく入っているか')
    console.log('   - 工事請負契約書シートに数式で反映されているか')
    console.log('   - 重要事項説明書シートに数式で反映されているか')
    console.log('   - 書式・レイアウトが保持されているか')

  } catch (error) {
    console.error('出力エラー:', error)
    process.exit(1)
  }
}

testContractExportNode().catch(console.error)
