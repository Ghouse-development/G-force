/**
 * 不動産物件クロール・マッチング API
 *
 * Vercel Cronで毎日実行（vercel.jsonで設定）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { processNewProperties } from '@/lib/crawl/property-matcher'

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

    return NextResponse.json({
      success: true,
      data: {
        total: stats?.length || 0,
        unread: stats?.filter((n: { is_read: boolean }) => !n.is_read).length || 0,
        last7Days: stats?.length || 0,
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
 * POST: 物件マッチング処理を実行
 *
 * 注意: 実際の物件クロールはサイトの利用規約を確認してから実装してください
 * 現在は手動で追加された物件に対するマッチング処理のみ
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
    const { propertyIds } = body

    if (propertyIds && Array.isArray(propertyIds)) {
      // 指定された物件IDに対してマッチング
      const result = await processNewProperties(propertyIds)
      return NextResponse.json({
        success: true,
        message: 'Property matching completed',
        data: result,
      })
    }

    // 新規物件（最近追加されたもの）に対してマッチング
    const supabase = await getSupabaseClient()
    const { data: newProperties, error } = await supabase
      .from('crawled_properties')
      .select('id')
      .gte('first_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    if (!newProperties || newProperties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new properties to process',
        data: { processed: 0, notificationsCreated: 0 },
      })
    }

    const ids = newProperties.map((p: { id: string }) => p.id)
    const result = await processNewProperties(ids)

    return NextResponse.json({
      success: true,
      message: 'Property matching completed',
      data: result,
    })

  } catch (error) {
    console.error('Error in POST /api/cron/properties:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process properties' },
      { status: 500 }
    )
  }
}
