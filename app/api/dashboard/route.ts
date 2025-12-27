import { NextResponse } from 'next/server'
import { dashboardDb, customerDb } from '@/lib/db'
import { getCurrentFiscalYear, getFiscalYearRange } from '@/types/database'

export async function GET() {
  try {
    // 現在の期
    const fiscalYear = getCurrentFiscalYear()
    const { start: fiscalStart } = getFiscalYearRange(fiscalYear)

    // 基本統計を取得
    const stats = await dashboardDb.getStats()

    // 期ごとの契約データ
    const fiscalStartDate = new Date(fiscalStart.replace(/\//g, '-'))
    const contractedThisFiscalYear = await customerDb.getContractedThisFiscalYear(fiscalStartDate)

    // 遷移率の計算
    const transitionRates = calculateTransitionRates(stats.pipelineCounts)

    return NextResponse.json({
      data: {
        fiscalYear,
        pipelineCounts: stats.pipelineCounts,
        planRequestCounts: stats.planRequestCounts,
        recentCustomers: stats.recentCustomers,
        totalCustomers: stats.totalCustomers,
        totalContracts: stats.totalContracts,
        contractedThisFiscalYear: contractedThisFiscalYear.length,
        contractedAmount: contractedThisFiscalYear.reduce(
          (sum, c) => sum + (c.contract_amount || 0),
          0
        ),
        transitionRates
      }
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)

    // エラー時はデフォルト値を返す（ローカルデータで動作させるため）
    return NextResponse.json({
      data: {
        fiscalYear: getCurrentFiscalYear(),
        pipelineCounts: {},
        planRequestCounts: {},
        recentCustomers: [],
        totalCustomers: 0,
        totalContracts: 0,
        contractedThisFiscalYear: 0,
        contractedAmount: 0,
        transitionRates: {}
      }
    })
  }
}

function calculateTransitionRates(
  counts: Record<string, number>
): Record<string, number> {
  const stages = ['反響', 'イベント参加', '限定会員', '面談', '建築申込', '内定', '契約']
  const rates: Record<string, number> = {}

  for (let i = 0; i < stages.length - 1; i++) {
    const current = counts[stages[i]] || 0
    const next = counts[stages[i + 1]] || 0

    if (current > 0) {
      rates[`${stages[i]}→${stages[i + 1]}`] = Math.round((next / current) * 100)
    }
  }

  return rates
}
