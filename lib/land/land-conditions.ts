/**
 * 土地探し条件管理
 * ヒアリングシート・初回受付台帳・商談記録から自動更新
 * 土地情報とのマッチング機能
 */

// 土地探し条件
export interface LandSearchConditions {
  id: string
  customerId: string
  // 基本情報
  desiredAreas: string[] // 希望エリア（複数可）
  excludedAreas: string[] // 除外エリア
  // 面積条件
  minLandArea: number | null // 最小面積（坪）
  maxLandArea: number | null // 最大面積（坪）
  preferredLandArea: number | null // 希望面積（坪）
  // 価格条件
  minPrice: number | null // 最低価格（万円）
  maxPrice: number | null // 最高価格（万円）
  // 立地条件
  stationDistance: number | null // 駅徒歩（分）
  schoolDistance: number | null // 学校距離（分）
  supermarketDistance: number | null // スーパー距離（分）
  hospitalDistance: number | null // 病院距離（分）
  // 道路条件
  roadWidth: number | null // 前面道路幅員（m）
  roadDirection: ('north' | 'south' | 'east' | 'west')[] // 道路方向
  cornerLot: boolean | null // 角地希望
  // 用途地域
  zoningTypes: string[] // 用途地域（第一種低層住居専用地域など）
  buildingCoverage: number | null // 建ぺい率（%）
  floorAreaRatio: number | null // 容積率（%）
  // その他条件
  shapePreference: 'rectangular' | 'irregular' | 'any' // 形状希望
  flatLand: boolean | null // 平坦地希望
  newDevelopment: boolean | null // 新規分譲地希望
  existingBuilding: boolean | null // 古家付き可
  // 優先順位
  priorities: {
    area: number // 1-5
    price: number
    size: number
    access: number
    environment: number
  }
  // メモ
  notes: string
  // 更新情報
  lastUpdatedFrom: 'hearing_sheet' | 'reception' | 'negotiation' | 'manual'
  lastUpdatedAt: string
  createdAt: string
}

// 土地物件データ
export interface LandProperty {
  id: string
  // 基本情報
  name: string
  address: string
  area: string // エリア名
  // 面積・価格
  landArea: number // 坪
  price: number // 万円
  pricePerTsubo: number // 坪単価
  // 立地情報
  nearestStation: string
  stationDistance: number // 分
  schoolDistance: number | null
  supermarketDistance: number | null
  hospitalDistance: number | null
  // 道路情報
  roadWidth: number | null
  roadDirection: string | null
  cornerLot: boolean
  // 用途地域
  zoningType: string | null
  buildingCoverage: number | null
  floorAreaRatio: number | null
  // その他
  shape: string | null
  flatLand: boolean | null
  newDevelopment: boolean
  existingBuilding: boolean
  // 物件情報
  source: 'reins' | 'suumo' | 'athome' | 'manual' | 'other'
  sourceUrl: string | null
  listedAt: string
  updatedAt: string
  status: 'available' | 'negotiating' | 'sold' | 'withdrawn'
  notes: string
}

// マッチング結果
export interface LandMatchResult {
  propertyId: string
  customerId: string
  matchScore: number // 0-100
  matchDetails: MatchDetail[]
  alertLevel: 'high' | 'medium' | 'low' // 70%以上=high, 50-70=medium, それ以下=low
  notifiedAt: string | null
  assignedTo: string | null
}

interface MatchDetail {
  category: string
  label: string
  score: number
  maxScore: number
  reason: string
}

/**
 * 土地条件と物件のマッチング計算
 */
