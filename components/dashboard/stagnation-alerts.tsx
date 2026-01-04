'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Clock,
  Phone,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import {
  type Customer,
  PIPELINE_CONFIG,
} from '@/types/database'
import {
  findStagnantCustomers,
  type StagnationInfo,
  type StagnationLevel,
} from '@/lib/stagnation'

interface StagnationAlertsProps {
  customers: Partial<Customer>[]
  maxItems?: number
}

const levelConfig: Record<StagnationLevel, {
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode
}> = {
  normal: {
    label: '正常',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: null,
  },
  warning: {
    label: '注意',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: <Clock className="w-4 h-4" />,
  },
  danger: {
    label: '要対応',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
}

export function StagnationAlerts({ customers, maxItems = 5 }: StagnationAlertsProps) {
  const stagnantCustomers = useMemo(() => {
    return findStagnantCustomers(customers, 'warning').slice(0, maxItems)
  }, [customers, maxItems])

  const totalDanger = useMemo(() => {
    return findStagnantCustomers(customers, 'danger').length
  }, [customers])

  const totalWarning = useMemo(() => {
    return findStagnantCustomers(customers, 'warning').length - totalDanger
  }, [customers, totalDanger])

  if (stagnantCustomers.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-500" />
            停滞アラート
          </div>
          <div className="flex items-center gap-2">
            {totalDanger > 0 && (
              <Badge variant="destructive">{totalDanger}件要対応</Badge>
            )}
            {totalWarning > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {totalWarning}件注意
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stagnantCustomers.map((info) => (
          <StagnationAlertItem key={info.customerId} info={info} />
        ))}

        {(totalDanger + totalWarning) > maxItems && (
          <Link href="/customers" className="block">
            <Button variant="ghost" className="w-full text-sm">
              すべての停滞お客様を見る
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function StagnationAlertItem({ info }: { info: StagnationInfo }) {
  const config = levelConfig[info.level]
  const statusConfig = PIPELINE_CONFIG[info.currentStatus]

  return (
    <Link href={`/customers/${info.customerId}`}>
      <div className={`p-3 rounded-lg ${config.bgColor} hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={`mt-0.5 ${config.color}`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 truncate">
                  {info.teiName || info.customerName}
                </span>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-[10px]`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className={info.level === 'danger' ? 'text-red-600 font-medium' : ''}>
                  {info.daysInStatus}日経過
                </span>
                {info.recommendedActions.length > 0 && (
                  <>
                    <span>|</span>
                    <span className="text-gray-400">推奨: {info.recommendedActions[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0">
            <Phone className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </Link>
  )
}
