/**
 * SUUMO 土地情報クローラー
 *
 * 関西エリアの土地物件をクロールしてデータベースに保存
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CrawledProperty } from '@/types/crawl'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// =============================================
// SUUMO エリアコード（関西）
// =============================================

export const SUUMO_AREA_CODES = {
  // 大阪府
  osaka: {
    prefCode: '27',
    name: '大阪府',
    cities: {
      osaka_shi_kita: { code: '27127', name: '大阪市北区' },
      osaka_shi_chuo: { code: '27128', name: '大阪市中央区' },
      osaka_shi_tennoji: { code: '27109', name: '大阪市天王寺区' },
      sakai_shi: { code: '27140', name: '堺市' },
      toyonaka: { code: '27203', name: '豊中市' },
      suita: { code: '27205', name: '吹田市' },
      takatsuki: { code: '27207', name: '高槻市' },
      ibaraki: { code: '27211', name: '茨木市' },
      hirakata: { code: '27210', name: '枚方市' },
      yao: { code: '27212', name: '八尾市' },
      higashiosaka: { code: '27227', name: '東大阪市' },
    }
  },
  // 兵庫県
  hyogo: {
    prefCode: '28',
    name: '兵庫県',
    cities: {
      kobe_shi_chuo: { code: '28110', name: '神戸市中央区' },
      kobe_shi_higashinada: { code: '28101', name: '神戸市東灘区' },
      nishinomiya: { code: '28204', name: '西宮市' },
      amagasaki: { code: '28202', name: '尼崎市' },
      ashiya: { code: '28206', name: '芦屋市' },
      itami: { code: '28207', name: '伊丹市' },
      takarazuka: { code: '28214', name: '宝塚市' },
      kawanishi: { code: '28217', name: '川西市' },
    }
  },
  // 京都府
  kyoto: {
    prefCode: '26',
    name: '京都府',
    cities: {
      kyoto_shi_nakagyo: { code: '26104', name: '京都市中京区' },
      kyoto_shi_shimogyo: { code: '26106', name: '京都市下京区' },
      kyoto_shi_sakyo: { code: '26103', name: '京都市左京区' },
      uji: { code: '26204', name: '宇治市' },
      nagaokakyo: { code: '26209', name: '長岡京市' },
    }
  },
  // 奈良県
  nara: {
    prefCode: '29',
    name: '奈良県',
    cities: {
      nara_shi: { code: '29201', name: '奈良市' },
      kashihara: { code: '29205', name: '橿原市' },
      ikoma: { code: '29209', name: '生駒市' },
    }
  },
  // 滋賀県
  shiga: {
    prefCode: '25',
    name: '滋賀県',
    cities: {
      otsu: { code: '25201', name: '大津市' },
      kusatsu: { code: '25206', name: '草津市' },
    }
  },
  // 和歌山県
  wakayama: {
    prefCode: '30',
    name: '和歌山県',
    cities: {
      wakayama_shi: { code: '30201', name: '和歌山市' },
    }
  },
}

// =============================================
// クローラー設定
// =============================================

interface CrawlConfig {
  maxPages: number           // 最大ページ数
  delayMs: number           // リクエスト間隔（ミリ秒）
  userAgent: string
}

const DEFAULT_CONFIG: CrawlConfig = {
  maxPages: 5,
  delayMs: 2000,  // 2秒間隔（サーバー負荷軽減）
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// =============================================
// HTMLパーサー
// =============================================

interface ParsedProperty {
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
  landShape?: string
  stationName?: string
  stationWalk?: number
  images?: string[]
}

/**
 * SUUMO物件一覧ページのHTMLをパース
 */
function parsePropertyListHtml(html: string): ParsedProperty[] {
  const properties: ParsedProperty[] = []

  // 物件カードを抽出（cassetteitem クラス）
  const cardPattern = /<div class="cassetteitem"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g
  const cards = html.matchAll(cardPattern)

  for (const cardMatch of cards) {
    const cardHtml = cardMatch[1]

    try {
      const property = parsePropertyCard(cardHtml, html)
      if (property) {
        properties.push(property)
      }
    } catch (e) {
      console.error('Error parsing property card:', e)
    }
  }

  // フォールバック: property_unit パターン
  if (properties.length === 0) {
    const unitPattern = /<div class="property_unit[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/li>/g
    const units = html.matchAll(unitPattern)

    for (const unitMatch of units) {
      const unitHtml = unitMatch[1]
      try {
        const property = parsePropertyUnit(unitHtml)
        if (property) {
          properties.push(property)
        }
      } catch (e) {
        console.error('Error parsing property unit:', e)
      }
    }
  }

  return properties
}

