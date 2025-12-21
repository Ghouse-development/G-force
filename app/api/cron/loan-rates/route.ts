/**
 * 住宅ローン金利クロール API
 *
 * Vercel Cronで毎日実行（vercel.jsonで設定）
 * 手動実行も可能
 */

import { NextRequest, NextResponse } from 'next/server'
import { crawlLoanRates, getLatestRates, getRecentRateChanges } from '@/lib/crawl/loan-rate-crawler'

// Cron認証用のシークレット
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET: 最新の金利情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'latest'

    if (type === 'changes') {
      // 金利変更があった銀行を取得
      const days = parseInt(searchParams.get('days') || '7')
      const changes = await getRecentRateChanges(days)
      return NextResponse.json({
        success: true,
        data: changes,
        count: changes.length,
      })
    }

    // 最新の金利一覧を取得
    const rates = await getLatestRates()
    return NextResponse.json({
      success: true,
      data: rates,
      count: rates.length,
    })

  } catch (error) {
    console.error('Error in GET /api/cron/loan-rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan rates' },
      { status: 500 }
    )
  }
}

/**
 * POST: 金利クロールを実行
 *
 * Vercel Cronから呼び出される、または手動実行
 */
export async function POST(request: NextRequest) {
  try {
    // Cron認証（Vercel Cronからの呼び出しの場合）
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      // 開発環境では認証をスキップ
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('Starting loan rate crawl...')
    const result = await crawlLoanRates()

    console.log('Crawl result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Loan rates crawled successfully' : 'Crawl completed with errors',
      data: {
        itemsFetched: result.itemsFetched,
        itemsNew: result.itemsNew,
        itemsUpdated: result.itemsUpdated,
        errors: result.errors,
      },
    })

  } catch (error) {
    console.error('Error in POST /api/cron/loan-rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to crawl loan rates' },
      { status: 500 }
    )
  }
}
