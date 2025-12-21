import { NextResponse } from 'next/server'
import { customerDb } from '@/lib/db'
import {
  isSpreadsheetEnabled,
  getSheetData,
  mapRowToCustomer,
  SHEET_TYPES,
} from '@/lib/spreadsheet'

/**
 * Googleスプレッドシートからデータをインポート
 *
 * POST /api/spreadsheet/import
 * Body: { sheetName: string }
 */
export async function POST(request: Request) {
  if (!isSpreadsheetEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Googleスプレッドシート連携が設定されていません。環境変数を確認してください。',
      },
      { status: 400 }
    )
  }

  try {
    const { sheetName } = await request.json()

    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'シート名が必要です' },
        { status: 400 }
      )
    }

    // シート種別を取得
    const sheetType = SHEET_TYPES[sheetName as keyof typeof SHEET_TYPES] || 'inquiry'

    // スプレッドシートからデータを取得
    const rows = await getSheetData(sheetName)

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: 0,
        message: 'インポートするデータがありませんでした',
      })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // 既存顧客を取得（重複チェック用）
    const existingCustomers = await customerDb.getAll()
    const existingPhones = new Set(existingCustomers.map((c) => c.phone).filter(Boolean))
    const existingEmails = new Set(existingCustomers.map((c) => c.email).filter(Boolean))

    for (const row of rows) {
      try {
        const customerData = mapRowToCustomer(row, sheetType)

        // 重複チェック
        if (customerData.phone && existingPhones.has(customerData.phone as string)) {
          skipped++
          continue
        }
        if (customerData.email && existingEmails.has(customerData.email as string)) {
          skipped++
          continue
        }

        // 名前が必須
        if (!customerData.name) {
          customerData.name = '名前未設定（スプレッドシート）'
        }

        // 顧客を作成
        const created = await customerDb.create(
          customerData as Parameters<typeof customerDb.create>[0]
        )

        if (created) {
          imported++
          // 重複セットを更新
          if (customerData.phone) existingPhones.add(customerData.phone as string)
          if (customerData.email) existingEmails.add(customerData.email as string)
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Row ${imported + skipped + 1}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported}件インポート、${skipped}件スキップしました`,
    })
  } catch (error) {
    console.error('Spreadsheet import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'インポートエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

/**
 * スプレッドシート接続状態を確認
 */
export async function GET() {
  if (!isSpreadsheetEnabled()) {
    return NextResponse.json({
      enabled: false,
      connected: false,
      message: 'Googleスプレッドシート連携が設定されていません',
    })
  }

  try {
    const { checkSpreadsheetConnection } = await import('@/lib/spreadsheet')
    const result = await checkSpreadsheetConnection()

    return NextResponse.json({
      enabled: true,
      ...result,
    })
  } catch (error) {
    return NextResponse.json({
      enabled: true,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
