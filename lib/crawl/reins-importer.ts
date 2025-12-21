/**
 * レインズCSVインポーター
 *
 * レインズからダウンロードしたCSVファイルを
 * G-forceの物件データに変換してインポート
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// レインズCSVのフィールドマッピング（一般的なフォーマット）
// ※実際のレインズCSVに合わせて調整が必要
export const REINS_FIELD_MAPPING: Record<string, string> = {
  // 物件基本情報
  '物件番号': 'source_id',
  '物件種目': 'property_type',
  '物件名': 'title',
  '所在地': 'address',
  '交通': 'access',

  // 価格
  '販売価格': 'price',
  '価格': 'price',
  '価格（万円）': 'price',

  // 土地情報
  '土地面積': 'land_area',
  '土地面積（㎡）': 'land_area',
  '地目': 'land_type',
  '土地権利': 'land_rights',

  // 建築条件
  '建ぺい率': 'building_coverage',
  '建ぺい率（％）': 'building_coverage',
  '容積率': 'floor_area_ratio',
  '容積率（％）': 'floor_area_ratio',

  // 道路情報
  '接道状況': 'road_info',
  '前面道路': 'road_direction',
  '道路幅員': 'road_width',
  '道路幅員（ｍ）': 'road_width',

  // 交通
  '最寄駅': 'station_name',
  '駅徒歩': 'station_walk',
  '駅徒歩（分）': 'station_walk',

  // その他
  '現況': 'current_status',
  '引渡時期': 'handover_timing',
  '用途地域': 'use_district',
  '都市計画': 'city_planning',
  '備考': 'notes',
  '掲載開始日': 'listing_date',
  '更新日': 'updated_date',
}

export interface ReinsImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

export interface ParsedReinsProperty {
  source_id: string
  title?: string
  address?: string
  price?: number
  land_area?: number
  building_coverage?: number
  floor_area_ratio?: number
  road_width?: number
  road_direction?: string
  station_name?: string
  station_walk?: number
  notes?: string
  [key: string]: unknown
}

/**
 * CSVをパース
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return []

  // ヘッダー行を取得
  const headers = parseCSVLine(lines[0])

  // データ行をパース
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || ''
    })
    rows.push(row)
  }

  return rows
}

/**
 * CSV行をパース（ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

/**
 * CSVの行をG-force物件データに変換
 */
export function mapReinsRowToProperty(row: Record<string, string>): ParsedReinsProperty | null {
  const property: ParsedReinsProperty = {
    source_id: '',
  }

  // フィールドマッピングを適用
  for (const [csvField, gforceField] of Object.entries(REINS_FIELD_MAPPING)) {
    const value = row[csvField]
    if (value !== undefined && value !== '') {
      // 数値フィールドの変換
      if (['price', 'land_area', 'building_coverage', 'floor_area_ratio', 'road_width', 'station_walk'].includes(gforceField)) {
        const numValue = parseFloat(value.replace(/[,，]/g, ''))
        if (!isNaN(numValue)) {
          property[gforceField] = numValue
        }
      } else {
        property[gforceField] = value
      }
    }
  }

  // 物件番号がなければスキップ
  if (!property.source_id) {
    // 物件番号がない場合は最初のフィールドを使用
    const firstValue = Object.values(row)[0]
    if (firstValue) {
      property.source_id = `reins_${firstValue.replace(/\s/g, '_')}`
    } else {
      return null
    }
  }

  // タイトルがなければ住所を使用
  if (!property.title && property.address) {
    property.title = `土地 ${property.address}`
  }

  return property
}

/**
 * レインズCSVをインポート
 */
export async function importReinsCSV(csvContent: string): Promise<ReinsImportResult> {
  const result: ReinsImportResult = {
    success: true,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  try {
    const rows = parseCSV(csvContent)

    if (rows.length === 0) {
      result.errors.push('CSVにデータがありません')
      result.success = false
      return result
    }

    const supabase = await getSupabaseClient()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const property = mapReinsRowToProperty(row)

        if (!property) {
          result.skipped++
          continue
        }

        const now = new Date().toISOString()

        // upsert
        const { error } = await supabase
          .from('crawled_properties')
          .upsert({
            source: 'reins',
            source_id: property.source_id,
            source_url: null,
            title: property.title || `土地物件 (レインズ)`,
            price: property.price,
            address: property.address,
            area: extractArea(property.address),
            land_area: property.land_area,
            building_coverage: property.building_coverage,
            floor_area_ratio: property.floor_area_ratio,
            road_width: property.road_width,
            road_direction: property.road_direction,
            station_name: property.station_name,
            station_walk: property.station_walk,
            is_available: true,
            first_seen_at: now,
            last_seen_at: now,
            notes: property.notes,
          }, {
            onConflict: 'source,source_id',
            ignoreDuplicates: false,
          })

        if (error) {
          result.errors.push(`行${i + 2}: ${error.message}`)
        } else {
          result.imported++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`行${i + 2}: ${msg}`)
      }
    }

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'パースエラー')
  }

  return result
}

/**
 * 住所からエリア（市区町村）を抽出
 */
function extractArea(address?: string): string | undefined {
  if (!address) return undefined

  const match = address.match(/((?:大阪|京都|神戸|堺|奈良|和歌山)?[^都道府県]+?(?:市|区|町|村))/)
  return match ? match[1] : undefined
}

/**
 * インポート後にマッチング処理を実行
 */
export async function runMatchingAfterImport(importedPropertyIds: string[]): Promise<{
  processed: number
  notificationsCreated: number
}> {
  if (importedPropertyIds.length === 0) {
    return { processed: 0, notificationsCreated: 0 }
  }

  const { processNewProperties } = await import('./property-matcher')
  return processNewProperties(importedPropertyIds)
}