/**
 * 物件カードをパース（cassetteitemパターン）
 */
function parsePropertyCard(cardHtml: string, fullHtml: string): ParsedProperty | null {
  // 物件URL・IDを抽出
  const urlMatch = cardHtml.match(/href="(\/chukoikkodate\/[^"]+\/)"/i) ||
                   cardHtml.match(/href="(\/tochi\/[^"]+\/)"/i) ||
                   fullHtml.match(/href="(https:\/\/suumo\.jp\/[^"]+\/nc_[0-9]+\/)"/i)

  if (!urlMatch) return null

  const sourceUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://suumo.jp${urlMatch[1]}`
  const idMatch = sourceUrl.match(/nc_([0-9]+)/) || sourceUrl.match(/\/([0-9]+)\/$/)
  const sourceId = idMatch ? idMatch[1] : `suumo_${Date.now()}`

  // タイトル
  const titleMatch = cardHtml.match(/<h2[^>]*class="[^"]*cassetteitem_content-title[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                     cardHtml.match(/<p[^>]*class="[^"]*cassetteitem_content-title[^"]*"[^>]*>([^<]+)<\/p>/i)
  const title = titleMatch ? titleMatch[1].trim() : '物件情報'

  // 価格
  const priceMatch = cardHtml.match(/([0-9,]+)万円/) ||
                     cardHtml.match(/価格[：:]\s*([0-9,]+)/i)
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : undefined

  // 住所
  const addressMatch = cardHtml.match(/<li[^>]*class="[^"]*cassetteitem_detail-col1[^"]*"[^>]*>([^<]+)<\/li>/i) ||
                       cardHtml.match(/所在地[：:]\s*([^<]+)/i)
  const address = addressMatch ? addressMatch[1].trim() : undefined

  // エリア（市区町村）
  const area = extractArea(address)

  // 土地面積
  const landAreaMatch = cardHtml.match(/土地面積[：:]?\s*([0-9.]+)\s*[㎡m]/i) ||
                        cardHtml.match(/([0-9.]+)\s*㎡/)
  const landArea = landAreaMatch ? parseFloat(landAreaMatch[1]) : undefined

  // 建ぺい率・容積率
  const coverageMatch = cardHtml.match(/建ぺい率[：:]?\s*([0-9.]+)\s*%/i)
  const buildingCoverage = coverageMatch ? parseFloat(coverageMatch[1]) : undefined

  const ratioMatch = cardHtml.match(/容積率[：:]?\s*([0-9.]+)\s*%/i)
  const floorAreaRatio = ratioMatch ? parseFloat(ratioMatch[1]) : undefined

  // 道路
  const roadMatch = cardHtml.match(/道路[：:]?\s*([東西南北]+)[^\d]*([0-9.]+)\s*m/i)
  const roadDirection = roadMatch ? roadMatch[1] : undefined
  const roadWidth = roadMatch ? parseFloat(roadMatch[2]) : undefined

  // 最寄り駅
  const stationMatch = cardHtml.match(/「([^」]+)」[^0-9]*([0-9]+)\s*分/i) ||
                       cardHtml.match(/([^\s]+駅)[^0-9]*徒歩\s*([0-9]+)\s*分/i)
  const stationName = stationMatch ? stationMatch[1] : undefined
  const stationWalk = stationMatch ? parseInt(stationMatch[2]) : undefined

  // 画像
  const imageMatches = cardHtml.matchAll(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)
  const images: string[] = []
  for (const imgMatch of imageMatches) {
    images.push(imgMatch[1])
  }

  return {
    sourceId,
    sourceUrl,
    title,
    price,
    address,
    area,
    landArea,
    buildingCoverage,
    floorAreaRatio,
    roadWidth,
    roadDirection,
    stationName,
    stationWalk,
    images: images.length > 0 ? images : undefined,
  }
}

