/**
 * テンプレート深層分析スクリプト
 *
 * 入力セルを正確に特定するための高度な分析
 *
 * 実行方法:
 * npx tsx scripts/analyze-template-deep.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

interface CellAnalysis {
  address: string
  row: number
  col: number
  value: unknown
  formula?: string
  cellType: 'formula' | 'label' | 'number' | 'empty' | 'date' | 'input_candidate'
  isMerged: boolean
  mergeRange?: string
  style?: {
    hasBorder: boolean
    hasBackground: boolean
    fontBold: boolean
  }
}

interface InputCellCandidate {
  address: string
  row: number
  col: number
  nearbyLabel?: string
  labelAddress?: string
  currentValue: unknown
  suggestedDataPath?: string
  confidence: 'high' | 'medium' | 'low'
}

async function deepAnalyzeTemplate() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('========================================')
  console.log('テンプレート深層分析')
  console.log('========================================\n')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const fundPlanSheet = workbook.getWorksheet('【資金計画書】')
  if (!fundPlanSheet) {
    console.error('【資金計画書】シートが見つかりません')
    process.exit(1)
  }

  // 全セルを分析
  const allCells: CellAnalysis[] = []
  const inputCandidates: InputCellCandidate[] = []

  // 結合セル情報を取得
  const mergedCells = new Map<string, string>()
  const mergeRanges = Object.keys(fundPlanSheet.model.merges || {})
  for (const range of mergeRanges) {
    const [start] = range.split(':')
    mergedCells.set(start, range)
  }

  console.log('1. 全セルをスキャン中...\n')

  // 1-100行を分析
  for (let row = 1; row <= 100; row++) {
    for (let col = 1; col <= 120; col++) {
      const cell = fundPlanSheet.getCell(row, col)

      if ((cell.value === null || cell.value === undefined) && !cell.formula) {
        continue
      }

      const analysis: CellAnalysis = {
        address: cell.address,
        row,
        col,
        value: cell.value,
        isMerged: cell.isMerged,
        cellType: 'empty',
      }

      // 数式チェック
      if (cell.formula) {
        analysis.formula = cell.formula
        analysis.cellType = 'formula'
      }
      // 数値チェック
      else if (typeof cell.value === 'number') {
        analysis.cellType = 'number'
        // 数値で結合されていない = 入力候補
        if (!cell.isMerged) {
          inputCandidates.push({
            address: cell.address,
            row,
            col,
            currentValue: cell.value,
            confidence: 'high'
          })
        }
      }
      // 文字列チェック
      else if (typeof cell.value === 'string' ||
               (typeof cell.value === 'object' && cell.value !== null)) {
        // 結合セルでテキスト = ラベル
        if (cell.isMerged) {
          analysis.cellType = 'label'
        } else {
          // 結合されていない文字列 = 入力候補の可能性
          analysis.cellType = 'input_candidate'
          inputCandidates.push({
            address: cell.address,
            row,
            col,
            currentValue: cell.value,
            confidence: 'medium'
          })
        }
      }

      if (cell.value !== null && cell.value !== undefined) {
        allCells.push(analysis)
      }
    }
  }

  console.log(`分析完了: ${allCells.length} セル, ${inputCandidates.length} 入力候補\n`)

  // キーワードベースでラベルと入力セルを関連付け
  console.log('2. ラベルと入力セルの関連付け...\n')

  const labelPatterns = [
    { pattern: /邸/, dataPath: 'teiName', section: 'header' },
    { pattern: /商品|LIFE|HOURS/, dataPath: 'productType', section: 'header' },
    { pattern: /施工面積/, dataPath: 'constructionArea', section: 'header' },
    { pattern: /階数/, dataPath: 'floorCount', section: 'header' },
    { pattern: /準防火/, dataPath: 'fireProtectionZone', section: 'header' },
    { pattern: /建物構造/, dataPath: 'buildingStructure', section: 'header' },
    { pattern: /見積/, dataPath: 'estimateDate', section: 'header' },
    { pattern: /坪単価/, dataPath: 'pricePerTsubo', section: 'buildingMain' },
    { pattern: /確認申請/, dataPath: 'incidentalCostA.confirmationApplicationFee', section: 'incidentalCostA' },
    { pattern: /構造計算(?!図)/, dataPath: 'incidentalCostA.structuralCalculation', section: 'incidentalCostA' },
    { pattern: /構造図/, dataPath: 'incidentalCostA.structuralDrawingFee', section: 'incidentalCostA' },
    { pattern: /BELS/, dataPath: 'incidentalCostA.belsApplicationFee', section: 'incidentalCostA' },
    { pattern: /長期優良/, dataPath: 'incidentalCostA.longTermHousingApplicationFee', section: 'incidentalCostA' },
    { pattern: /瑕疵保険|地盤保証|シロアリ/, dataPath: 'incidentalCostA.defectInsuranceGroundTermiteWarranty', section: 'incidentalCostA' },
    { pattern: /太陽光発電システム/, dataPath: 'incidentalCostB.solarPanelCost', section: 'incidentalCostB' },
    { pattern: /蓄電池/, dataPath: 'incidentalCostB.storageBatteryCost', section: 'incidentalCostB' },
    { pattern: /準防火地域(?!判定)/, dataPath: 'incidentalCostC.fireProtectionCost', section: 'incidentalCostC' },
    { pattern: /解体工事/, dataPath: 'incidentalCostC.demolitionCost', section: 'incidentalCostC' },
    { pattern: /地盤改良/, dataPath: 'incidentalCostC.groundImprovementFee', section: 'incidentalCostC' },
    { pattern: /つなぎローン諸費用/, dataPath: 'miscellaneousCosts.bridgeLoanFee', section: 'miscellaneousCosts' },
    { pattern: /金銭消費貸借.*印紙/, dataPath: 'miscellaneousCosts.loanContractStampDuty', section: 'miscellaneousCosts' },
    { pattern: /建物請負.*印紙/, dataPath: 'miscellaneousCosts.constructionContractStampDuty', section: 'miscellaneousCosts' },
    { pattern: /火災保険/, dataPath: 'miscellaneousCosts.fireInsurance', section: 'miscellaneousCosts' },
    { pattern: /外構工事/, dataPath: 'miscellaneousCosts.exteriorConstruction', section: 'miscellaneousCosts' },
    { pattern: /土地売買代金/, dataPath: 'landCosts.landPrice', section: 'landCosts' },
    { pattern: /土地売買契約.*印紙/, dataPath: 'landCosts.landContractStampDuty', section: 'landCosts' },
    { pattern: /土地仲介/, dataPath: 'landCosts.brokerageFee', section: 'landCosts' },
    { pattern: /土地登記/, dataPath: 'landCosts.landRegistrationFee', section: 'landCosts' },
    { pattern: /A銀行/, dataPath: 'loanPlan.bankA', section: 'loanPlan' },
    { pattern: /B銀行/, dataPath: 'loanPlan.bankB', section: 'loanPlan' },
    { pattern: /C銀行/, dataPath: 'loanPlan.bankC', section: 'loanPlan' },
    { pattern: /借入額/, dataPath: 'amount', section: 'loanPlan' },
    { pattern: /金利(?!息)/, dataPath: 'interestRate', section: 'loanPlan' },
    { pattern: /借入年数/, dataPath: 'loanYears', section: 'loanPlan' },
    { pattern: /土地契約/, dataPath: 'schedule.landContract', section: 'schedule' },
    { pattern: /建物契約/, dataPath: 'schedule.buildingContract', section: 'schedule' },
    { pattern: /仕様最終/, dataPath: 'schedule.finalSpecMeeting', section: 'schedule' },
    { pattern: /変更契約/, dataPath: 'schedule.changeContract', section: 'schedule' },
    { pattern: /着工/, dataPath: 'schedule.constructionStart', section: 'schedule' },
    { pattern: /上棟/, dataPath: 'schedule.roofRaising', section: 'schedule' },
    { pattern: /竣工/, dataPath: 'schedule.completion', section: 'schedule' },
    { pattern: /契約金/, dataPath: 'paymentPlanConstruction.contractFee', section: 'paymentPlan' },
    { pattern: /中間/, dataPath: 'paymentPlanConstruction.interimPayment', section: 'paymentPlan' },
    { pattern: /最終金/, dataPath: 'paymentPlanConstruction.finalPayment', section: 'paymentPlan' },
  ]

  // ラベルセルを見つけて、右隣または下のセルを入力候補として記録
  const labelCells = allCells.filter(c => c.cellType === 'label')
  const foundMappings: Array<{
    label: string
    labelAddress: string
    inputAddress: string
    dataPath: string
    section: string
    row: number
    inputValue: unknown
  }> = []

  for (const labelCell of labelCells) {
    const labelText = String(labelCell.value)

    for (const pattern of labelPatterns) {
      if (pattern.pattern.test(labelText)) {
        // 右隣のセルを探す
        const rightCell = allCells.find(c =>
          c.row === labelCell.row &&
          c.col > labelCell.col &&
          c.col <= labelCell.col + 15 &&
          (c.cellType === 'number' || c.cellType === 'input_candidate')
        )

        if (rightCell) {
          foundMappings.push({
            label: labelText.substring(0, 30),
            labelAddress: labelCell.address,
            inputAddress: rightCell.address,
            dataPath: pattern.dataPath,
            section: pattern.section,
            row: labelCell.row,
            inputValue: rightCell.value
          })
        }
        break
      }
    }
  }

  // 行別に整理して出力
  console.log('3. 発見したマッピング（行別）:\n')

  const mappingsByRow = new Map<number, typeof foundMappings>()
  for (const m of foundMappings) {
    if (!mappingsByRow.has(m.row)) {
      mappingsByRow.set(m.row, [])
    }
    mappingsByRow.get(m.row)!.push(m)
  }

  const sortedRows = Array.from(mappingsByRow.keys()).sort((a, b) => a - b)
  for (const row of sortedRows) {
    const mappings = mappingsByRow.get(row)!
    console.log(`--- Row ${row} ---`)
    for (const m of mappings) {
      console.log(`  ${m.inputAddress}: ${m.dataPath}`)
      console.log(`    ラベル: "${m.label}" (${m.labelAddress})`)
      console.log(`    現在値: ${m.inputValue}`)
    }
  }

  // 特定の行範囲を詳細分析
  console.log('\n\n4. 特定セクションの詳細分析:\n')

  // 借入計画セクション（31-40行目）
  console.log('=== 借入計画セクション (Row 31-40) ===')
  const loanSection = allCells.filter(c => c.row >= 31 && c.row <= 40)
  for (const cell of loanSection) {
    if (cell.cellType !== 'empty') {
      const typeIcon = cell.cellType === 'formula' ? '📐' :
                       cell.cellType === 'number' ? '🔢' :
                       cell.cellType === 'label' ? '🏷️' : '📝'
      console.log(`  ${typeIcon} ${cell.address}: ${String(cell.value).substring(0, 25)} [${cell.cellType}]`)
    }
  }

  // 工程セクション（CT列周辺、8-28行目）
  console.log('\n=== 工程スケジュールセクション (CT-DG, Row 8-28) ===')
  for (let row = 8; row <= 28; row++) {
    const rowCells: string[] = []
    for (let col = 98; col <= 115; col++) { // CT=98, DG=111
      const cell = fundPlanSheet.getCell(row, col)
      if (cell.value !== null && cell.value !== undefined) {
        const colLetter = getColumnLetter(col)
        const val = cell.formula ? `=${cell.formula}` : String(cell.value).substring(0, 15)
        rowCells.push(`${colLetter}${row}:${val}`)
      }
    }
    if (rowCells.length > 0) {
      console.log(`  Row ${row}: ${rowCells.join(' | ')}`)
    }
  }

  // 生成するべきマッピングコードを出力
  console.log('\n\n5. 推奨セルマッピングコード:\n')

  const uniqueMappings = new Map<string, typeof foundMappings[0]>()
  for (const m of foundMappings) {
    const key = `${m.section}-${m.dataPath}`
    if (!uniqueMappings.has(key)) {
      uniqueMappings.set(key, m)
    }
  }

  console.log('// 以下を cell-mapping.ts に追加:')
  console.log('')

  const sectionGroups = new Map<string, Array<{address: string, dataPath: string, label: string}>>()
  for (const [, m] of uniqueMappings) {
    if (!sectionGroups.has(m.section)) {
      sectionGroups.set(m.section, [])
    }
    sectionGroups.get(m.section)!.push({
      address: m.inputAddress,
      dataPath: m.dataPath,
      label: m.label
    })
  }

  for (const [section, items] of sectionGroups) {
    console.log(`// ${section}`)
    for (const item of items) {
      console.log(`{
  address: '${item.address}',
  dataPath: '${item.dataPath}',
  description: '${item.label}',
  type: 'number',
  verified: true,
},`)
    }
    console.log('')
  }

  // 数値セルの一覧（入力セル候補）
  console.log('\n\n6. 数値セル一覧（入力セル候補）:\n')
  const numberCells = allCells.filter(c => c.cellType === 'number' && !c.isMerged)
  for (const cell of numberCells.slice(0, 50)) {
    console.log(`  ${cell.address}: ${cell.value}`)
  }

  // 結果をJSONに保存
  const outputPath = path.join(__dirname, '../docs/template-deep-analysis.json')
  const output = {
    totalCells: allCells.length,
    inputCandidates: inputCandidates.length,
    foundMappings: Array.from(uniqueMappings.values()),
    numberCells: numberCells.map(c => ({ address: c.address, value: c.value })),
  }
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n分析結果を保存: ${outputPath}`)
}

function getColumnLetter(col: number): string {
  let letter = ''
  while (col > 0) {
    const mod = (col - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    col = Math.floor((col - 1) / 26)
  }
  return letter
}

deepAnalyzeTemplate().catch(console.error)
