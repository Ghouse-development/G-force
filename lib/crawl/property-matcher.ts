/**
 * 不動産物件マッチングサービス
 *
 * お客様の条件に合う物件を検出して通知
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PropertyAlert, CrawledProperty, PropertyNotification } from '@/types/crawl'

// 型定義がまだ生成されていないため、anyを許可
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// =============================================
// マッチング処理
// =============================================

interface MatchResult {
  matchScore: number          // 0-100
  matchedConditions: string[]
  unmatchedConditions: string[]
}

/**
 * 物件がアラート条件にマッチするか判定
 */
export function matchPropertyToAlert(
  property: CrawledProperty,
  alert: PropertyAlert
): MatchResult {
  const matchedConditions: string[] = []
  const unmatchedConditions: string[] = []
  let totalConditions = 0
  let matchedCount = 0

  // エリア条件
  if (alert.areas && alert.areas.length > 0) {
    totalConditions++
    if (property.area && alert.areas.some(area => property.area?.includes(area))) {
      matchedConditions.push(`エリア: ${property.area}`)
      matchedCount++
    } else {
      unmatchedConditions.push(`エリア: ${alert.areas.join(', ')} 外`)
    }
  }

  // 価格条件
  if (alert.minPrice !== undefined || alert.maxPrice !== undefined) {
    totalConditions++
    const price = property.price
    if (price !== undefined) {
      const minOk = alert.minPrice === undefined || price >= alert.minPrice
      const maxOk = alert.maxPrice === undefined || price <= alert.maxPrice
      if (minOk && maxOk) {
        matchedConditions.push(`価格: ${price}万円`)
        matchedCount++
      } else {
        unmatchedConditions.push(`価格: ${price}万円 (範囲外)`)
      }
    }
  }

  // 土地面積条件
  if (alert.minLandArea !== undefined || alert.maxLandArea !== undefined) {
    totalConditions++
    const area = property.landArea
    if (area !== undefined) {
      const minOk = alert.minLandArea === undefined || area >= alert.minLandArea
      const maxOk = alert.maxLandArea === undefined || area <= alert.maxLandArea
      if (minOk && maxOk) {
        matchedConditions.push(`土地面積: ${area}㎡`)
        matchedCount++
      } else {
        unmatchedConditions.push(`土地面積: ${area}㎡ (範囲外)`)
      }
    }
  }

  // 前面道路幅員
  if (alert.roadWidthMin !== undefined) {
    totalConditions++
    if (property.roadWidth !== undefined && property.roadWidth >= alert.roadWidthMin) {
      matchedConditions.push(`道路幅員: ${property.roadWidth}m`)
      matchedCount++
    } else {
      unmatchedConditions.push(`道路幅員: ${property.roadWidth || '不明'}m`)
    }
  }

  // 建ぺい率
  if (alert.buildingCoverageMax !== undefined) {
    totalConditions++
    if (property.buildingCoverage !== undefined && property.buildingCoverage <= alert.buildingCoverageMax) {
      matchedConditions.push(`建ぺい率: ${property.buildingCoverage}%`)
      matchedCount++
    } else {
      unmatchedConditions.push(`建ぺい率: ${property.buildingCoverage || '不明'}%`)
    }
  }

  // 容積率
  if (alert.floorAreaRatioMin !== undefined) {
    totalConditions++
    if (property.floorAreaRatio !== undefined && property.floorAreaRatio >= alert.floorAreaRatioMin) {
      matchedConditions.push(`容積率: ${property.floorAreaRatio}%`)
      matchedCount++
    } else {
      unmatchedConditions.push(`容積率: ${property.floorAreaRatio || '不明'}%`)
    }
  }

  // 駅徒歩
  if (alert.stationWalkMax !== undefined) {
    totalConditions++
    if (property.stationWalk !== undefined && property.stationWalk <= alert.stationWalkMax) {
      matchedConditions.push(`駅徒歩: ${property.stationWalk}分`)
      matchedCount++
    } else {
      unmatchedConditions.push(`駅徒歩: ${property.stationWalk || '不明'}分`)
    }
  }

  // キーワード
  if (alert.keywords && alert.keywords.length > 0) {
    totalConditions++
    const propertyText = `${property.title || ''} ${property.address || ''} ${property.landShape || ''}`
    const matchedKeywords = alert.keywords.filter(kw => propertyText.includes(kw))
    if (matchedKeywords.length > 0) {
      matchedConditions.push(`キーワード: ${matchedKeywords.join(', ')}`)
      matchedCount++
    } else {
      unmatchedConditions.push(`キーワード: マッチなし`)
    }
  }

  // 除外キーワード
  if (alert.excludeKeywords && alert.excludeKeywords.length > 0) {
    const propertyText = `${property.title || ''} ${property.address || ''}`
    const excludeMatched = alert.excludeKeywords.some(kw => propertyText.includes(kw))
    if (excludeMatched) {
      // 除外キーワードに該当する場合はマッチスコアを0に
      return {
        matchScore: 0,
        matchedConditions,
        unmatchedConditions: ['除外キーワードに該当'],
      }
    }
  }

  // マッチスコアを計算
  const matchScore = totalConditions > 0
    ? Math.round((matchedCount / totalConditions) * 100)
    : 100 // 条件がない場合は100%

  return {
    matchScore,
    matchedConditions,
    unmatchedConditions,
  }
}