export function calculateLandMatch(
  conditions: LandSearchConditions,
  property: LandProperty
): LandMatchResult {
  const details: MatchDetail[] = []
  let totalScore = 0
  let maxPossibleScore = 0

  // 優先順位に基づく重み付け
  const weights = {
    area: conditions.priorities.area * 2,
    price: conditions.priorities.price * 2,
    size: conditions.priorities.size * 2,
    access: conditions.priorities.access * 2,
    environment: conditions.priorities.environment * 2,
  }

  // 1. エリアマッチング（最重要）
  const areaWeight = weights.area * 5
  maxPossibleScore += areaWeight

  if (conditions.desiredAreas.length > 0) {
    const areaMatch = conditions.desiredAreas.some(area =>
      property.area.includes(area) || property.address.includes(area)
    )
    const excluded = conditions.excludedAreas.some(area =>
      property.area.includes(area) || property.address.includes(area)
    )

    if (excluded) {
      details.push({
        category: 'area',
        label: 'エリア',
        score: 0,
        maxScore: areaWeight,
        reason: '除外エリアに該当',
      })
    } else if (areaMatch) {
      totalScore += areaWeight
      details.push({
        category: 'area',
        label: 'エリア',
        score: areaWeight,
        maxScore: areaWeight,
        reason: '希望エリア一致',
      })
    } else {
      const partialScore = areaWeight * 0.3
      totalScore += partialScore
      details.push({
        category: 'area',
        label: 'エリア',
        score: partialScore,
        maxScore: areaWeight,
        reason: '希望エリア外',
      })
    }
  }

  // 2. 価格マッチング
  const priceWeight = weights.price * 4
  maxPossibleScore += priceWeight

  if (conditions.maxPrice !== null) {
    if (property.price <= conditions.maxPrice) {
      if (conditions.minPrice !== null && property.price >= conditions.minPrice) {
        totalScore += priceWeight
        details.push({
          category: 'price',
          label: '価格',
          score: priceWeight,
          maxScore: priceWeight,
          reason: `${property.price}万円 (予算内)`,
        })
      } else {
        totalScore += priceWeight * 0.9
        details.push({
          category: 'price',
          label: '価格',
          score: priceWeight * 0.9,
          maxScore: priceWeight,
          reason: `${property.price}万円 (予算内)`,
        })
      }
    } else {
      // 予算オーバーの度合いでスコア減少
      const overRate = (property.price - conditions.maxPrice) / conditions.maxPrice
      const score = Math.max(0, priceWeight * (1 - overRate * 2))
      totalScore += score
      details.push({
        category: 'price',
        label: '価格',
        score,
        maxScore: priceWeight,
        reason: `${property.price}万円 (予算${Math.round(overRate * 100)}%オーバー)`,
      })
    }
  }

  // 3. 面積マッチング
  const sizeWeight = weights.size * 3
  maxPossibleScore += sizeWeight

  if (conditions.preferredLandArea !== null || conditions.minLandArea !== null) {
    const preferred = conditions.preferredLandArea || conditions.minLandArea || 50
    const min = conditions.minLandArea || preferred * 0.8
    const max = conditions.maxLandArea || preferred * 1.5

    if (property.landArea >= min && property.landArea <= max) {
      // 希望値に近いほど高スコア
      const deviation = Math.abs(property.landArea - preferred) / preferred
      const score = sizeWeight * Math.max(0.5, 1 - deviation)
      totalScore += score
      details.push({
        category: 'size',
        label: '面積',
        score,
        maxScore: sizeWeight,
        reason: `${property.landArea}坪 (希望: ${preferred}坪)`,
      })
    } else {
      details.push({
        category: 'size',
        label: '面積',
        score: 0,
        maxScore: sizeWeight,
        reason: `${property.landArea}坪 (範囲外: ${min}-${max}坪)`,
      })
    }
  }

  // 4. 駅距離マッチング
  const accessWeight = weights.access * 3
  maxPossibleScore += accessWeight

  if (conditions.stationDistance !== null) {
    if (property.stationDistance <= conditions.stationDistance) {
      totalScore += accessWeight
      details.push({
        category: 'access',
        label: '駅距離',
        score: accessWeight,
        maxScore: accessWeight,
        reason: `徒歩${property.stationDistance}分 (希望${conditions.stationDistance}分以内)`,
      })
    } else {
      const overMinutes = property.stationDistance - conditions.stationDistance
      const score = Math.max(0, accessWeight * (1 - overMinutes / 10))
      totalScore += score
      details.push({
        category: 'access',
        label: '駅距離',
        score,
        maxScore: accessWeight,
        reason: `徒歩${property.stationDistance}分 (希望より${overMinutes}分超過)`,
      })
    }
  }

  // 5. 道路条件マッチング
  const roadWeight = weights.environment * 2
  maxPossibleScore += roadWeight

  if (conditions.roadWidth !== null && property.roadWidth !== null) {
    if (property.roadWidth >= conditions.roadWidth) {
      totalScore += roadWeight
      details.push({
        category: 'road',
        label: '前面道路',
        score: roadWeight,
        maxScore: roadWeight,
        reason: `${property.roadWidth}m (希望${conditions.roadWidth}m以上)`,
      })
    } else {
      const score = roadWeight * (property.roadWidth / conditions.roadWidth)
      totalScore += score
      details.push({
        category: 'road',
        label: '前面道路',
        score,
        maxScore: roadWeight,
        reason: `${property.roadWidth}m (希望${conditions.roadWidth}m未満)`,
      })
    }
  }

  // 6. 角地マッチング
  if (conditions.cornerLot === true) {
    const cornerWeight = weights.environment
    maxPossibleScore += cornerWeight
    if (property.cornerLot) {
      totalScore += cornerWeight
      details.push({
        category: 'corner',
        label: '角地',
        score: cornerWeight,
        maxScore: cornerWeight,
        reason: '角地 ✓',
      })
    } else {
      details.push({
        category: 'corner',
        label: '角地',
        score: 0,
        maxScore: cornerWeight,
        reason: '角地ではない',
      })
    }
  }

  // 7. 新規分譲地マッチング
  if (conditions.newDevelopment === true) {
    const devWeight = weights.environment
    maxPossibleScore += devWeight
    if (property.newDevelopment) {
      totalScore += devWeight
      details.push({
        category: 'development',
        label: '新規分譲',
        score: devWeight,
        maxScore: devWeight,
        reason: '新規分譲地 ✓',
      })
    } else {
      details.push({
        category: 'development',
        label: '新規分譲',
        score: 0,
        maxScore: devWeight,
        reason: '新規分譲地ではない',
      })
    }
  }

  // 最終スコア計算（0-100に正規化）
  const finalScore = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0

  // アラートレベル判定
  let alertLevel: 'high' | 'medium' | 'low'
  if (finalScore >= 70) {
    alertLevel = 'high'
  } else if (finalScore >= 50) {
    alertLevel = 'medium'
  } else {
    alertLevel = 'low'
  }

  return {
    propertyId: property.id,
    customerId: conditions.customerId,
    matchScore: finalScore,
    matchDetails: details,
    alertLevel,
    notifiedAt: null,
    assignedTo: null,
  }
}

