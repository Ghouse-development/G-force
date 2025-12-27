/**
 * AI営業アシスタントモジュール
 *
 * 顧客データを分析し、成約予測と次のアクション提案を行う
 */

import {
  type Customer,
  type CustomerJourneyEvent,
  type PreContractStatus,
} from '@/types/database'

// 成約予測スコア
export interface ContractPrediction {
  probability: number // 0-100
  confidence: 'high' | 'medium' | 'low'
  factors: PredictionFactor[]
  recommendation: string
}

// 予測に影響する要因
export interface PredictionFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  score: number // -10 to +10
  description: string
}

// 次のアクション提案
export interface ActionSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  action: string
  reason: string
  expectedOutcome: string
  timing: string // いつ実施すべきか
}

// 営業コーチングのヒント
export interface CoachingTip {
  id: string
  category: 'approach' | 'objection' | 'closing' | 'relationship'
  title: string
  content: string
  applicableWhen: string
}

// ステータスごとの基準スコア
const STATUS_BASE_SCORES: Record<PreContractStatus, number> = {
  '限定会員': 20,
  '面談': 35,
  '建築申込': 55,
  'プラン提出': 70,
  '内定': 85,
  'ボツ・他決': 0,
}

/**
 * 成約確率を予測
 */
export function predictContractProbability(
  customer: Partial<Customer>,
  journeyEvents: CustomerJourneyEvent[] = []
): ContractPrediction {
  const factors: PredictionFactor[] = []
  let baseScore = 0

  const status = customer.pipeline_status as PreContractStatus

  // 1. ステータスによるベーススコア
  if (STATUS_BASE_SCORES[status] !== undefined) {
    baseScore = STATUS_BASE_SCORES[status]
  }

  // 2. イベント参加による加点
  const eventCount = journeyEvents.filter(e =>
    e.event_type.includes('見学会参加') || e.event_type.includes('面談')
  ).length

  if (eventCount >= 3) {
    factors.push({
      name: 'イベント参加回数',
      impact: 'positive',
      score: 10,
      description: `${eventCount}回のイベント・面談に参加`,
    })
  } else if (eventCount >= 2) {
    factors.push({
      name: 'イベント参加回数',
      impact: 'positive',
      score: 5,
      description: `${eventCount}回のイベント・面談に参加`,
    })
  } else if (eventCount <= 1 && status !== '限定会員') {
    factors.push({
      name: 'イベント参加回数',
      impact: 'negative',
      score: -5,
      description: '参加回数が少ない',
    })
  }

  // 3. 土地の状況
  // 仮に資金計画書の有無で判断（実際はlandStatusを見る）
  if (customer.land_area && customer.land_area > 0) {
    factors.push({
      name: '土地確定',
      impact: 'positive',
      score: 15,
      description: '建築予定地が確定している',
    })
  }

  // 4. 見込金額
  if (customer.estimated_amount && customer.estimated_amount > 0) {
    factors.push({
      name: '予算把握',
      impact: 'positive',
      score: 5,
      description: '予算・資金計画が明確',
    })
  }

  // 5. 反応の良さ（直近のイベント結果）
  const recentEvents = journeyEvents
    .filter(e => e.outcome)
    .slice(-3)

  const goodOutcomes = recentEvents.filter(e =>
    e.outcome === '良好' || e.outcome === '契約意欲高い'
  ).length

  if (goodOutcomes >= 2) {
    factors.push({
      name: '顧客反応',
      impact: 'positive',
      score: 10,
      description: '直近の商談で好反応',
    })
  } else if (recentEvents.length > 0 && goodOutcomes === 0) {
    factors.push({
      name: '顧客反応',
      impact: 'negative',
      score: -5,
      description: '反応が薄い',
    })
  }

  // 6. 停滞期間
  const lastUpdate = customer.updated_at ? new Date(customer.updated_at) : null
  if (lastUpdate) {
    const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince > 14) {
      factors.push({
        name: '停滞期間',
        impact: 'negative',
        score: -10,
        description: `${daysSince}日間進展なし`,
      })
    } else if (daysSince <= 3) {
      factors.push({
        name: 'アクティブ',
        impact: 'positive',
        score: 5,
        description: '直近で接触あり',
      })
    }
  }

  // 7. 紹介顧客かどうか
  if (customer.lead_source === 'オーナー紹介' || customer.lead_source === '業者紹介') {
    factors.push({
      name: '紹介顧客',
      impact: 'positive',
      score: 10,
      description: '紹介経由の顧客は成約率が高い',
    })
  }

  // スコア計算
  const factorScore = factors.reduce((sum, f) => sum + f.score, 0)
  const probability = Math.min(95, Math.max(5, baseScore + factorScore))

  // 信頼度の判定
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (factors.length >= 4 && factors.filter(f => f.impact === 'positive').length >= 2) {
    confidence = 'high'
  } else if (factors.length <= 2) {
    confidence = 'low'
  }

  // 推奨アクション
  const recommendation = generateRecommendation(status, factors, probability)

  return {
    probability: Math.round(probability),
    confidence,
    factors,
    recommendation,
  }
}