/**
 * 物件ユニットをパース（property_unitパターン）
 */
function parsePropertyUnit(unitHtml: string): ParsedProperty | null {
  // 物件URL
  const urlMatch = unitHtml.match(/href="([^"]+)"/i)
  if (!urlMatch) return null

  const sourceUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://suumo.jp${urlMatch[1]}`
  const idMatch = sourceUrl.match(/([0-9]+)/)
  const sourceId = idMatch ? `suumo_${idMatch[1]}` : `suumo_${Date.now()}`

  // タイトル
  const titleMatch = unitHtml.match(/<[^>]*class="[^"]*property_unit-title[^"]*"[^>]*>([^<]+)</i)
  const title = titleMatch ? titleMatch[1].trim() : '土地物件'

  // 価格
  const priceMatch = unitHtml.match(/([0-9,]+)\s*万円/i)
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : undefined

  // 住所
  const addressMatch = unitHtml.match(/class="[^"]*property_unit-content[^"]*"[^>]*>([^<]+市[^<]+)</i)
  const address = addressMatch ? addressMatch[1].trim() : undefined

  const area = extractArea(address)

  // 面積
  const areaMatch = unitHtml.match(/([0-9.]+)\s*㎡/i)
  const landArea = areaMatch ? parseFloat(areaMatch[1]) : undefined

  return {
    sourceId,
    sourceUrl,
    title,
    price,
    address,
    area,
    landArea,
  }
}

/**
 * 住所からエリア（市区町村）を抽出
 */
function extractArea(address?: string): string | undefined {
  if (!address) return undefined

  // 「市」「区」「町」「村」で終わる部分を抽出
  const match = address.match(/((?:大阪|京都|神戸|堺|奈良|和歌山)?[^都道府県]+?(?:市|区|町|村))/)
  return match ? match[1] : undefined
}

// =============================================
// メインクローラー
// =============================================

/**
 * SUUMOの土地一覧ページURL生成
 */
