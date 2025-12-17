'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PIPELINE_CONFIG, type PipelineStatus } from '@/types/database'

interface FunnelStage {
  status: PipelineStatus
  count: number
  amount: number
}

interface PipelineFunnelProps {
  data: FunnelStage[]
  title?: string
  showAmount?: boolean
}

export function PipelineFunnel({
  data,
  title = 'パイプライン遷移率',
  showAmount = true
}: PipelineFunnelProps) {
  // 最大値を取得（グラフのスケール用）
  const maxCount = Math.max(...data.map(d => d.count), 1)

  // 遷移率を計算
  const getConversionRate = (index: number): number | null => {
    if (index === 0) return null
    const prev = data[index - 1]?.count || 0
    const current = data[index]?.count || 0
    if (prev === 0) return 0
    return Math.round((current / prev) * 100)
  }

  // 累積遷移率を計算（反響からの遷移率）
  const getCumulativeRate = (index: number): number => {
    const first = data[0]?.count || 0
    const current = data[index]?.count || 0
    if (first === 0) return 0
    return Math.round((current / first) * 100)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, index) => {
            const config = PIPELINE_CONFIG[stage.status]
            const widthPercent = (stage.count / maxCount) * 100
            const conversionRate = getConversionRate(index)
            const cumulativeRate = getCumulativeRate(index)

            return (
              <div key={stage.status} className="space-y-1">
                {/* ステージラベルと数値 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {conversionRate !== null && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {conversionRate >= 50 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : conversionRate >= 30 ? (
                          <Minus className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        {conversionRate}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{stage.count}件</span>
                    {showAmount && stage.amount > 0 && (
                      <span className="text-xs text-gray-500">
                        ¥{(stage.amount / 10000).toLocaleString()}万
                      </span>
                    )}
                  </div>
                </div>

                {/* ファネルバー */}
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full ${config.bgColor} transition-all duration-500 ease-out rounded-lg flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(widthPercent, 5)}%` }}
                  >
                    {index > 0 && widthPercent > 20 && (
                      <span className="text-xs font-medium text-gray-600">
                        累計{cumulativeRate}%
                      </span>
                    )}
                  </div>
                </div>

                {/* 遷移率の矢印 */}
                {index < data.length - 1 && (
                  <div className="flex justify-center py-1">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 16l-6-6h12l-6 6z" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* サマリー */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">総反響数</p>
              <p className="font-bold text-lg text-gray-900">
                {data[0]?.count || 0}件
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">契約件数</p>
              <p className="font-bold text-lg text-orange-600">
                {data.find(d => d.status === '契約')?.count || 0}件
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">契約率</p>
              <p className="font-bold text-lg text-green-600">
                {data[0]?.count > 0
                  ? Math.round(((data.find(d => d.status === '契約')?.count || 0) / data[0].count) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 簡易版のミニファネル（カード内表示用）
interface MiniFunnelProps {
  stages: { label: string; count: number; color: string }[]
}

export function MiniFunnel({ stages }: MiniFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => (
        <div key={stage.label} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 truncate">{stage.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full ${stage.color} rounded transition-all duration-300`}
              style={{ width: `${(stage.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-8 text-right">
            {stage.count}
          </span>
        </div>
      ))}
    </div>
  )
}
