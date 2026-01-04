/**
 * 入力セル特定スクリプト
 *
 * テンプレートの各セクションを詳細分析し、入力セルを正確に特定
 *
 * 実行方法:
 * npx tsx scripts/analyze-input-cells.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

interface InputCell {
  address: string
  row: number
  col: number
  value: unknown
  dataPath: string
  section: string
  verified: boolean
  nearbyLabel?: string
}

async function analyzeInputCells() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('======================================')
  console.log('入力セル詳細分析')
  console.log('======================================\n')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const sheetOrUndef = workbook.getWorksheet('【資金計画書】')
  if (!sheetOrUndef) {
    console.error('【資金計画書】シートが見つかりません')
    process.exit(1)
  }
  const sheet = sheetOrUndef

  const inputCells: InputCell[] = []

  // ヘルパー関数: セルの値を文字列で取得
  function getCellText(row: number, col: number): string {
    const cell = sheet.getCell(row, col)
    if (!cell.value) return ''
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
      return (cell.value as { richText: Array<{ text: string }> }).richText
        .map(rt => rt.text).join('')
    }
    return String(cell.value)
  }

  // ヘルパー関数: 数値セルかどうか
  function isNumberCell(row: number, col: number): boolean {
    const cell = sheet.getCell(row, col)
    return typeof cell.value === 'number' && !cell.formula
  }

  // ヘルパー関数: 列文字を取得
  function getColLetter(col: number): string {
    let letter = ''
    let c = col
    while (c > 0) {
      const mod = (c - 1) % 26
      letter = String.fromCharCode(65 + mod) + letter
      c = Math.floor((c - 1) / 26)
    }
    return letter
  }

  // ===============================================
  // 1. ヘッダーセクション（行1）
  // ===============================================
  console.log('=== 1. ヘッダーセクション (Row 1) ===\n')

  // 行1の全セルをスキャン
  for (let col = 1; col <= 120; col++) {
    const cell = sheet.getCell(1, col)
    if (cell.value !== null && cell.value !== undefined) {
      const colLetter = getColLetter(col)
      const val = typeof cell.value === 'object' ?
        JSON.stringify(cell.value).substring(0, 50) :
        String(cell.value).substring(0, 30)
      const isFormula = cell.formula ? ' [FORMULA]' : ''
      console.log(`  ${colLetter}1: ${val}${isFormula}`)
    }
  }

  // ヘッダーの既知の入力セル
  const headerCells = [
    { col: 'AH', dataPath: 'teiName', label: '邸名' },
    { col: 'N', dataPath: 'productType', label: '商品タイプ' },
    { col: 'CA', dataPath: 'constructionArea', label: '施工面積' },
    { col: 'CJ', dataPath: 'floorCount', label: '階数' },
    { col: 'BG', dataPath: 'fireProtectionZone', label: '準防火' },
    { col: 'BM', dataPath: 'buildingStructure', label: '建物構造' },
    { col: 'DA', dataPath: 'estimateDate', label: '見積日' },
  ]

  for (const h of headerCells) {
    const colNum = getColNumber(h.col)
    const cell = sheet.getCell(1, colNum)
    console.log(`  [MAPPED] ${h.col}1 -> ${h.dataPath}: ${cell.value}`)
    inputCells.push({
      address: `${h.col}1`,
      row: 1,
      col: colNum,
      value: cell.value,
      dataPath: h.dataPath,
      section: 'header',
      verified: true,
      nearbyLabel: h.label
    })
  }

  // ===============================================
  // 2. 付帯工事費A（確認申請等）
  // ===============================================
  console.log('\n=== 2. 付帯工事費A（確認申請等）===\n')

  // 行2-15をスキャンして確認申請関連のラベルと値を探す
  const incidentalAPatterns = [
    { pattern: /確認申請/, dataPath: 'incidentalCostA.confirmationApplicationFee' },
    { pattern: /構造計算(?!図)/, dataPath: 'incidentalCostA.structuralCalculation' },
    { pattern: /構造図/, dataPath: 'incidentalCostA.structuralDrawingFee' },
    { pattern: /BELS/, dataPath: 'incidentalCostA.belsApplicationFee' },
    { pattern: /長期優良/, dataPath: 'incidentalCostA.longTermHousingApplicationFee' },
    { pattern: /瑕疵保険|地盤保証/, dataPath: 'incidentalCostA.defectInsuranceGroundTermiteWarranty' },
  ]

  for (let row = 2; row <= 20; row++) {
    for (let col = 1; col <= 60; col++) {
      const text = getCellText(row, col)
      for (const p of incidentalAPatterns) {
        if (p.pattern.test(text)) {
          // このラベルの右側を探す
          for (let c2 = col + 1; c2 <= col + 20; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 20)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'incidentalCostA',
                verified: false,
                nearbyLabel: text.substring(0, 30)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 3. 付帯工事費B（太陽光・蓄電池）
  // ===============================================
  console.log('\n=== 3. 付帯工事費B（太陽光・蓄電池）===\n')

  const incidentalBPatterns = [
    { pattern: /太陽光発電/, dataPath: 'incidentalCostB.solarPanelCost' },
    { pattern: /蓄電池/, dataPath: 'incidentalCostB.storageBatteryCost' },
  ]

  for (let row = 2; row <= 25; row++) {
    for (let col = 1; col <= 100; col++) {
      const text = getCellText(row, col)
      for (const p of incidentalBPatterns) {
        if (p.pattern.test(text)) {
          for (let c2 = col + 1; c2 <= col + 20; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 20)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'incidentalCostB',
                verified: false,
                nearbyLabel: text.substring(0, 30)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 4. 付帯工事費C（解体・地盤改良）
  // ===============================================
  console.log('\n=== 4. 付帯工事費C（解体・地盤改良）===\n')

  const incidentalCPatterns = [
    { pattern: /準防火地域/, dataPath: 'incidentalCostC.fireProtectionCost' },
    { pattern: /解体工事/, dataPath: 'incidentalCostC.demolitionCost' },
    { pattern: /地盤改良/, dataPath: 'incidentalCostC.groundImprovementFee' },
  ]

  for (let row = 2; row <= 30; row++) {
    for (let col = 1; col <= 100; col++) {
      const text = getCellText(row, col)
      for (const p of incidentalCPatterns) {
        if (p.pattern.test(text)) {
          for (let c2 = col + 1; c2 <= col + 20; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 20)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'incidentalCostC',
                verified: false,
                nearbyLabel: text.substring(0, 30)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 5. 借入計画（A/B/C銀行）
  // ===============================================
  console.log('\n=== 5. 借入計画 ===\n')

  // 行31-40を詳細分析
  const loanCells = [
    // A銀行（Row 33）
    { address: 'BA33', dataPath: 'loanPlan.bankA.amount', label: 'A銀行借入額' },
    { address: 'BG33', dataPath: 'loanPlan.bankA.interestRate', label: 'A銀行金利' },
    { address: 'BO33', dataPath: 'loanPlan.bankA.loanYears', label: 'A銀行借入年数' },
    // B銀行（Row 35）
    { address: 'BA35', dataPath: 'loanPlan.bankB.amount', label: 'B銀行借入額' },
    { address: 'BG35', dataPath: 'loanPlan.bankB.interestRate', label: 'B銀行金利' },
    { address: 'BO35', dataPath: 'loanPlan.bankB.loanYears', label: 'B銀行借入年数' },
    // C銀行（Row 37）
    { address: 'BA37', dataPath: 'loanPlan.bankC.amount', label: 'C銀行借入額' },
    { address: 'BG37', dataPath: 'loanPlan.bankC.interestRate', label: 'C銀行金利' },
    { address: 'BO37', dataPath: 'loanPlan.bankC.loanYears', label: 'C銀行借入年数' },
  ]

  for (const lc of loanCells) {
    const cell = sheet.getCell(lc.address)
    console.log(`  [VERIFIED] ${lc.address}: ${cell.value} (${lc.label})`)
    const match = lc.address.match(/([A-Z]+)(\d+)/)
    if (match) {
      inputCells.push({
        address: lc.address,
        row: parseInt(match[2]),
        col: getColNumber(match[1]),
        value: cell.value,
        dataPath: lc.dataPath,
        section: 'loanPlan',
        verified: true,
        nearbyLabel: lc.label
      })
    }
  }

  // ===============================================
  // 6. 工程スケジュール
  // ===============================================
  console.log('\n=== 6. 工程スケジュール ===\n')

  // CT-DG列、8-28行を分析
  const schedulePatterns = [
    { pattern: /土地契約/, dataPath: 'schedule.landContract' },
    { pattern: /建物契約/, dataPath: 'schedule.buildingContract' },
    { pattern: /仕様最終/, dataPath: 'schedule.finalSpecMeeting' },
    { pattern: /変更契約/, dataPath: 'schedule.changeContract' },
    { pattern: /着工/, dataPath: 'schedule.constructionStart' },
    { pattern: /上棟/, dataPath: 'schedule.roofRaising' },
    { pattern: /竣工/, dataPath: 'schedule.completion' },
  ]

  // CT列=98, DA列=105
  for (let row = 8; row <= 28; row++) {
    // CT列(98)からDA列(105)周辺を確認
    for (let col = 98; col <= 115; col++) {
      const text = getCellText(row, col)
      for (const p of schedulePatterns) {
        if (p.pattern.test(text)) {
          // このラベルの右側の日付セルを探す
          for (let c2 = col + 1; c2 <= col + 10; c2++) {
            const cell = sheet.getCell(row, c2)
            if (cell.value && !cell.formula) {
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 15)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'schedule',
                verified: false,
                nearbyLabel: text.substring(0, 20)
              })
              break
            }
          }
        }
      }
    }
  }

  // 既知のスケジュールセル
  const knownScheduleCells = [
    { address: 'DA8', dataPath: 'schedule.landContract', label: '土地契約' },
    { address: 'DA10', dataPath: 'schedule.buildingContract', label: '建物契約' },
    { address: 'DA18', dataPath: 'schedule.finalSpecMeeting', label: '仕様最終' },
    { address: 'DA20', dataPath: 'schedule.changeContract', label: '変更契約' },
    { address: 'DA22', dataPath: 'schedule.constructionStart', label: '着工' },
    { address: 'DA24', dataPath: 'schedule.roofRaising', label: '上棟' },
    { address: 'DA26', dataPath: 'schedule.completion', label: '竣工' },
  ]

  for (const sc of knownScheduleCells) {
    const cell = sheet.getCell(sc.address)
    console.log(`  [KNOWN] ${sc.address}: ${cell.value} (${sc.label})`)
  }

  // ===============================================
  // 7. 諸費用
  // ===============================================
  console.log('\n=== 7. 諸費用 ===\n')

  const miscPatterns = [
    { pattern: /つなぎローン/, dataPath: 'miscellaneousCosts.bridgeLoanFee' },
    { pattern: /金銭消費貸借.*印紙/, dataPath: 'miscellaneousCosts.loanContractStampDuty' },
    { pattern: /建物請負.*印紙/, dataPath: 'miscellaneousCosts.constructionContractStampDuty' },
    { pattern: /火災保険/, dataPath: 'miscellaneousCosts.fireInsurance' },
    { pattern: /外構工事/, dataPath: 'miscellaneousCosts.exteriorConstruction' },
    { pattern: /建物登記/, dataPath: 'miscellaneousCosts.buildingRegistrationFee' },
  ]

  for (let row = 2; row <= 50; row++) {
    for (let col = 1; col <= 100; col++) {
      const text = getCellText(row, col)
      for (const p of miscPatterns) {
        if (p.pattern.test(text)) {
          for (let c2 = col + 1; c2 <= col + 25; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 25)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'miscellaneousCosts',
                verified: false,
                nearbyLabel: text.substring(0, 30)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 8. 土地関連費用
  // ===============================================
  console.log('\n=== 8. 土地関連費用 ===\n')

  const landPatterns = [
    { pattern: /土地売買代金/, dataPath: 'landCosts.landPrice' },
    { pattern: /土地売買契約.*印紙/, dataPath: 'landCosts.landContractStampDuty' },
    { pattern: /土地仲介/, dataPath: 'landCosts.brokerageFee' },
    { pattern: /土地登記/, dataPath: 'landCosts.landRegistrationFee' },
  ]

  for (let row = 2; row <= 50; row++) {
    for (let col = 1; col <= 100; col++) {
      const text = getCellText(row, col)
      for (const p of landPatterns) {
        if (p.pattern.test(text)) {
          for (let c2 = col + 1; c2 <= col + 25; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 25)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'landCosts',
                verified: false,
                nearbyLabel: text.substring(0, 30)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 9. 支払い計画
  // ===============================================
  console.log('\n=== 9. 支払い計画 ===\n')

  const paymentPatterns = [
    { pattern: /契約金/, dataPath: 'paymentPlanConstruction.contractFee' },
    { pattern: /中間/, dataPath: 'paymentPlanConstruction.interimPayment' },
    { pattern: /最終金/, dataPath: 'paymentPlanConstruction.finalPayment' },
  ]

  for (let row = 15; row <= 30; row++) {
    for (let col = 50; col <= 80; col++) {
      const text = getCellText(row, col)
      for (const p of paymentPatterns) {
        if (p.pattern.test(text)) {
          for (let c2 = col + 1; c2 <= col + 15; c2++) {
            if (isNumberCell(row, c2)) {
              const cell = sheet.getCell(row, c2)
              const addr = `${getColLetter(c2)}${row}`
              console.log(`  ${addr}: ${cell.value} <- "${text.substring(0, 20)}" (${p.dataPath})`)
              inputCells.push({
                address: addr,
                row,
                col: c2,
                value: cell.value,
                dataPath: p.dataPath,
                section: 'paymentPlan',
                verified: false,
                nearbyLabel: text.substring(0, 25)
              })
              break
            }
          }
        }
      }
    }
  }

  // ===============================================
  // 結果サマリー
  // ===============================================
  console.log('\n========================================')
  console.log('分析結果サマリー')
  console.log('========================================\n')

  // 重複を除去
  const uniqueCells = new Map<string, InputCell>()
  for (const cell of inputCells) {
    uniqueCells.set(cell.address, cell)
  }

  const verifiedCells = Array.from(uniqueCells.values()).filter(c => c.verified)
  const unverifiedCells = Array.from(uniqueCells.values()).filter(c => !c.verified)

  console.log(`検証済みセル: ${verifiedCells.length}`)
  console.log(`未検証セル: ${unverifiedCells.length}`)
  console.log(`合計: ${uniqueCells.size}\n`)

  // セクション別カウント
  const sectionCounts = new Map<string, number>()
  for (const cell of uniqueCells.values()) {
    const count = sectionCounts.get(cell.section) || 0
    sectionCounts.set(cell.section, count + 1)
  }

  console.log('セクション別:')
  for (const [section, count] of sectionCounts) {
    console.log(`  ${section}: ${count}`)
  }

  // JSON出力
  const output = {
    totalCells: uniqueCells.size,
    verifiedCount: verifiedCells.length,
    unverifiedCount: unverifiedCells.length,
    cells: Array.from(uniqueCells.values()),
    sectionCounts: Object.fromEntries(sectionCounts),
  }

  const outputPath = path.join(__dirname, '../docs/input-cells-analysis.json')
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n結果を保存: ${outputPath}`)

  // マッピングコード生成
  console.log('\n========================================')
  console.log('推奨 cell-mapping.ts コード')
  console.log('========================================\n')

  const sections = ['header', 'loanPlan', 'schedule', 'incidentalCostA', 'incidentalCostB', 'incidentalCostC', 'miscellaneousCosts', 'landCosts', 'paymentPlan']

  for (const section of sections) {
    const sectionCells = Array.from(uniqueCells.values()).filter(c => c.section === section)
    if (sectionCells.length === 0) continue

    console.log(`// === ${section} ===`)
    for (const cell of sectionCells) {
      const typeGuess = cell.dataPath.includes('interestRate') ? 'number' :
                        cell.dataPath.includes('Date') || section === 'schedule' ? 'date' : 'number'
      console.log(`{
  address: '${cell.address}',
  dataPath: '${cell.dataPath}',
  description: '${cell.nearbyLabel || ''}',
  type: '${typeGuess}',
  verified: ${cell.verified},
},`)
    }
    console.log('')
  }
}

function getColNumber(col: string): number {
  let num = 0
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64)
  }
  return num
}

analyzeInputCells().catch(console.error)
