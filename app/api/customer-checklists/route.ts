import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getSupabaseClient() {
  return await createServerSupabaseClient() as any
}

// 顧客のチェックリスト進捗取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    // テンプレートと顧客の進捗を結合して取得
    let templateQuery = supabase
      .from('pipeline_checklist_templates')
      .select('*')
      .eq('is_active', true)
      .order('item_order')

    if (status) {
      templateQuery = templateQuery.eq('pipeline_status', status)
    }

    const { data: templates, error: templateError } = await templateQuery

    if (templateError) throw templateError

    // 顧客のチェックリスト進捗を取得
    const { data: customerItems, error: itemError } = await supabase
      .from('customer_checklist_items')
      .select('*')
      .eq('customer_id', customerId)

    if (itemError) throw itemError

    // テンプレートと進捗をマージ
    const itemMap = new Map<string, any>(customerItems?.map((item: any) => [item.template_id, item]) || [])

    const mergedItems = templates?.map((template: any) => {
      const customerItem = itemMap.get(template.id)
      return {
        ...template,
        customer_item: customerItem || null,
        is_completed: customerItem?.is_completed || false,
      }
    }) || []

    // ステータスごとにグループ化
    const groupedByStatus = mergedItems.reduce((acc: any, item: any) => {
      if (!acc[item.pipeline_status]) {
        acc[item.pipeline_status] = []
      }
      acc[item.pipeline_status].push(item)
      return acc
    }, {} as Record<string, typeof mergedItems>)

    return NextResponse.json({
      items: mergedItems,
      groupedByStatus,
    })
  } catch (error) {
    console.error('Error fetching customer checklists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer checklists' },
      { status: 500 }
    )
  }
}

// チェックリスト項目の完了/未完了を切り替え
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { customer_id, template_id, is_completed, notes } = body

    if (!customer_id || !template_id) {
      return NextResponse.json(
        { error: 'customer_id and template_id are required' },
        { status: 400 }
      )
    }

    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser()

    // upsert（存在すれば更新、なければ挿入）
    const { data, error } = await supabase
      .from('customer_checklist_items')
      .upsert({
        customer_id,
        template_id,
        is_completed: is_completed ?? true,
        completed_at: is_completed ? new Date().toISOString() : null,
        completed_by: is_completed ? user?.id : null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,template_id',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist item' },
      { status: 500 }
    )
  }
}

// メモを更新
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { customer_id, template_id, notes } = body

    if (!customer_id || !template_id) {
      return NextResponse.json(
        { error: 'customer_id and template_id are required' },
        { status: 400 }
      )
    }

    // upsert
    const { data, error } = await supabase
      .from('customer_checklist_items')
      .upsert({
        customer_id,
        template_id,
        notes,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,template_id',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error updating checklist notes:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist notes' },
      { status: 500 }
    )
  }
}