/**
 * ヒアリングシートから条件を抽出
 */
export function extractConditionsFromHearingSheet(
  hearingSheet: {
    customerId: string
    desiredArea?: string
    desiredLocation?: string
    budget?: number
    landRequirements?: string
    familyStructure?: string
  },
  _existingConditions?: LandSearchConditions
): Partial<LandSearchConditions> {
  const conditions: Partial<LandSearchConditions> = {}

  // エリア抽出
  if (hearingSheet.desiredArea || hearingSheet.desiredLocation) {
    const areaText = `${hearingSheet.desiredArea || ''} ${hearingSheet.desiredLocation || ''}`
    const areas = areaText
      .split(/[、,・\s]+/)
      .map(a => a.trim())
      .filter(a => a.length > 0)
    if (areas.length > 0) {
      conditions.desiredAreas = areas
    }
  }

  // 予算抽出（土地のみの場合は建物費用を差し引く想定）
  if (hearingSheet.budget) {
    // 総予算の40%を土地予算と仮定
    conditions.maxPrice = Math.round(hearingSheet.budget * 0.4 / 10000) // 万円に変換
  }

  // 土地条件からテキスト解析
  if (hearingSheet.landRequirements) {
    const req = hearingSheet.landRequirements

    // 面積抽出
    const areaMatch = req.match(/(\d+)\s*(坪|つぼ)/)
    if (areaMatch) {
      conditions.preferredLandArea = parseInt(areaMatch[1], 10)
    }

    // 駅距離抽出
    const stationMatch = req.match(/(駅|えき)\s*(から|まで)?\s*(\d+)\s*(分|ふん)/)
    if (stationMatch) {
      conditions.stationDistance = parseInt(stationMatch[3], 10)
    }

    // 角地希望
    if (req.includes('角地') || req.includes('かどち')) {
      conditions.cornerLot = true
    }

    // 新規分譲地希望
    if (req.includes('分譲') || req.includes('新規')) {
      conditions.newDevelopment = true
    }

    // 平坦地希望
    if (req.includes('平坦') || req.includes('フラット')) {
      conditions.flatLand = true
    }
  }

  // 家族構成から推奨面積を算出
  if (hearingSheet.familyStructure) {
    const familyMatch = hearingSheet.familyStructure.match(/(\d+)\s*人/)
    if (familyMatch) {
      const familySize = parseInt(familyMatch[1], 10)
      // 1人あたり10坪として計算
      if (!conditions.preferredLandArea) {
        conditions.preferredLandArea = Math.max(40, familySize * 10)
      }
    }
  }

  conditions.lastUpdatedFrom = 'hearing_sheet'
  conditions.lastUpdatedAt = new Date().toISOString()

  return conditions
}

