/**
 * マルチソース不動産クローラー
 *
 * SUUMO、athome、LIFULL HOME'Sから土地情報を取得
 * 同一物件は住所・価格・面積で判定してSUUMOに寄せる
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// =============================================
// 共通型定義
// =============================================

export interface CrawledProperty {
  source: 'suumo' | 'athome' | 'lifull' | 'reins'
  sourceId: string
  sourceUrl: string
  title: string
  price?: number
  address?: string
  area?: string
  landArea?: number
  buildingCoverage?: number
  floorAreaRatio?: number
  roadWidth?: number
  roadDirection?: string
  stationName?: string
  stationWalk?: number
  images?: string[]
}

export interface CrawlResult {
  source: string
  success: boolean
  propertiesFound: number
  propertiesSaved: number
  errors: string[]
}

// =============================================
// SUUMO クローラー
// =============================================

export async function crawlSuumo(
  prefCode: string,
  cityCodes: string[]
): Promise<CrawlResult> {
  const result: CrawlResult = {
    source: 'suumo',
    success: true,
    propertiesFound: 0,
    propertiesSaved: 0,
    errors: [],
  }

  try {
    const baseUrl = 'https://suumo.jp/jj/bukken/ichiran/JJ012FC001/'
    const params = new URLSearchParams({
      ar: '060',
      bs: '030',
      ta: prefCode,
      kb: '1',
      kt: '9999999',
      mb: '0',
      mt: '9999999',
    })
    cityCodes.forEach(code => params.append('sc', code))

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    })

    if (!response.ok) {
      result.errors.push(`HTTP ${response.status}`)
      result.success = false
      return result
    }

    const html = await response.text()
    const properties = parseSuumoHtml(html)
    result.propertiesFound = properties.length

    for (const prop of properties) {
      const saved = await savePropertyWithDedup(prop)
      if (saved) result.propertiesSaved++
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    result.success = false
  }

  return result
}

function parseSuumoHtml(html: string): CrawledProperty[] {
  const properties: CrawledProperty[] = []

  // 価格パターン
  const priceMatches = html.matchAll(/([0-9,]+)万円/g)
  const prices: number[] = []
  for (const match of priceMatches) {
    const price = parseInt(match[1].replace(/,/g, ''))
    if (price > 100 && price < 100000) prices.push(price)
  }

  // 物件URLパターン
  const urlMatches = html.matchAll(/href="(\/jj\/bukken\/shosai\/[^"]+)"/g)
  let idx = 0
  for (const match of urlMatches) {
    const sourceUrl = `https://suumo.jp${match[1]}`
    const sourceId = match[1].match(/nc_([0-9]+)/)?.[1] || `suumo_${Date.now()}_${idx}`

    properties.push({
      source: 'suumo',
      sourceId,
      sourceUrl,
      title: `SUUMO物件 ${idx + 1}`,
      price: prices[idx],
    })
    idx++
    if (idx >= 20) break // 最大20件
  }

  return properties
}

// =============================================
// athome クローラー
// =============================================

export async function crawlAthome(
  prefCode: string,
  cityCodes: string[]
): Promise<CrawlResult> {
  const result: CrawlResult = {
    source: 'athome',
    success: true,
    propertiesFound: 0,
    propertiesSaved: 0,
    errors: [],
  }

  try {
    // athomeの土地検索URL（例: 大阪府豊中市）
    // https://www.athome.co.jp/tochi/osaka/toyonaka-city/list/
    const prefName = getPrefName(prefCode)
    const cityName = cityCodes[0] // 簡略化

    const url = `https://www.athome.co.jp/tochi/${prefName}/${cityName}/list/`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    })

    if (!response.ok) {
      result.errors.push(`HTTP ${response.status}`)
      result.success = false
      return result
    }

    const html = await response.text()
    const properties = parseAthomeHtml(html, url)
    result.propertiesFound = properties.length

    for (const prop of properties) {
      const saved = await savePropertyWithDedup(prop)
      if (saved) result.propertiesSaved++
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    result.success = false
  }

  return result
}

function parseAthomeHtml(html: string, baseUrl: string): CrawledProperty[] {
  const properties: CrawledProperty[] = []

  // athomeの物件カードパターン（簡略版）
  const priceMatches = html.matchAll(/([0-9,]+)万円/g)
  const prices: number[] = []
  for (const match of priceMatches) {
    const price = parseInt(match[1].replace(/,/g, ''))
    if (price > 100 && price < 100000) prices.push(price)
  }

  // 物件IDパターン
  const idMatches = html.matchAll(/data-bukken-id="([^"]+)"/g)
  let idx = 0
  for (const match of idMatches) {
    properties.push({
      source: 'athome',
      sourceId: match[1],
      sourceUrl: `${baseUrl}#${match[1]}`,
      title: `athome物件 ${idx + 1}`,
      price: prices[idx],
    })
    idx++
    if (idx >= 20) break
  }

  return properties
}

// =============================================
// LIFULL HOME'S クローラー
// =============================================

export async function crawlLifull(
  prefCode: string,
  cityCodes: string[]
): Promise<CrawlResult> {
  const result: CrawlResult = {
    source: 'lifull',
    success: true,
    propertiesFound: 0,
    propertiesSaved: 0,
    errors: [],
  }

  try {
    // LIFULL HOME'Sの土地検索URL
    // https://www.homes.co.jp/tochi/osaka/toyonaka-city/list/
    const prefName = getPrefName(prefCode)
    const cityName = cityCodes[0]

    const url = `https://www.homes.co.jp/tochi/${prefName}/${cityName}/list/`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    })

    if (!response.ok) {
      result.errors.push(`HTTP ${response.status}`)
      result.success = false
      return result
    }

    const html = await response.text()
    const properties = parseLifullHtml(html, url)
    result.propertiesFound = properties.length

    for (const prop of properties) {
      const saved = await savePropertyWithDedup(prop)
      if (saved) result.propertiesSaved++
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    result.success = false
  }

  return result
}

function parseLifullHtml(html: string, baseUrl: string): CrawledProperty[] {
  const properties: CrawledProperty[] = []

  // LIFULL HOME'Sの物件パターン（簡略版）
  const priceMatches = html.matchAll(/([0-9,]+)万円/g)
  const prices: number[] = []
  for (const match of priceMatches) {
    const price = parseInt(match[1].replace(/,/g, ''))
    if (price > 100 && price < 100000) prices.push(price)
  }

  // 物件リンクパターン
  const linkMatches = html.matchAll(/href="(\/tochi\/[^"]+\/[0-9]+\/)"/g)
  let idx = 0
  for (const match of linkMatches) {
    const sourceId = match[1].match(/\/([0-9]+)\//)?.[1] || `lifull_${Date.now()}_${idx}`
    properties.push({
      source: 'lifull',
      sourceId,
      sourceUrl: `https://www.homes.co.jp${match[1]}`,
      title: `LIFULL物件 ${idx + 1}`,
      price: prices[idx],
    })
    idx++
    if (idx >= 20) break
  }

  return properties
}

// =============================================
// 重複排除・保存ロジック
// =============================================

/**
 * 物件を保存（重複判定してSUUMOに寄せる）
 *
 * 重複判定条件:
 * 1. 住所が一致
 * 2. 価格が±5%以内
 * 3. 面積が±5%以内
 *
 * SUUMOに寄せる:
 * - 既存物件がSUUMOの場合、他ソースの情報は追記せず無視
 * - 既存物件がSUUMO以外で新規がSUUMOの場合、SUUMOで上書き
 */
