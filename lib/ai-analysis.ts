// AI分析サービス
// 注意: 本番環境ではOpenAI APIやClaude APIに接続してください

import type { StoredFile } from '@/store'

// 土地探し条件（抽出結果）
export interface ExtractedLandConditions {
  areas: string[]           // エリア（市区町村）
  minPrice?: number         // 最低価格（万円）
  maxPrice?: number         // 最高価格（万円）
  minLandArea?: number      // 最低面積（㎡）
  maxLandArea?: number      // 最高面積（㎡）
  stationWalkMax?: number   // 駅徒歩（分）
  roadWidthMin?: number     // 道路幅員（m）
  preferSouth?: boolean     // 南向き希望
  otherConditions: string[] // その他条件
  confidence: number        // 信頼度 0-100
}

export interface AnalysisResult {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keywords: string[]
  actionItems: string[]
  customerIntent: string
  riskLevel: 'low' | 'medium' | 'high'
  nextSteps: string[]
  landConditions?: ExtractedLandConditions  // 土地条件（抽出できた場合）
  analyzedAt: string
}

// モック分析（デモ用）- 本番ではAPIに置き換え
export async function analyzeCustomerRecords(
  records: StoredFile[],
  customerName: string
): Promise<AnalysisResult> {
  // メモとドキュメントのテキストを収集
  const memoTexts = records
    .filter((r) => r.category === 'memo' && r.memoContent)
    .map((r) => r.memoContent)
    .join('\n')

  // 簡易的なキーワード抽出（本番ではNLPを使用）
  const keywords = extractKeywords(memoTexts)
  const sentiment = analyzeSentiment(memoTexts)
  const riskLevel = assessRisk(memoTexts, records)

  // 土地探し条件を抽出
  const landConditions = extractLandConditions(memoTexts)

  // シミュレーション遅延
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return {
    summary: generateSummary(customerName, records, memoTexts),
    sentiment,
    keywords,
    actionItems: generateActionItems(memoTexts, sentiment),
    customerIntent: detectIntent(memoTexts),
    riskLevel,
    nextSteps: generateNextSteps(sentiment, riskLevel),
    landConditions: landConditions.confidence > 30 ? landConditions : undefined,
    analyzedAt: new Date().toISOString(),
  }
}

// キーワード抽出
function extractKeywords(text: string): string[] {
  const keywordPatterns = [
    '平屋', '二世帯', 'ZEH', '太陽光', '蓄電池', 'エアコン',
    '南向き', 'LDK', '駐車場', '土地', '予算', 'ローン',
    '契約', '見積', 'プラン', '設計', '着工', '引渡',
    '長期優良', '耐震', '断熱', '省エネ', 'オール電化',
  ]

  return keywordPatterns.filter((keyword) =>
    text.includes(keyword)
  )
}

// センチメント分析
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['興味', '希望', '検討', '前向き', '良い', '満足', '決定', '契約']
  const negativeWords = ['保留', '不安', '高い', '難しい', '他社', '延期', 'キャンセル']

  let score = 0
  positiveWords.forEach((word) => {
    if (text.includes(word)) score += 1
  })
  negativeWords.forEach((word) => {
    if (text.includes(word)) score -= 1
  })

  if (score > 1) return 'positive'
  if (score < -1) return 'negative'
  return 'neutral'
}

// リスク評価
function assessRisk(
  text: string,
  records: StoredFile[]
): 'low' | 'medium' | 'high' {
  const highRiskWords = ['他社', 'キャンセル', '延期', '予算オーバー']
  const mediumRiskWords = ['保留', '検討中', '不安', '迷い']

  for (const word of highRiskWords) {
    if (text.includes(word)) return 'high'
  }
  for (const word of mediumRiskWords) {
    if (text.includes(word)) return 'medium'
  }

  // 最近の記録がない場合もリスク
  const recentRecords = records.filter((r) => {
    const uploadDate = new Date(r.uploadedAt)
    const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpload < 14
  })

  if (recentRecords.length === 0 && records.length > 0) {
    return 'medium'
  }

  return 'low'
}

