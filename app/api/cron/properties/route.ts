/**
 * 不動産物件クロール・マッチング API
 *
 * Vercel Cronで毎日実行（vercel.jsonで設定）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { processNewProperties } from '@/lib/crawl/property-matcher'
import { crawlAllKansaiProperties, crawlSuumoProperties, logCrawl } from '@/lib/crawl/property-crawler'

// 型定義がまだ生成されていないため、anyを許可
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET: マッチング済み通知一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (customerId) {
      // 特定顧客の通知を取得
      const { data, error } = await supabase
        .from('property_notifications')
        .select(`
          *,
          property:crawled_properties(*),
          alert:property_alerts(alert_name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return NextResponse.json({
        success: true,
        data,
        count: data?.length || 0,
      })
    }

    // 全体の統計
    const { data: stats, error: statsError } = await supabase
      .from('property_notifications')
      .select('id, is_read, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (statsError) throw statsError

    // クロール済み物件数
    const { count: propertyCount } = await supabase
      .from('crawled_properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)

    return NextResponse.json({
      success: true,
      data: {
        total: stats?.length || 0,
        unread: stats?.filter((n: { is_read: boolean }) => !n.is_read).length || 0,
        last7Days: stats?.length || 0,
        totalProperties: propertyCount || 0,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/cron/properties:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST: 物件クロール＆マッチング処理を実行
 *
 * body.action:
 *   - 'crawl': SUUMOからクロールのみ
 *   - 'match': マッチング処理のみ
 *   - 'full' または省略: クロール→マッチング
 */
export async function POST(request: NextRequest) {
  try {
    // Cron認証
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json().catch(() => ({}))
    const { action = 'full', propertyIds, prefCode, cityCodes, maxPages } = body

    const supabase = await getSupabaseClient()
    const results: any = {}

    // ========================================
    // クロール処理
    // ========================================
    if (action === 'crawl' || action === 'full') {
      console.log('Starting SUUMO crawl...')

      let crawlResult

      if (prefCode && cityCodes) {
        // 特定エリアのみクロール
        crawlResult = await crawlSuumoProperties(prefCode, cityCodes, { maxPages: maxPages || 3 })
        results.crawl = {
          area: 'specified',
          ...crawlResult,
        }
      } else {
        // 関西全域クロール
        crawlResult = await crawlAllKansaiProperties({ maxPages: maxPages || 3 })
        results.crawl = crawlResult
      }

      // クロールログ記録
      const itemsFetched = 'propertiesFound' in crawlResult
        ? crawlResult.propertiesFound
        : ('totalFound' in crawlResult ? crawlResult.totalFound : 0)
      const itemsNew = 'propertiesSaved' in crawlResult
        ? crawlResult.propertiesSaved
        : ('totalSaved' in crawlResult ? crawlResult.totalSaved : 0)

      await logCrawl(
        crawlResult.success ? 'success' : (crawlResult.errors?.length > 0 ? 'partial' : 'error'),
        {
          itemsFetched,
          itemsNew,
          itemsUpdated: 0,
          errorMessage: crawlResult.errors?.join('; '),
        }
      )

      console.log('Crawl completed:', results.crawl)
    }

    // ========================================
    // マッチング処理
    // ========================================
    if (action === 'match' || action === 'full') {
      console.log('Starting property matching...')

      let idsToProcess: string[] = []

      if (propertyIds && Array.isArray(propertyIds)) {
        // 指定されたIDを使用
        idsToProcess = propertyIds
      } else {
        // 最近クロールされた物件を対象
        const { data: newProperties, error } = await supabase
          .from('crawled_properties')
          .select('id')
          .gte('first_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (error) throw error
        idsToProcess = (newProperties || []).map((p: { id: string }) => p.id)
      }

      if (idsToProcess.length > 0) {
        const matchResult = await processNewProperties(idsToProcess)
        results.match = matchResult
        console.log('Matching completed:', matchResult)
      } else {
        results.match = { processed: 0, notificationsCreated: 0 }
        console.log('No properties to match')
      }
    }

    return NextResponse.json({
      success: true,
      message: `Property ${action} completed`,
      data: results,
    })

  } catch (error) {
    console.error('Error in POST /api/cron/properties:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process properties' },
      { status: 500 }
    )
  }
}
