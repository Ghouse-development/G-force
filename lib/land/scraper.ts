/**
 * 土地情報スクレイピングモジュール
 *
 * REINS（レインズ）とSUUMOから土地情報を取得します。
 * TODO: 後日実装
 */

import type { CrawledProperty } from '@/types/crawl'

// =============================================
// スクレイピング設定
// =============================================

export interface ScrapeConfig {
  source: 'reins' | 'suumo' | 'athome' | 'homes'
  enabled: boolean
  loginRequired: boolean
  credentials?: {
    username?: string
    password?: string
  }
  baseUrl: string
  searchParams?: Record<string, string>
}

// デフォルト設定
export const SCRAPE_CONFIGS: Record<string, ScrapeConfig> = {
  reins: {
    source: 'reins',
    enabled: false, // TODO: 実装後に有効化
    loginRequired: true,
    baseUrl: 'https://system.reins.jp/',
    credentials: {
      username: process.env.REINS_USERNAME,
      password: process.env.REINS_PASSWORD,
    },
  },
  suumo: {
    source: 'suumo',
    enabled: false, // TODO: 実装後に有効化
    loginRequired: false,
    baseUrl: 'https://suumo.jp/jj/bukken/ichiran/',
  },
  athome: {
    source: 'athome',
    enabled: false, // TODO: 実装後に有効化
    loginRequired: false,
    baseUrl: 'https://www.athome.co.jp/',
  },
  homes: {
    source: 'homes',
    enabled: false, // TODO: 実装後に有効化
    loginRequired: false,
    baseUrl: 'https://www.homes.co.jp/',
  },
}

// =============================================
// スクレイピング結果
// =============================================

export interface ScrapeResult {
  success: boolean
  source: string
  properties: CrawledProperty[]
  totalFound: number
  nextPageUrl?: string
  errors?: string[]
  scrapedAt: string
}

// =============================================
// REINS スクレイパー
// =============================================

/**
 * REINSから土地情報を取得
 * TODO: 実装
 */
export async function scrapeReins(options: {
  areas?: string[]
  minPrice?: number
  maxPrice?: number
  minLandArea?: number
  maxLandArea?: number
}): Promise<ScrapeResult> {
  console.log('[REINS] スクレイピング開始', options)

  // TODO: 実装
  // 1. ログイン処理
  // 2. 検索条件の設定
  // 3. 検索実行
  // 4. 結果のパース
  // 5. ページネーション処理

  return {
    success: false,
    source: 'reins',
    properties: [],
    totalFound: 0,
    errors: ['REINS スクレイピングは未実装です'],
    scrapedAt: new Date().toISOString(),
  }
}

// =============================================
// SUUMO スクレイパー
// =============================================

/**
 * SUUMOから土地情報を取得
 * TODO: 実装
 */
export async function scrapeSuumo(options: {
  areas?: string[]
  minPrice?: number
  maxPrice?: number
  minLandArea?: number
  maxLandArea?: number
  trainLine?: string
  stationFrom?: string
  stationTo?: string
  stationWalkMax?: number
}): Promise<ScrapeResult> {
  console.log('[SUUMO] スクレイピング開始', options)

  // TODO: 実装
  // 1. 検索URLの構築
  // 2. ページの取得
  // 3. 物件一覧のパース
  // 4. 各物件の詳細取得
  // 5. ページネーション処理

  return {
    success: false,
    source: 'suumo',
    properties: [],
    totalFound: 0,
    errors: ['SUUMO スクレイピングは未実装です'],
    scrapedAt: new Date().toISOString(),
  }
}

// =============================================
// 統合スクレイパー
// =============================================

/**
 * 複数のソースから土地情報を取得
 */
export async function scrapeAllSources(options: {
  areas?: string[]
  minPrice?: number
  maxPrice?: number
  minLandArea?: number
  maxLandArea?: number
  trainLine?: string
  stationFrom?: string
  stationTo?: string
  stationWalkMax?: number
  sources?: ('reins' | 'suumo' | 'athome' | 'homes')[]
}): Promise<ScrapeResult[]> {
  const sources = options.sources || ['reins', 'suumo']
  const results: ScrapeResult[] = []

  for (const source of sources) {
    const config = SCRAPE_CONFIGS[source]
    if (!config?.enabled) {
      console.log(`[${source.toUpperCase()}] スキップ（無効または未設定）`)
      continue
    }

    try {
      let result: ScrapeResult

      switch (source) {
        case 'reins':
          result = await scrapeReins(options)
          break
        case 'suumo':
          result = await scrapeSuumo(options)
          break
        default:
          result = {
            success: false,
            source,
            properties: [],
            totalFound: 0,
            errors: [`${source} スクレイパーは未実装です`],
            scrapedAt: new Date().toISOString(),
          }
      }

      results.push(result)
    } catch (error) {
      results.push({
        success: false,
        source,
        properties: [],
        totalFound: 0,
        errors: [error instanceof Error ? error.message : '不明なエラー'],
        scrapedAt: new Date().toISOString(),
      })
    }
  }

  return results
}

// =============================================
// ユーティリティ
// =============================================

/**
 * 価格文字列をパース（例: "2,980万円" → 2980）
 */
export function parsePrice(priceStr: string): number | undefined {
  if (!priceStr) return undefined

  // "2,980万円" → 2980
  const match = priceStr.match(/([0-9,]+)\s*万/)
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10)
  }

  // "29,800,000円" → 2980
  const matchYen = priceStr.match(/([0-9,]+)\s*円/)
  if (matchYen) {
    return Math.round(parseInt(matchYen[1].replace(/,/g, ''), 10) / 10000)
  }

  return undefined
}

/**
 * 面積文字列をパース（例: "120.50㎡" → 120.5）
 */
export function parseArea(areaStr: string): number | undefined {
  if (!areaStr) return undefined

  const match = areaStr.match(/([0-9,.]+)\s*[㎡m²]/)
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''))
  }

  // 坪表記の場合
  const tsuboMatch = areaStr.match(/([0-9,.]+)\s*坪/)
  if (tsuboMatch) {
    return parseFloat(tsuboMatch[1].replace(/,/g, '')) * 3.30579 // 坪→㎡
  }

  return undefined
}

/**
 * 駅徒歩文字列をパース（例: "徒歩5分" → 5）
 */
export function parseStationWalk(walkStr: string): number | undefined {
  if (!walkStr) return undefined

  const match = walkStr.match(/徒歩\s*([0-9]+)\s*分/)
  if (match) {
    return parseInt(match[1], 10)
  }

  return undefined
}
