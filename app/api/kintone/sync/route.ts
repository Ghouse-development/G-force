import { NextResponse } from 'next/server'
import { isKintoneEnabled } from '@/lib/kintone'
import { syncAllCustomersToKintone, syncAllFromKintone } from '@/lib/kintone-sync'

export async function POST(request: Request) {
  if (!isKintoneEnabled()) {
    return NextResponse.json(
      { success: false, error: 'kintone連携が設定されていません' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const direction = body.direction || 'to_kintone'

    let result

    if (direction === 'from_kintone') {
      // kintone → G-force
      result = await syncAllFromKintone()
    } else {
      // G-force → kintone
      result = await syncAllCustomersToKintone()
    }

    return NextResponse.json({
      success: true,
      direction,
      synced: result.success,
      failed: result.failed,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '同期エラーが発生しました',
      },
      { status: 500 }
    )
  }
}