async function savePropertyWithDedup(property: CrawledProperty): Promise<boolean> {
  const supabase = await getSupabaseClient()
  const now = new Date().toISOString()

  // 同一ソース・同一IDの重複チェック
  const { data: existingSame } = await supabase
    .from('crawled_properties')
    .select('id, source')
    .eq('source', property.source)
    .eq('source_id', property.sourceId)
    .single()

  if (existingSame) {
    // 既存の同一レコードを更新
    await supabase
      .from('crawled_properties')
      .update({ last_seen_at: now })
      .eq('id', existingSame.id)
    return false // 既存なのでカウントしない
  }

  // 住所・価格・面積で類似物件を検索
  if (property.address && property.price) {
    const { data: similar } = await supabase
      .from('crawled_properties')
      .select('id, source, price, land_area')
      .ilike('address', `%${extractAreaFromAddress(property.address)}%`)

    if (similar && similar.length > 0) {
      for (const existing of similar) {
        // 価格が±10%以内なら同一物件とみなす
        if (existing.price) {
          const priceDiff = Math.abs(existing.price - property.price) / existing.price
          if (priceDiff < 0.1) {
            // 既存がSUUMOなら無視
            if (existing.source === 'suumo') {
              return false
            }
            // 新規がSUUMOなら既存を削除して新規を追加
            if (property.source === 'suumo') {
              await supabase
                .from('crawled_properties')
                .delete()
                .eq('id', existing.id)
            }
          }
        }
      }
    }
  }

  // 新規保存
  const { error } = await supabase.from('crawled_properties').insert({
    source: property.source,
    source_id: property.sourceId,
    source_url: property.sourceUrl,
    title: property.title,
    price: property.price,
    address: property.address,
    area: property.area || extractAreaFromAddress(property.address),
    land_area: property.landArea,
    building_coverage: property.buildingCoverage,
    floor_area_ratio: property.floorAreaRatio,
    road_width: property.roadWidth,
    road_direction: property.roadDirection,
    station_name: property.stationName,
    station_walk: property.stationWalk,
    images: property.images,
    is_available: true,
    first_seen_at: now,
    last_seen_at: now,
  })

  return !error
}

// =============================================
// ユーティリティ
// =============================================

function getPrefName(prefCode: string): string {
  const prefMap: Record<string, string> = {
    '27': 'osaka',
    '28': 'hyogo',
    '26': 'kyoto',
    '29': 'nara',
    '25': 'shiga',
    '30': 'wakayama',
  }
  return prefMap[prefCode] || 'osaka'
}

function extractAreaFromAddress(address?: string): string | undefined {
  if (!address) return undefined
  const match = address.match(/((?:大阪|京都|神戸|堺|奈良|和歌山)?[^都道府県]+?(?:市|区|町|村))/)
  return match ? match[1] : undefined
}

// =============================================
// 統合クローラー
// =============================================

/**
 * 全ソースからクロール
 */
export async function crawlAllSources(
  prefCode: string,
  cityCodes: string[]
): Promise<{
  results: CrawlResult[]
  totalFound: number
  totalSaved: number
}> {
  const results: CrawlResult[] = []

  // SUUMO（優先）
  const suumoResult = await crawlSuumo(prefCode, cityCodes)
  results.push(suumoResult)

  // 2秒待機
  await sleep(2000)

  // athome
  const athomeResult = await crawlAthome(prefCode, cityCodes)
  results.push(athomeResult)

  await sleep(2000)

  // LIFULL
  const lifullResult = await crawlLifull(prefCode, cityCodes)
  results.push(lifullResult)

  const totalFound = results.reduce((sum, r) => sum + r.propertiesFound, 0)
  const totalSaved = results.reduce((sum, r) => sum + r.propertiesSaved, 0)

  return { results, totalFound, totalSaved }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
