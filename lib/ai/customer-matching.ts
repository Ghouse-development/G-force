/**
 * AI顧客マッチング機能
 * 生成AIを使用して初回受付台帳・ヒアリングシートと顧客データの紐づけを行う
 */

import type { ReceptionRecord, HearingSheetRecord, MatchCandidate } from '@/lib/kintone/kintone-client'

// 顧客データ
export interface CustomerForMatching {
  id: string
  name: string
  nameKana: string | null
  partnerName: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  address: string | null
  postalCode: string | null
  leadSource: string | null
  eventDate: string | null
}

// AIマッチング結果
export interface AIMatchResult {
  candidates: MatchCandidate[]
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  suggestedAction: 'auto_link' | 'manual_review' | 'create_new'
}

/**
 * ルールベースのマッチングスコアを計算
 */
export function calculateMatchScore(
  record: ReceptionRecord | HearingSheetRecord,
  customer: CustomerForMatching
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 電話番号マッチング（最重要）
  const normalizePhone = (p: string | null) => p?.replace(/[-\s()（）]/g, '') || ''

  if (record.phone && customer.phone) {
    const recordPhone = normalizePhone(record.phone)
    const customerPhone = normalizePhone(customer.phone)

    if (recordPhone === customerPhone) {
      score += 40
      reasons.push('メイン電話番号完全一致')
    } else if (recordPhone.slice(-8) === customerPhone.slice(-8)) {
      score += 25
      reasons.push('電話番号下8桁一致')
    }
  }

  // サブ電話番号
  if ('phone2' in record && record.phone2 && customer.phone) {
    const recordPhone2 = normalizePhone(record.phone2)
    const customerPhone = normalizePhone(customer.phone)
    if (recordPhone2 === customerPhone) {
      score += 35
      reasons.push('サブ電話番号一致')
    }
  }

  // メールアドレスマッチング
  if (record.email && customer.email) {
    if (record.email.toLowerCase() === customer.email.toLowerCase()) {
      score += 40
      reasons.push('メールアドレス完全一致')
    } else {
      // ドメイン除いた部分が一致
      const recordLocal = record.email.split('@')[0]?.toLowerCase()
      const customerLocal = customer.email.split('@')[0]?.toLowerCase()
      if (recordLocal && customerLocal && recordLocal === customerLocal) {
        score += 20
        reasons.push('メールローカル部分一致')
      }
    }
  }

  // 名前マッチング
  const recordName = record.customerName || ''
  const customerName = customer.name || ''

  if (recordName && customerName) {
    // 完全一致
    if (recordName === customerName) {
      score += 25
      reasons.push('名前完全一致')
    } else {
      // 姓のみ一致（最初の2-3文字）
      const recordSurname = recordName.slice(0, 2)
      const customerSurname = customerName.slice(0, 2)
      if (recordSurname === customerSurname && recordSurname.length >= 2) {
        score += 10
        reasons.push('姓一致')
      }
    }
  }

  // カナ名マッチング
  if ('customerNameKana' in record && record.customerNameKana && customer.nameKana) {
    if (record.customerNameKana === customer.nameKana) {
      score += 15
      reasons.push('カナ名完全一致')
    }
  }

  // 配偶者名マッチング
  if ('partnerName' in record && record.partnerName && customer.partnerName) {
    if (record.partnerName === customer.partnerName) {
      score += 10
      reasons.push('配偶者名一致')
    }
  }

  // 住所マッチング
  if ('address' in record && record.address && customer.address) {
    // 住所の前半部分（都道府県市区町村）が一致
    const recordPrefix = record.address.slice(0, 10)
    const customerPrefix = (customer.address || '').slice(0, 10)
    if (recordPrefix === customerPrefix && recordPrefix.length >= 5) {
      score += 8
      reasons.push('住所前半一致')
    }
  }

  // 郵便番号マッチング
  if ('postalCode' in record && record.postalCode && customer.postalCode) {
    const normalizedRecordPostal = record.postalCode.replace(/-/g, '')
    const normalizedCustomerPostal = (customer.postalCode || '').replace(/-/g, '')
    if (normalizedRecordPostal === normalizedCustomerPostal) {
      score += 8
      reasons.push('郵便番号一致')
    }
  }

  // 反響経路マッチング
  if ('leadSource' in record && record.leadSource && customer.leadSource) {
    if (record.leadSource === customer.leadSource) {
      score += 3
      reasons.push('反響経路一致')
    }
  }

  return { score: Math.min(score, 100), reasons }
}

