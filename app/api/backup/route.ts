import { NextRequest, NextResponse } from 'next/server'
import {
  backupDb,
  customerDb,
  planRequestDb,
  contractDb,
  fundPlanDb,
  userDb,
  productDb,
  activityDb,
  handoverDb,
  salesTargetDb,
  fileDb
} from '@/lib/db'

// バックアップ一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'full' | 'incremental' | 'manual' | null
    const status = searchParams.get('status') as 'completed' | 'failed' | 'expired' | null
    const limitStr = searchParams.get('limit')

    const backups = await backupDb.listBackups({
      type: type || undefined,
      status: status || undefined,
      limit: limitStr ? parseInt(limitStr) : undefined
    })

    return NextResponse.json({
      data: backups,
      count: backups.length
    })
  } catch (error) {
    console.error('GET /api/backup error:', error)
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    )
  }
}

// 新規バックアップを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type = 'manual' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const backup = await backupDb.createBackup(userId, type)

    return NextResponse.json({
      data: backup,
      message: 'Backup created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}

// 完全バックアップをダウンロード（JSONエクスポート）
export async function PUT() {
  try {
    // 全データを取得（すべてのテーブル）
    const [
      customers,
      planRequests,
      contracts,
      fundPlans,
      users,
      products,
      activities,
      handovers,
      salesTargets,
      files
    ] = await Promise.all([
      customerDb.getAll().catch(() => []),
      planRequestDb.getAll().catch(() => []),
      contractDb.getAll().catch(() => []),
      fundPlanDb.getAll().catch(() => []),
      userDb.getAll().catch(() => []),
      productDb.getAll().catch(() => []),
      activityDb.getAll().catch(() => []),
      handoverDb.getAll().catch(() => []),
      salesTargetDb.getAll().catch(() => []),
      fileDb.getAll().catch(() => [])
    ])

    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tenantId: '00000000-0000-0000-0000-000000000001',
      data: {
        customers,
        planRequests,
        contracts,
        fundPlans,
        users,
        products,
        activities,
        handovers,
        salesTargets,
        files // Metadata only
      },
      recordCounts: {
        customers: customers.length,
        planRequests: planRequests.length,
        contracts: contracts.length,
        fundPlans: fundPlans.length,
        users: users.length,
        products: products.length,
        activities: activities.length,
        handovers: handovers.length,
        salesTargets: salesTargets.length,
        files: files.length
      },
      totalRecords: customers.length + planRequests.length + contracts.length +
        fundPlans.length + users.length + products.length + activities.length +
        handovers.length + salesTargets.length + files.length
    }

    const filename = `gforce-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('PUT /api/backup error:', error)
    return NextResponse.json(
      { error: 'Failed to export backup' },
      { status: 500 }
    )
  }
}

// バックアップを削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      )
    }

    await backupDb.deleteBackup(backupId)

    return NextResponse.json({
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/backup error:', error)
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
}