// =============================================
// 通知処理
// =============================================

/**
 * 新規物件に対してマッチング処理を実行
 */
export async function processNewProperties(propertyIds: string[]): Promise<{
  processed: number
  notificationsCreated: number
}> {
  const supabase = await getSupabaseClient()
  let notificationsCreated = 0

  // アクティブなアラートを全て取得
  const { data: alerts, error: alertError } = await supabase
    .from('property_alerts')
    .select('*')
    .eq('is_active', true)

  if (alertError || !alerts) {
    console.error('Error fetching alerts:', alertError)
    return { processed: 0, notificationsCreated: 0 }
  }

  // 対象物件を取得
  const { data: properties, error: propError } = await supabase
    .from('crawled_properties')
    .select('*')
    .in('id', propertyIds)

  if (propError || !properties) {
    console.error('Error fetching properties:', propError)
    return { processed: 0, notificationsCreated: 0 }
  }

  // 各物件・アラートの組み合わせでマッチング
  for (const property of properties) {
    for (const alert of alerts) {
      const matchResult = matchPropertyToAlert(property, alert)

      // マッチスコアが70%以上なら通知作成
      if (matchResult.matchScore >= 70) {
        const { error: notifError } = await supabase
          .from('property_notifications')
          .upsert({
            alert_id: alert.id,
            property_id: property.id,
            customer_id: alert.customer_id,
            match_score: matchResult.matchScore,
            match_details: {
              matchedConditions: matchResult.matchedConditions,
              unmatchedConditions: matchResult.unmatchedConditions,
            },
          }, {
            onConflict: 'alert_id,property_id'
          })

        if (!notifError) {
          notificationsCreated++
        }
      }
    }
  }

  return {
    processed: properties.length,
    notificationsCreated,
  }
}

/**
 * 顧客の未読通知を取得
 */
export async function getUnreadNotifications(customerId: string): Promise<PropertyNotification[]> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from('property_notifications')
    .select(`
      *,
      property:crawled_properties(*),
      alert:property_alerts(*)
    `)
    .eq('customer_id', customerId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await getSupabaseClient()

  const { error } = await supabase
    .from('property_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  return !error
}

// =============================================
// アラート管理
// =============================================

/**
 * 物件アラートを作成
 */
export async function createPropertyAlert(
  customerId: string,
  alertData: Omit<PropertyAlert, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>
): Promise<PropertyAlert | null> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from('property_alerts')
    .insert({
      customer_id: customerId,
      alert_name: alertData.alertName,
      is_active: alertData.isActive,
      areas: alertData.areas,
      min_price: alertData.minPrice,
      max_price: alertData.maxPrice,
      min_land_area: alertData.minLandArea,
      max_land_area: alertData.maxLandArea,
      land_shape_preferences: alertData.landShapePreferences,
      road_width_min: alertData.roadWidthMin,
      building_coverage_max: alertData.buildingCoverageMax,
      floor_area_ratio_min: alertData.floorAreaRatioMin,
      station_walk_max: alertData.stationWalkMax,
      keywords: alertData.keywords,
      exclude_keywords: alertData.excludeKeywords,
      notify_email: alertData.notifyEmail,
      notify_app: alertData.notifyApp,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    return null
  }

  return data
}

/**
 * 顧客のアラート一覧を取得
 */
export async function getCustomerAlerts(customerId: string): Promise<PropertyAlert[]> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from('property_alerts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data || []
}