/**
 * 全顧客との紐づけ候補を生成
 */
export function findAllMatchCandidates(
  record: ReceptionRecord | HearingSheetRecord,
  customers: CustomerForMatching[],
  options?: {
    minScore?: number
    maxCandidates?: number
  }
): AIMatchResult {
  const minScore = options?.minScore ?? 30
  const maxCandidates = options?.maxCandidates ?? 5

  const candidates: MatchCandidate[] = []

  for (const customer of customers) {
    const { score, reasons } = calculateMatchScore(record, customer)
    if (score >= minScore) {
      candidates.push({
        customerId: customer.id,
        customerName: customer.name,
        matchScore: score,
        matchReasons: reasons,
      })
    }
  }

  // スコア降順でソート
  candidates.sort((a, b) => b.matchScore - a.matchScore)

  // 上位N件を取得
  const topCandidates = candidates.slice(0, maxCandidates)

  // 信頼度を判定
  let confidence: 'high' | 'medium' | 'low' = 'low'
  let suggestedAction: 'auto_link' | 'manual_review' | 'create_new' = 'create_new'
  let reasoning = ''

  if (topCandidates.length === 0) {
    confidence = 'high'
    suggestedAction = 'create_new'
    reasoning = '一致する顧客が見つかりませんでした。新規顧客として登録することを推奨します。'
  } else if (topCandidates[0].matchScore >= 80) {
    confidence = 'high'
    suggestedAction = 'auto_link'
    reasoning = `電話番号またはメールアドレスが一致したため、${topCandidates[0].customerName}様との自動紐づけを推奨します。`
  } else if (topCandidates[0].matchScore >= 50) {
    // 2位との差が大きい場合は信頼度を上げる
    if (topCandidates.length === 1 || topCandidates[0].matchScore - topCandidates[1].matchScore >= 20) {
      confidence = 'medium'
      suggestedAction = 'manual_review'
      reasoning = `${topCandidates[0].customerName}様との一致の可能性が高いですが、確認をお願いします。`
    } else {
      confidence = 'low'
      suggestedAction = 'manual_review'
      reasoning = '複数の候補が存在するため、手動での確認をお願いします。'
    }
  } else {
    confidence = 'low'
    suggestedAction = 'manual_review'
    reasoning = 'マッチングスコアが低いため、手動での確認をお願いします。一致する顧客がいない場合は新規登録してください。'
  }

  return {
    candidates: topCandidates,
    confidence,
    reasoning,
    suggestedAction,
  }
}

/**
 * バッチ処理でマッチングを実行
 */
export function batchMatchRecords(
  records: (ReceptionRecord | HearingSheetRecord)[],
  customers: CustomerForMatching[]
): Map<string, AIMatchResult> {
  const results = new Map<string, AIMatchResult>()

  for (const record of records) {
    const result = findAllMatchCandidates(record, customers)
    results.set(record.id, result)
  }

  return results
}

/**
 * 紐づけ結果のサマリを生成
 */
export function generateMatchingSummary(
  results: Map<string, AIMatchResult>
): {
  total: number
  autoLinked: number
  manualReview: number
  createNew: number
  highConfidence: number
  mediumConfidence: number
  lowConfidence: number
} {
  let autoLinked = 0
  let manualReview = 0
  let createNew = 0
  let highConfidence = 0
  let mediumConfidence = 0
  let lowConfidence = 0

  for (const result of results.values()) {
    switch (result.suggestedAction) {
      case 'auto_link':
        autoLinked++
        break
      case 'manual_review':
        manualReview++
        break
      case 'create_new':
        createNew++
        break
    }

    switch (result.confidence) {
      case 'high':
        highConfidence++
        break
      case 'medium':
        mediumConfidence++
        break
      case 'low':
        lowConfidence++
        break
    }
  }

  return {
    total: results.size,
    autoLinked,
    manualReview,
    createNew,
    highConfidence,
    mediumConfidence,
    lowConfidence,
  }
}