// サマリー生成
function generateSummary(
  customerName: string,
  records: StoredFile[],
  memoTexts: string
): string {
  const memoCount = records.filter((r) => r.category === 'memo').length
  const audioCount = records.filter((r) => r.category === 'audio').length
  const docCount = records.filter((r) => r.category === 'document').length

  let summary = `${customerName}様との商談記録を分析しました。`
  summary += `\n\n記録数: メモ${memoCount}件、音声${audioCount}件、書類${docCount}件`

  if (memoTexts.includes('平屋') || memoTexts.includes('二世帯')) {
    summary += '\n\n【建物タイプ】特殊な建物タイプ（平屋または二世帯）を希望されています。'
  }

  if (memoTexts.includes('土地')) {
    summary += '\n\n【土地】土地に関する相談があります。'
  }

  if (memoTexts.includes('ローン') || memoTexts.includes('予算')) {
    summary += '\n\n【資金】資金計画に関する話題があります。'
  }

  return summary
}

// アクションアイテム生成
function generateActionItems(
  text: string,
  sentiment: 'positive' | 'neutral' | 'negative'
): string[] {
  const items: string[] = []

  if (text.includes('土地')) {
    items.push('土地情報の提案を準備')
  }
  if (text.includes('プラン') || text.includes('設計')) {
    items.push('プラン案の作成・修正')
  }
  if (text.includes('見積') || text.includes('予算')) {
    items.push('資金計画書の更新')
  }
  if (text.includes('ローン')) {
    items.push('ローン事前審査の確認')
  }

  if (sentiment === 'negative') {
    items.push('顧客の懸念点をヒアリング')
    items.push('競合他社との比較資料を準備')
  }

  if (items.length === 0) {
    items.push('次回打ち合わせの日程調整')
  }

  return items
}

// 意図検出
function detectIntent(text: string): string {
  if (text.includes('契約')) return '契約に向けて進行中'
  if (text.includes('申込')) return '建築申込を検討中'
  if (text.includes('見積')) return '見積・提案を希望'
  if (text.includes('土地')) return '土地探しから開始'
  if (text.includes('見学') || text.includes('モデルハウス')) return '情報収集段階'
  return '検討初期段階'
}

// 次のステップ提案
function generateNextSteps(
  sentiment: 'positive' | 'neutral' | 'negative',
  riskLevel: 'low' | 'medium' | 'high'
): string[] {
  const steps: string[] = []

  if (riskLevel === 'high') {
    steps.push('早急にフォローアップの連絡を入れる')
    steps.push('顧客の懸念点を直接確認')
    steps.push('上長への相談・エスカレーション')
  } else if (riskLevel === 'medium') {
    steps.push('1週間以内にフォローアップ')
    steps.push('追加の提案資料を準備')
  }

  if (sentiment === 'positive') {
    steps.push('次のステージへの移行を提案')
    steps.push('契約に向けたスケジュール確認')
  }

  if (steps.length === 0) {
    steps.push('定期的なコンタクトを継続')
    steps.push('ニーズの変化をヒアリング')
  }

  return steps
}

// =============================================
// 土地探し条件抽出
// =============================================

/**
 * テキストから土地探し条件を抽出
 * 本番環境ではOpenAI/Claude APIで高精度な抽出を行う
 */
