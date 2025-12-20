import { NextRequest, NextResponse } from 'next/server'
import { backupDb, type BackupData } from '@/lib/db'
import { getSupabaseClient } from '@/lib/supabase'

// バックアップIDから復元
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { backupId, backupData, tables, dryRun = false } = body

    // バックアップIDから復元
    if (backupId) {
      const result = await backupDb.restoreBackup(backupId, {
        tables,
        dryRun
      })

      if (result.errors.length > 0) {
        return NextResponse.json({
          message: dryRun ? 'Dry run completed with errors' : 'Restore completed with errors',
          ...result
        }, { status: 207 }) // Multi-Status
      }

      return NextResponse.json({
        message: dryRun ? 'Dry run successful' : 'Restore completed successfully',
        ...result
      })
    }

    // JSONデータから直接復元
    if (backupData && backupData.data) {
      return await restoreFromJson(backupData as BackupData, tables, dryRun)
    }

    return NextResponse.json(
      { error: 'Either backupId or backupData is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('POST /api/backup/restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore backup' },
      { status: 500 }
    )
  }
}

// JSONデータから復元するヘルパー関数
async function restoreFromJson(
  backupData: BackupData,
  tables?: string[],
  dryRun = false
): Promise<NextResponse> {
  const supabase = getSupabaseClient()
  const results: Record<string, { success: number; failed: number; error?: string }> = {}
  const errors: string[] = []

  // テーブル名とDBテーブル名のマッピング
  const tableMap: Record<string, string> = {
    customers: 'customers',
    planRequests: 'plan_requests',
    contracts: 'contracts',
    fundPlans: 'fund_plans',
    activities: 'activities',
    handovers: 'handovers',
    salesTargets: 'sales_targets',
    files: 'files',
    users: 'users',
    products: 'products'
  }

  // 復元順序（外部キー制約を考慮）
  const restoreOrder = [
    'users',
    'products',
    'customers',
    'planRequests',
    'fundPlans',
    'contracts',
    'activities',
    'handovers',
    'salesTargets',
    'files'
  ]

  const tablesToRestore = tables || restoreOrder

  if (dryRun) {
    // ドライランの場合はデータの検証のみ
    for (const tableName of restoreOrder) {
      if (!tablesToRestore.includes(tableName)) continue
      const data = backupData.data[tableName as keyof typeof backupData.data]
      if (data && Array.isArray(data)) {
        results[tableName] = { success: data.length, failed: 0 }
      }
    }

    return NextResponse.json({
      message: 'Dry run completed - no changes made',
      results,
      totalRecords: Object.values(results).reduce((sum, r) => sum + r.success, 0),
      dryRun: true
    })
  }

  // 実際の復元処理
  for (const tableName of restoreOrder) {
    if (!tablesToRestore.includes(tableName)) continue

    const dbTableName = tableMap[tableName]
    const data = backupData.data[tableName as keyof typeof backupData.data]

    if (!data || !Array.isArray(data) || data.length === 0) {
      results[tableName] = { success: 0, failed: 0 }
      continue
    }

    try {
      // ユーザーと商品以外のテーブルはまず削除しない（upsertで対応）
      // バッチ処理で100件ずつ
      const batchSize = 100
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(dbTableName)
          .upsert(batch, { onConflict: 'id' })

        if (error) {
          failedCount += batch.length
          errors.push(`${tableName}: ${error.message}`)
        } else {
          successCount += batch.length
        }
      }

      results[tableName] = { success: successCount, failed: failedCount }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      results[tableName] = { success: 0, failed: data.length, error: errorMessage }
      errors.push(`${tableName}: ${errorMessage}`)
    }
  }

  const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0)
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0)

  if (totalFailed > 0) {
    return NextResponse.json({
      message: 'Restore completed with some errors',
      results,
      totalSuccess,
      totalFailed,
      errors
    }, { status: 207 })
  }

  return NextResponse.json({
    message: 'Restore completed successfully',
    results,
    totalSuccess,
    totalFailed: 0
  })
}

// 特定のバックアップをダウンロード
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      )
    }

    const backupData = await backupDb.downloadBackup(backupId)
    const filename = `gforce-backup-${backupData.timestamp.replace(/[:.]/g, '-')}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('GET /api/backup/restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download backup' },
      { status: 500 }
    )
  }
}