/**
 * 初回受付台帳から条件を抽出
 */
export function extractConditionsFromReception(
  reception: {
    customerId: string
    address?: string
    leadSource?: string
    notes?: string
  }
): Partial<LandSearchConditions> {
  const conditions: Partial<LandSearchConditions> = {}

  // 現住所から希望エリアを推測（近隣希望が多い）
  if (reception.address) {
    // 市区町村レベルを抽出
    const cityMatch = reception.address.match(/(.*?[都道府県])?(.+?[市区町村])/)
    if (cityMatch && cityMatch[2]) {
      conditions.desiredAreas = [cityMatch[2].replace(/[市区町村]$/, '')]
    }
  }

  // 備考からキーワード抽出
  if (reception.notes) {
    const notes = reception.notes

    // エリア希望
    const areaMatch = notes.match(/希望\s*(エリア|地域)\s*[:：]?\s*([^\n、]+)/)
    if (areaMatch) {
      conditions.desiredAreas = [areaMatch[2].trim()]
    }

    // 予算
    const budgetMatch = notes.match(/予算\s*[:：]?\s*(\d+)\s*万/)
    if (budgetMatch) {
      conditions.maxPrice = parseInt(budgetMatch[1], 10)
    }
  }

  conditions.lastUpdatedFrom = 'reception'
  conditions.lastUpdatedAt = new Date().toISOString()

  return conditions
}

/**
 * 条件をマージ（新しい情報で上書き、ただし手動入力は保持）
 */
export function mergeConditions(
  existing: LandSearchConditions,
  updates: Partial<LandSearchConditions>
): LandSearchConditions {
  // 手動入力の場合は自動更新で上書きしない項目
  const manualProtectedFields = existing.lastUpdatedFrom === 'manual'
    ? ['desiredAreas', 'maxPrice', 'preferredLandArea', 'notes']
    : []

  const merged = { ...existing }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) continue
    if (manualProtectedFields.includes(key)) continue

    // 配列の場合はマージ
    if (Array.isArray(value) && Array.isArray((merged as Record<string, unknown>)[key])) {
      const existingArray = (merged as Record<string, unknown>)[key] as unknown[]
      const newArray = [...new Set([...existingArray, ...value])]
      ;(merged as Record<string, unknown>)[key] = newArray
    } else {
      ;(merged as Record<string, unknown>)[key] = value
    }
  }

  merged.lastUpdatedAt = new Date().toISOString()
  if (updates.lastUpdatedFrom) {
    merged.lastUpdatedFrom = updates.lastUpdatedFrom
  }

  return merged
}

/**
 * デフォルトの土地条件を生成
 */
export function createDefaultLandConditions(customerId: string): LandSearchConditions {
  return {
    id: `lc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    customerId,
    desiredAreas: [],
    excludedAreas: [],
    minLandArea: null,
    maxLandArea: null,
    preferredLandArea: null,
    minPrice: null,
    maxPrice: null,
    stationDistance: null,
    schoolDistance: null,
    supermarketDistance: null,
    hospitalDistance: null,
    roadWidth: null,
    roadDirection: [],
    cornerLot: null,
    zoningTypes: [],
    buildingCoverage: null,
    floorAreaRatio: null,
    shapePreference: 'any',
    flatLand: null,
    newDevelopment: null,
    existingBuilding: null,
    priorities: {
      area: 5,
      price: 5,
      size: 3,
      access: 3,
      environment: 3,
    },
    notes: '',
    lastUpdatedFrom: 'manual',
    lastUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
}

/**
 * 全顧客の条件と全物件のマッチングを実行
 */
export function batchMatchLandProperties(
  allConditions: LandSearchConditions[],
  allProperties: LandProperty[]
): LandMatchResult[] {
  const results: LandMatchResult[] = []

  for (const conditions of allConditions) {
    for (const property of allProperties) {
      // 販売中の物件のみ
      if (property.status !== 'available') continue

      const match = calculateLandMatch(conditions, property)

      // 50%以上のマッチのみ記録
      if (match.matchScore >= 50) {
        results.push(match)
      }
    }
  }

  // スコア降順でソート
  return results.sort((a, b) => b.matchScore - a.matchScore)
}
