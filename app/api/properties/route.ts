/**
 * 物件情報API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

/**
 * GET: 物件一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)

    // クエリパラメータ
    const area = searchParams.get('area')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minArea = searchParams.get('minArea')
    const maxArea = searchParams.get('maxArea')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('crawled_properties')
      .select('*')
      .eq('is_available', true)
      .order('first_seen_at', { ascending: false })

    // フィルタ適用
    if (area) {
      query = query.ilike('area', `%${area}%`)
    }
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice))
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice))
    }
    if (minArea) {
      query = query.gte('land_area', parseFloat(minArea))
    }
    if (maxArea) {
      query = query.lte('land_area', parseFloat(maxArea))
    }

    query = query.limit(limit)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    })

  } catch (error) {
    console.error('Error in GET /api/properties:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties', data: [] },
      { status: 500 }
    )
  }
}
