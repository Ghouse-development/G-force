'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  DollarSign,
} from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red'
}

const colorConfig = {
  orange: {
    bg: 'bg-gradient-to-br from-orange-100 to-yellow-100',
    iconBg: 'bg-gradient-to-br from-orange-500 to-yellow-500',
    text: 'text-orange-600',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-100 to-emerald-100',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    text: 'text-green-600',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    text: 'text-purple-600',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-100 to-rose-100',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
    text: 'text-red-600',
  },
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  color = 'orange',
}: KPICardProps) {
  const config = colorConfig[color]

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${config.text}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-gray-400">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 目標達成率カード
interface TargetProgressCardProps {
  title: string
  current: number
  target: number
  unit?: string
  color?: 'orange' | 'blue' | 'green' | 'purple'
}

export function TargetProgressCard({
  title,
  current,
  target,
  unit = '件',
  color = 'orange',
}: TargetProgressCardProps) {
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0
  const config = colorConfig[color]

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
            {percentage}%
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={Math.min(percentage, 100)} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              現在: <span className="font-bold text-gray-900">{current}{unit}</span>
            </span>
            <span className="text-gray-500">
              目標: <span className="font-bold text-gray-900">{target}{unit}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 遷移率カード
interface ConversionRateCardProps {
  fromLabel: string
  toLabel: string
  fromCount: number
  toCount: number
  benchmark?: number
}

export function ConversionRateCard({
  fromLabel,
  toLabel,
  fromCount,
  toCount,
  benchmark,
}: ConversionRateCardProps) {
  const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0
  const isBelowBenchmark = benchmark !== undefined && rate < benchmark

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {fromLabel} → {toLabel}
          </div>
          {benchmark !== undefined && (
            <div className={`text-xs ${isBelowBenchmark ? 'text-red-500' : 'text-green-500'}`}>
              基準: {benchmark}%
            </div>
          )}
        </div>
        <div className="flex items-end justify-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{rate}</p>
            <p className="text-sm text-gray-500">%</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          <span>{fromLabel}: {fromCount}件</span>
          <span>{toLabel}: {toCount}件</span>
        </div>
      </CardContent>
    </Card>
  )
}

// サマリーカードグリッド（事前定義のKPIセット）
interface DashboardKPIGridProps {
  leadsCount: number
  meetingsCount: number
  contractsCount: number
  contractsAmount: number
  targetContracts: number
  targetAmount: number
  conversionRate: number
  prevMonthChange?: number
}

export function DashboardKPIGrid({
  leadsCount,
  meetingsCount,
  contractsCount,
  contractsAmount,
  targetContracts,
  targetAmount,
  conversionRate: _conversionRate,
  prevMonthChange = 0,
}: DashboardKPIGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="反響数"
        value={leadsCount}
        subtitle="今期累計"
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />
      <KPICard
        title="面談数"
        value={meetingsCount}
        subtitle="今期累計"
        icon={<FileText className="w-6 h-6" />}
        color="purple"
      />
      <KPICard
        title="契約件数"
        value={`${contractsCount}/${targetContracts}`}
        subtitle={`達成率 ${targetContracts > 0 ? Math.round((contractsCount / targetContracts) * 100) : 0}%`}
        change={prevMonthChange}
        changeLabel="前月比"
        icon={<Target className="w-6 h-6" />}
        color="orange"
      />
      <KPICard
        title="契約金額"
        value={`¥${(contractsAmount / 10000).toLocaleString()}万`}
        subtitle={`目標 ¥${(targetAmount / 10000).toLocaleString()}万`}
        icon={<DollarSign className="w-6 h-6" />}
        color="green"
      />
    </div>
  )
}
