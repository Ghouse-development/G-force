/**
 * 物件アラートAPI
 *
 * POST: 新規アラート登録
 * GET: アラート一覧取得
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

/**
 * GET: 顧客のアラート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    let query = supabase
      .from('property_alerts')
      .select(`
        *,
        customer:customers(id, name, tei_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/property-alerts:', error)
    return NextResponse.json(
      { success: false, error: 'アラートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST: 新規アラート登録
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const {
      customerId,
      alertName,
      areas,
      minPrice,
      maxPrice,
      minLandArea,
      maxLandArea,
      stationWalkMax,
      roadWidthMin,
      keywords,
    } = body

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '顧客IDが必要です' },
        { status: 400 }
      )
    }

    // 既存のアクティブなアラートがあるか確認
    const { data: existing } = await supabase
      .from('property_alerts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .single()

    if (existing) {
      // 既存アラートを更新
      const { data, error } = await supabase
        .from('property_alerts')
        .update({
          alert_name: alertName,
          areas: areas || [],
          min_price: minPrice,
          max_price: maxPrice,
          min_land_area: minLandArea,
          max_land_area: maxLandArea,
          station_walk_max: stationWalkMax,
          road_width_min: roadWidthMin,
          keywords: keywords || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'アラートを更新しました',
        data,
      })
    }

    // 新規作成
    const { data, error } = await supabase
      .from('property_alerts')
      .insert({
        customer_id: customerId,
        alert_name: alertName || '土地アラート',
        is_active: true,
        areas: areas || [],
        min_price: minPrice,
        max_price: maxPrice,
        min_land_area: minLandArea,
        max_land_area: maxLandArea,
        station_walk_max: stationWalkMax,
        road_width_min: roadWidthMin,
        keywords: keywords || [],
        notify_email: true,
        notify_app: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'アラートを登録しました',
      data,
    })
  } catch (error) {
    console.error('Error in POST /api/property-alerts:', error)
    return NextResponse.json(
      { success: false, error: 'アラートの登録に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: アラート更新（有効/無効切り替えなど）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'アラートIDが必要です' },
        { status: 400 }
      )
    }

    // スネークケースに変換
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if ('isActive' in updates) updateData.is_active = updates.isActive
    if ('alertName' in updates) updateData.alert_name = updates.alertName
    if ('areas' in updates) updateData.areas = updates.areas
    if ('minPrice' in updates) updateData.min_price = updates.minPrice
    if ('maxPrice' in updates) updateData.max_price = updates.maxPrice
    if ('minLandArea' in updates) updateData.min_land_area = updates.minLandArea
    if ('maxLandArea' in updates) updateData.max_land_area = updates.maxLandArea
    if ('stationWalkMax' in updates) updateData.station_walk_max = updates.stationWalkMax
    if ('roadWidthMin' in updates) updateData.road_width_min = updates.roadWidthMin

    const { data, error } = await supabase
      .from('property_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'アラートを更新しました',
      data,
    })
  } catch (error) {
    console.error('Error in PATCH /api/property-alerts:', error)
    return NextResponse.json(
      { success: false, error: 'アラートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: アラート削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'アラートIDが必要です' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('property_alerts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'アラートを削除しました',
    })
  } catch (error) {
    console.error('Error in DELETE /api/property-alerts:', error)
    return NextResponse.json(
      { success: false, error: 'アラートの削除に失敗しました' },
      { status: 500 }
    )
  }
}
