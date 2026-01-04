/**
 * セルマッピング検証スクリプト
 *
 * 実行方法:
 * npx tsx scripts/verify-mappings.ts
 */

import { FUND_PLAN_SECTIONS, getMappingSummary, getVerifiedMappings, getUnverifiedMappings } from '../lib/fund-plan/cell-mapping'

function verifyMappings() {
  console.log('======================================')
  console.log('セルマッピング検証レポート')
  console.log('======================================\n')

  const summary = getMappingSummary()

  console.log('【サマリー】')
  console.log(`  総セクション数: ${summary.totalSections}`)
  console.log(`  総セル数: ${summary.totalCells}`)
  console.log(`  検証済み: ${summary.verifiedCells}`)
  console.log(`  未検証: ${summary.unverifiedCells}`)
  console.log(`  検証率: ${((summary.verifiedCells / summary.totalCells) * 100).toFixed(1)}%`)

  if (summary.emptySections.length > 0) {
    console.log(`\n【空のセクション】`)
    for (const section of summary.emptySections) {
      console.log(`  - ${section}`)
    }
  }

  console.log('\n【セクション別詳細】')
  for (const section of FUND_PLAN_SECTIONS) {
    const verified = section.cells.filter(c => c.verified).length
    const total = section.cells.length
    const status = total === 0 ? '(空)' : `${verified}/${total} 検証済み`
    const percent = total > 0 ? ((verified / total) * 100).toFixed(0) : 0
    console.log(`\n  ${section.name}: ${status} (${percent}%)`)

    for (const cell of section.cells) {
      const icon = cell.verified ? '✓' : '?'
      console.log(`    ${icon} ${cell.address}: ${cell.description}`)
    }
  }

  console.log('\n\n【検証済みセル一覧】')
  const verified = getVerifiedMappings()
  for (const cell of verified) {
    console.log(`  ${cell.address} -> ${cell.dataPath}`)
  }

  console.log('\n【未検証セル一覧】')
  const unverified = getUnverifiedMappings()
  for (const cell of unverified) {
    console.log(`  ${cell.address} -> ${cell.dataPath}`)
  }

  console.log('\n======================================')
  console.log('検証完了')
  console.log('======================================')
}

verifyMappings()