function buildSuumoSearchUrl(prefCode: string, cityCodes: string[], page: number = 1): string {
  const baseUrl = 'https://suumo.jp/jj/bukken/ichiran/JJ012FC001/'
  const params = new URLSearchParams({
    ar: '060',           // 関西エリア
    bs: '030',           // 土地
    ta: prefCode,        // 都道府県コード
    kb: '1',             // 1ページ目から
    kt: '9999999',       // 価格上限なし
    mb: '0',             // 面積下限なし
    mt: '9999999',       // 面積上限なし
    pn: page.toString(), // ページ番号
  })

  // 市区町村コードを追加
  cityCodes.forEach(code => {
    params.append('sc', code)
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * 指定エリアの土地物件をクロール
 */
export async function crawlSuumoProperties(
  prefCode: string,
  cityCodes: string[],
  config: Partial<CrawlConfig> = {}
): Promise<{
  success: boolean
  propertiesFound: number
  propertiesSaved: number
  errors: string[]
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const errors: string[] = []
  const allProperties: ParsedProperty[] = []

  for (let page = 1; page <= cfg.maxPages; page++) {
    const url = buildSuumoSearchUrl(prefCode, cityCodes, page)
    console.log(`Crawling page ${page}: ${url}`)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': cfg.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        errors.push(`Page ${page}: HTTP ${response.status}`)
        continue
      }

      const html = await response.text()
      const properties = parsePropertyListHtml(html)

      if (properties.length === 0) {
        console.log(`No more properties found on page ${page}`)
        break
      }

      allProperties.push(...properties)
      console.log(`Found ${properties.length} properties on page ${page}`)

      // 次のページがあるかチェック
      if (!html.includes('pagination_next')) {
        break
      }

      // レート制限
      if (page < cfg.maxPages) {
        await sleep(cfg.delayMs)
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Page ${page}: ${msg}`)
      console.error(`Error on page ${page}:`, error)
    }
  }

  // データベースに保存
  const savedCount = await saveProperties(allProperties)

  return {
    success: errors.length === 0,
    propertiesFound: allProperties.length,
    propertiesSaved: savedCount,
    errors,
  }
}

/**
 * 全関西エリアをクロール
 */
export async function crawlAllKansaiProperties(
  config: Partial<CrawlConfig> = {}
): Promise<{
  success: boolean
  totalFound: number
  totalSaved: number
  byArea: Record<string, number>
  errors: string[]
}> {
  const results = {
    success: true,
    totalFound: 0,
    totalSaved: 0,
    byArea: {} as Record<string, number>,
    errors: [] as string[],
  }

  const areas = [
    { name: '大阪府', pref: SUUMO_AREA_CODES.osaka },
    { name: '兵庫県', pref: SUUMO_AREA_CODES.hyogo },
    { name: '京都府', pref: SUUMO_AREA_CODES.kyoto },
    { name: '奈良県', pref: SUUMO_AREA_CODES.nara },
    { name: '滋賀県', pref: SUUMO_AREA_CODES.shiga },
  ]

  for (const area of areas) {
    const cityCodes = Object.values(area.pref.cities).map(c => c.code)

    console.log(`\n=== Crawling ${area.name} ===`)

    const result = await crawlSuumoProperties(area.pref.prefCode, cityCodes, config)

    results.totalFound += result.propertiesFound
    results.totalSaved += result.propertiesSaved
    results.byArea[area.name] = result.propertiesSaved
    results.errors.push(...result.errors.map(e => `${area.name}: ${e}`))

    if (!result.success) {
      results.success = false
    }

    // エリア間の待機
    await sleep(3000)
  }

  return results
}

// =============================================
// データベース保存
// =============================================

async function saveProperties(properties: ParsedProperty[]): Promise<number> {
  if (properties.length === 0) return 0

  const supabase = await getSupabaseClient()
  let savedCount = 0

  for (const prop of properties) {
    const now = new Date().toISOString()

    const record: Partial<CrawledProperty> = {
      source: 'suumo',
      sourceId: prop.sourceId,
      sourceUrl: prop.sourceUrl,
      title: prop.title,
      price: prop.price,
      address: prop.address,
      area: prop.area,
      landArea: prop.landArea,
      buildingCoverage: prop.buildingCoverage,
      floorAreaRatio: prop.floorAreaRatio,
      roadWidth: prop.roadWidth,
      roadDirection: prop.roadDirection,
      stationName: prop.stationName,
      stationWalk: prop.stationWalk,
      images: prop.images,
      isAvailable: true,
      firstSeenAt: now,
      lastSeenAt: now,
    }

    // snake_case に変換してupsert
    const { error } = await supabase
      .from('crawled_properties')
      .upsert({
        source: record.source,
        source_id: record.sourceId,
        source_url: record.sourceUrl,
        title: record.title,
        price: record.price,
        address: record.address,
        area: record.area,
        land_area: record.landArea,
        building_coverage: record.buildingCoverage,
        floor_area_ratio: record.floorAreaRatio,
        road_width: record.roadWidth,
        road_direction: record.roadDirection,
        station_name: record.stationName,
        station_walk: record.stationWalk,
        images: record.images,
        is_available: record.isAvailable,
        first_seen_at: record.firstSeenAt,
        last_seen_at: record.lastSeenAt,
      }, {
        onConflict: 'source,source_id',
        ignoreDuplicates: false,
      })

    if (!error) {
      savedCount++
    } else {
      console.error('Error saving property:', error)
    }
  }

  return savedCount
}

// =============================================
// ユーティリティ
// =============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * クロールログを記録
 */
export async function logCrawl(
  status: 'success' | 'error' | 'partial',
  stats: {
    itemsFetched: number
    itemsNew: number
    itemsUpdated: number
    errorMessage?: string
  }
): Promise<void> {
  const supabase = await getSupabaseClient()

  await supabase.from('crawl_logs').insert({
    crawl_type: 'properties',
    source: 'suumo',
    status,
    items_fetched: stats.itemsFetched,
    items_new: stats.itemsNew,
    items_updated: stats.itemsUpdated,
    error_message: stats.errorMessage,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  })
}
