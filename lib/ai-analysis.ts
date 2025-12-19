// AI分析サービス
// 注意: 本番環境ではOpenAI APIやClaude APIに接続してください

import type { StoredFile } from '@/store'

export interface AnalysisResult {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keywords: string[]
  actionItems: string[]
  customerIntent: string
  riskLevel: 'low' | 'medium' | 'high'
  nextSteps: string[]
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

// 音声ファイルの文字起こし（将来の拡張用）
export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  // 本番ではWhisper APIなどを使用
  // 現在はプレースホルダー
  return '（音声の文字起こしには外部APIの設定が必要です）'
}