function extractLandConditions(text: string): ExtractedLandConditions {
  const conditions: ExtractedLandConditions = {
    areas: [],
    otherConditions: [],
    confidence: 0,
  }

  let matchCount = 0

  // エリア抽出（関西の市区町村）
  const areaPatterns = [
    // 大阪府
    '豊中市', '吹田市', '茨木市', '高槻市', '枚方市', '寝屋川市', '守口市', '門真市',
    '大東市', '東大阪市', '八尾市', '堺市', '松原市', '藤井寺市', '羽曳野市', '富田林市',
    '河内長野市', '大阪狭山市', '箕面市', '池田市', '豊能町', '能勢町', '摂津市', '交野市',
    '大阪市北区', '大阪市中央区', '大阪市西区', '大阪市天王寺区', '大阪市阿倍野区',
    // 兵庫県
    '西宮市', '芦屋市', '宝塚市', '伊丹市', '尼崎市', '川西市', '三田市', '神戸市',
    '明石市', '加古川市', '姫路市',
    // 京都府
    '京都市', '長岡京市', '向日市', '宇治市', '城陽市', '京田辺市', '木津川市',
    // 奈良県
    '奈良市', '生駒市', '大和郡山市', '天理市', '橿原市', '香芝市', '王寺町',
    // 滋賀県
    '大津市', '草津市', '守山市', '栗東市', '野洲市',
  ]

  for (const area of areaPatterns) {
    if (text.includes(area)) {
      conditions.areas.push(area)
      matchCount++
    }
  }

  // 価格抽出
  const pricePatterns = [
    // 「3000万円以下」「3000万以下」「3000万円まで」
    /(\d{1,5})万円?(?:以下|まで|以内)/g,
    // 「3000万〜4000万」
    /(\d{1,5})万円?(?:〜|～|から)(\d{1,5})万円?/g,
    // 「予算3000万」「予算は3000万円」
    /予算[はが]?(\d{1,5})万円?/g,
    // 「3000万円くらい」「3000万程度」
    /(\d{1,5})万円?(?:くらい|程度|前後)/g,
  ]

  // 「〜万円以下」パターン
  const maxPriceMatch = text.match(/(\d{1,5})万円?(?:以下|まで|以内)/)
  if (maxPriceMatch) {
    conditions.maxPrice = parseInt(maxPriceMatch[1])
    matchCount++
  }

  // 「〜万円から」パターン
  const minPriceMatch = text.match(/(\d{1,5})万円?(?:以上|から)/)
  if (minPriceMatch) {
    conditions.minPrice = parseInt(minPriceMatch[1])
    matchCount++
  }

  // 「予算〜万円」パターン
  const budgetMatch = text.match(/予算[はが]?(\d{1,5})万円?/)
  if (budgetMatch && !conditions.maxPrice) {
    // 予算の±20%を範囲とする
    const budget = parseInt(budgetMatch[1])
    conditions.minPrice = Math.floor(budget * 0.8)
    conditions.maxPrice = Math.floor(budget * 1.2)
    matchCount++
  }

  // 「〜万円くらい」パターン
  const approxMatch = text.match(/(\d{1,5})万円?(?:くらい|程度|前後)/)
  if (approxMatch && !conditions.maxPrice) {
    const approx = parseInt(approxMatch[1])
    conditions.minPrice = Math.floor(approx * 0.85)
    conditions.maxPrice = Math.floor(approx * 1.15)
    matchCount++
  }

  // 面積抽出
  const areaMatch = text.match(/(\d{2,3})(?:坪|㎡|平米)/)
  if (areaMatch) {
    const areaValue = parseInt(areaMatch[1])
    // 坪なら㎡に変換
    const sqm = text.includes('坪') ? areaValue * 3.3 : areaValue
    conditions.minLandArea = Math.floor(sqm * 0.9)
    conditions.maxLandArea = Math.floor(sqm * 1.2)
    matchCount++
  }

  // 駅徒歩
  const walkMatch = text.match(/駅(?:から)?(?:徒歩)?(\d{1,2})分(?:以内)?/)
  if (walkMatch) {
    conditions.stationWalkMax = parseInt(walkMatch[1])
    matchCount++
  }
  // 「駅近」「駅チカ」
  if (text.includes('駅近') || text.includes('駅チカ')) {
    conditions.stationWalkMax = 10
    matchCount++
  }

  // 道路幅員
  const roadMatch = text.match(/道路(?:幅)?(\d+(?:\.\d+)?)(?:m|メートル)/)
  if (roadMatch) {
    conditions.roadWidthMin = parseFloat(roadMatch[1])
    matchCount++
  }

  // 南向き希望
  if (text.includes('南向き') || text.includes('南側') || text.includes('日当たり')) {
    conditions.preferSouth = true
    matchCount++
  }

  // その他条件
  const otherPatterns = [
    { pattern: '整形地', condition: '整形地希望' },
    { pattern: '角地', condition: '角地希望' },
    { pattern: '旗竿地', condition: '旗竿地NG' },
    { pattern: '駐車場2台', condition: '駐車場2台分' },
    { pattern: '駐車2台', condition: '駐車場2台分' },
    { pattern: '駐車場3台', condition: '駐車場3台分' },
    { pattern: '小学校', condition: '小学校近く' },
    { pattern: '学区', condition: '学区重視' },
    { pattern: '閑静', condition: '閑静な住宅街' },
    { pattern: '建築条件なし', condition: '建築条件なし' },
    { pattern: '建築条件付', condition: '建築条件付でもOK' },
  ]

  for (const { pattern, condition } of otherPatterns) {
    if (text.includes(pattern)) {
      conditions.otherConditions.push(condition)
      matchCount++
    }
  }

  // 信頼度計算
  // 条件が多いほど、具体的な数値があるほど信頼度UP
  conditions.confidence = Math.min(100, matchCount * 15 + (conditions.areas.length > 0 ? 20 : 0))

  return conditions
}

// 音声ファイルの文字起こし（将来の拡張用）
export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  // 本番ではWhisper APIなどを使用
  // 現在はプレースホルダー
  return '（音声の文字起こしには外部APIの設定が必要です）'
}