function generateRecommendation(
  status: PreContractStatus,
  factors: PredictionFactor[],
  probability: number
): string {
  const negativeFactors = factors.filter(f => f.impact === 'negative')

  if (negativeFactors.some(f => f.name === '停滞期間')) {
    return '長期間進展がありません。電話またはメールでのフォローをお勧めします。'
  }

  if (probability >= 80) {
    return '成約の可能性が高いです。契約に向けた具体的な準備を進めましょう。'
  }

  if (probability >= 60) {
    return 'もう一押しです。お客様の懸念点を解消し、具体的なプランを提示しましょう。'
  }

  if (probability >= 40) {
    return 'まだ検討段階です。土地情報やイベント案内で接点を増やしましょう。'
  }

  return '初期段階です。ヒアリングを丁寧に行い、信頼関係を構築しましょう。'
}

/**
 * 次のアクションを提案
 */
export function suggestNextActions(
  customer: Partial<Customer>,
  journeyEvents: CustomerJourneyEvent[] = []
): ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = []
  const status = customer.pipeline_status as PreContractStatus

  // 最後のイベントからの日数
  const lastEvent = journeyEvents[journeyEvents.length - 1]
  const daysSinceLastEvent = lastEvent
    ? Math.floor((Date.now() - new Date(lastEvent.event_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // ステータス別の提案
  switch (status) {
    case '限定会員':
      suggestions.push({
        id: 'call-follow',
        priority: daysSinceLastEvent > 7 ? 'high' : 'medium',
        action: 'お電話でのフォロー',
        reason: '限定会員になってからの最初のアクションが重要です',
        expectedOutcome: '面談予約につなげる',
        timing: '今日中',
      })
      suggestions.push({
        id: 'event-invite',
        priority: 'medium',
        action: 'モデルハウス見学会へのご案内',
        reason: '実際の家を見ていただくことで興味が深まります',
        expectedOutcome: 'イベント参加予約',
        timing: '今週中',
      })
      break

    case '面談':
      suggestions.push({
        id: 'land-info',
        priority: 'high',
        action: '土地情報のご紹介',
        reason: '土地が決まらないと具体的な検討に進めません',
        expectedOutcome: '土地案内の予約',
        timing: '次回面談まで',
      })
      suggestions.push({
        id: 'hearing-deep',
        priority: 'medium',
        action: 'ご要望の深掘りヒアリング',
        reason: '詳細なヒアリングでプラン提案の精度が上がります',
        expectedOutcome: 'プラン作成に必要な情報収集',
        timing: '次回面談',
      })
      break

    case '建築申込':
      suggestions.push({
        id: 'plan-progress',
        priority: 'high',
        action: 'プラン進捗の確認',
        reason: 'お客様はプランを楽しみにしています',
        expectedOutcome: 'プラン提出日の確定',
        timing: '今週中',
      })
      suggestions.push({
        id: 'funding-check',
        priority: 'high',
        action: '資金計画の確認',
        reason: 'ローン審査状況の確認が必要です',
        expectedOutcome: 'ローン承認の確認',
        timing: '今週中',
      })
      break

    case 'プラン提出':
      suggestions.push({
        id: 'plan-feedback',
        priority: 'high',
        action: 'プランへのご意見確認',
        reason: '修正点があれば早めに対応が必要です',
        expectedOutcome: 'プラン確定または修正依頼',
        timing: '今日中',
      })
      suggestions.push({
        id: 'competitor-check',
        priority: 'medium',
        action: '競合状況の確認',
        reason: '他社と比較検討中の可能性があります',
        expectedOutcome: '当社の強みをアピール',
        timing: '次回面談',
      })
      break

    case '内定':
      suggestions.push({
        id: 'contract-prep',
        priority: 'high',
        action: '契約日程の調整',
        reason: '内定後は契約までスピーディに進めましょう',
        expectedOutcome: '契約日確定',
        timing: '今日中',
      })
      suggestions.push({
        id: 'docs-prep',
        priority: 'high',
        action: '必要書類のご案内',
        reason: '契約に必要な書類を事前にご準備いただきます',
        expectedOutcome: '書類準備完了',
        timing: '契約日の1週間前',
      })
      break
  }

  // 共通のアクション
  if (daysSinceLastEvent > 7 && status !== '内定') {
    suggestions.unshift({
      id: 'follow-urgent',
      priority: 'high',
      action: '至急フォローのお電話',
      reason: `${daysSinceLastEvent}日間連絡がありません`,
      expectedOutcome: '状況確認と次回アポイント',
      timing: '今日中',
    })
  }

  return suggestions.slice(0, 4) // 最大4つ
}

/**
 * 営業コーチングのヒント
 */
export function getCoachingTips(
  customer: Partial<Customer>,
  _journeyEvents: CustomerJourneyEvent[] = []
): CoachingTip[] {
  const tips: CoachingTip[] = []
  const status = customer.pipeline_status as PreContractStatus

  // ステータス別のコーチング
  switch (status) {
    case '限定会員':
      tips.push({
        id: 'first-impression',
        category: 'relationship',
        title: '第一印象を大切に',
        content: '最初の電話では、売り込みではなく「お役に立ちたい」という姿勢を見せましょう。お客様の話をよく聞くことが大切です。',
        applicableWhen: '初回フォロー電話',
      })
      break

    case '面談':
      tips.push({
        id: 'hearing-technique',
        category: 'approach',
        title: '質問力を磨く',
        content: '「なぜ家を建てたいと思われたのですか？」という動機から聞き、ご家族の将来像を一緒に描きましょう。',
        applicableWhen: '面談時',
      })
      break

    case '建築申込':
    case 'プラン提出':
      tips.push({
        id: 'objection-handling',
        category: 'objection',
        title: '価格交渉への対応',
        content: '「他社さんはもう少し安い」と言われたら、価格ではなく価値で勝負。標準仕様の充実度やアフターサービスを具体的に説明しましょう。',
        applicableWhen: '見積提示後',
      })
      break

    case '内定':
      tips.push({
        id: 'closing-technique',
        category: 'closing',
        title: 'クロージングのコツ',
        content: '「ご契約いただけますか？」ではなく「いつ頃のお引渡しがご希望ですか？」と具体的な話に進めましょう。',
        applicableWhen: '契約前',
      })
      break
  }

  // 競合がいる場合
  // プラン依頼に競合情報があるかはプラン依頼データを見る必要があるが、ここでは汎用的なヒントを表示
  tips.push({
    id: 'competitor-strategy',
    category: 'objection',
    title: '競合との差別化',
    content: '当社の強みは「パナソニックテクノストラクチャー」による耐震性と、充実した標準仕様。価格ではなく価値で選んでいただきましょう。',
    applicableWhen: '競合がいる場合',
  })

  return tips.slice(0, 3) // 最大3つ
}
