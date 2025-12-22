import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// チェックリストテンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('pipeline_checklist_templates')
      .select('*')
      .eq('is_active', true)
      .order('pipeline_status')
      .order('item_order')

    if (status) {
      query = query.eq('pipeline_status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('Error fetching checklist templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist templates' },
      { status: 500 }
    )
  }
}

// チェックリストテンプレート作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { pipeline_status, title, description, is_required, item_order } = body

    if (!pipeline_status || !title) {
      return NextResponse.json(
        { error: 'pipeline_status and title are required' },
        { status: 400 }
      )
    }

    // 同じステータスの最大item_orderを取得
    let order = item_order
    if (order === undefined) {
      const { data: maxOrder } = await supabase
        .from('pipeline_checklist_templates')
        .select('item_order')
        .eq('pipeline_status', pipeline_status)
        .order('item_order', { ascending: false })
        .limit(1)
        .single()

      order = (maxOrder?.item_order || 0) + 1
    }

    const { data, error } = await supabase
      .from('pipeline_checklist_templates')
      .insert({
        pipeline_status,
        title,
        description: description || null,
        is_required: is_required || false,
        item_order: order,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('Error creating checklist template:', error)
    return NextResponse.json(
      { error: 'Failed to create checklist template' },
      { status: 500 }
    )
  }
}

// チェックリストテンプレート更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pipeline_checklist_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('Error updating checklist template:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist template' },
      { status: 500 }
    )
  }
}

// チェックリストテンプレート削除（論理削除）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pipeline_checklist_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist template:', error)
    return NextResponse.json(
      { error: 'Failed to delete checklist template' },
      { status: 500 }
    )
  }
}
