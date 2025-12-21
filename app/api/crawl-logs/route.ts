/**
 * クロールログ API
 *
 * クロール実行ログと統計情報を取得
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

/**
 * GET: クロールログと統計を取得
 */
export async function GET() {
  try {
    const supabase = await getSupabaseClient()

    // クロールログ取得（直近20件）
    const { data: logs, error: logsError } = await supabase
      .from('crawl_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    if (logsError) {
      console.error('Error fetching crawl logs:', logsError)
      // テーブルが存在しない場合は空配列を返す
      if (logsError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          stats: {
            totalProperties: 0,
            todayCrawls: 0,
            lastCrawl: null,
            matchedAlerts: 0,
          },
        })
      }
    }

    // 統計情報を計算

    // 1. 取得済み物件数
    const { count: totalProperties } = await supabase
      .from('crawled_properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)

    // 2. 本日のクロール回数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayCrawls } = await supabase
      .from('crawl_logs')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', today.toISOString())

    // 3. 最終クロール日時
    const lastCrawl = logs && logs.length > 0 ? logs[0].started_at : null

    // 4. マッチした通知数（未読）
    const { count: matchedAlerts } = await supabase
      .from('property_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      data: logs || [],
      stats: {
        totalProperties: totalProperties || 0,
        todayCrawls: todayCrawls || 0,
        lastCrawl,
        matchedAlerts: matchedAlerts || 0,
      },
    })

  } catch (error) {
    console.error('Error in GET /api/crawl-logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch crawl logs' },
      { status: 500 }
    )
  }
}
