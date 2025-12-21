import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient() as any

    // マッチング通知を取得（物件・顧客情報を含む）
    const { data: notifications, error } = await supabase
      .from('property_notifications')
      .select(`
        *,
        property:crawled_properties (
          id,
          title,
          price,
          address,
          area,
          land_area,
          station_name,
          station_walk,
          source_url
        ),
        customer:customers (
          id,
          name,
          tei_name
        )
      `)
      .gte('match_score', 70)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // 未読件数を取得
    const { count: unreadCount } = await supabase
      .from('property_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .gte('match_score', 70)

    return NextResponse.json({
      notifications: notifications || [],
      total: notifications?.length || 0,
      unread: unreadCount || 0,
    })
  } catch (error) {
    console.error('Property notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 通知を既読にする
export async function PATCH(request: Request) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient() as any

    const { error } = await supabase
      .from('property_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to mark as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
