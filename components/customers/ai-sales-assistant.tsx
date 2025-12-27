'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { type Customer, type CustomerJourneyEvent } from '@/types/database'
import {
  predictContractProbability,
  suggestNextActions,
  getCoachingTips,
  type ContractPrediction,
  type ActionSuggestion,
  type CoachingTip,
  type PredictionFactor,
} from '@/lib/ai/sales-assistant'

interface AISalesAssistantProps {
  customer: Partial<Customer>
  journeyEvents?: CustomerJourneyEvent[]
}

// 確率に応じた色
function getProbabilityColor(probability: number): string {
  if (probability >= 70) return 'text-green-600'
  if (probability >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function _getProbabilityBgColor(probability: number): string {
  if (probability >= 70) return 'bg-green-500'
  if (probability >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

// 信頼度のラベル
const confidenceLabels = {
  high: { label: '高精度', color: 'bg-green-100 text-green-700' },
  medium: { label: '中精度', color: 'bg-amber-100 text-amber-700' },
  low: { label: '参考値', color: 'bg-gray-100 text-gray-600' },
}

// 優先度の色
const priorityColors = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-gray-200 bg-gray-50',
}

const priorityLabels = {
  high: { label: '重要', color: 'bg-red-100 text-red-700' },
  medium: { label: '推奨', color: 'bg-amber-100 text-amber-700' },
  low: { label: '任意', color: 'bg-gray-100 text-gray-600' },
}

// カテゴリアイコン
const categoryIcons = {
  approach: <MessageSquare className="w-4 h-4" />,
  objection: <AlertCircle className="w-4 h-4" />,
  closing: <CheckCircle2 className="w-4 h-4" />,
  relationship: <Target className="w-4 h-4" />,
}

export function AISalesAssistant({ customer, journeyEvents = [] }: AISalesAssistantProps) {
  const prediction = useMemo(
    () => predictContractProbability(customer, journeyEvents),
    [customer, journeyEvents]
  )

  const actions = useMemo(
    () => suggestNextActions(customer, journeyEvents),
    [customer, journeyEvents]
  )

  const tips = useMemo(
    () => getCoachingTips(customer, journeyEvents),
    [customer, journeyEvents]
  )

  return (
    <div className="space-y-4">
      {/* 成約予測カード */}
      <PredictionCard prediction={prediction} />

      {/* 次のアクション提案 */}
      <ActionsCard actions={actions} />

      {/* 営業コーチング */}
      <CoachingCard tips={tips} />
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: ContractPrediction }) {
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-blue-600" />
          成約予測
          <Badge className={confidenceLabels[prediction.confidence].color}>
            {confidenceLabels[prediction.confidence].label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* 確率表示 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-bold ${getProbabilityColor(prediction.probability)}`}>
                {prediction.probability}
              </span>
              <span className="text-xl text-gray-400 mb-1">%</span>
            </div>
            <Progress
              value={prediction.probability}
              className="h-2"
            />
          </div>
        </div>

        {/* 要因リスト */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-500 font-medium">予測要因</p>
          {prediction.factors.map((factor, index) => (
            <FactorItem key={index} factor={factor} />
          ))}
          {prediction.factors.length === 0 && (
            <p className="text-sm text-gray-400">データが少なく要因分析ができません</p>
          )}
        </div>

        {/* 推奨 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">{prediction.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FactorItem({ factor }: { factor: PredictionFactor }) {
  const Icon = factor.impact === 'positive' ? TrendingUp :
               factor.impact === 'negative' ? TrendingDown : Minus

  const colorClass = factor.impact === 'positive' ? 'text-green-600' :
                     factor.impact === 'negative' ? 'text-red-600' : 'text-gray-400'

  const bgClass = factor.impact === 'positive' ? 'bg-green-50' :
                  factor.impact === 'negative' ? 'bg-red-50' : 'bg-gray-50'

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${bgClass}`}>
      <Icon className={`w-4 h-4 ${colorClass}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{factor.name}</span>
        <span className="text-xs text-gray-500 ml-2">{factor.description}</span>
      </div>
      <span className={`text-sm font-bold ${colorClass}`}>
        {factor.score > 0 ? '+' : ''}{factor.score}
      </span>
    </div>
  )
}

function ActionsCard({ actions }: { actions: ActionSuggestion[] }) {
  if (actions.length === 0) return null

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-amber-600" />
          次のアクション
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </CardContent>
    </Card>
  )
}

function ActionItem({ action }: { action: ActionSuggestion }) {
  return (
    <div className={`p-3 rounded-lg border ${priorityColors[action.priority]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{action.action}</span>
            <Badge className={priorityLabels[action.priority].color}>
              {priorityLabels[action.priority].label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">{action.reason}</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{action.timing}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ChevronRight className="w-3 h-3" />
              <span>{action.expectedOutcome}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white rounded-lg transition-colors">
          <Phone className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}

function CoachingCard({ tips }: { tips: CoachingTip[] }) {
  if (tips.length === 0) return null

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          営業コーチング
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip) => (
          <CoachingItem key={tip.id} tip={tip} />
        ))}
      </CardContent>
    </Card>
  )
}

function CoachingItem({ tip }: { tip: CoachingTip }) {
  return (
    <div className="p-3 bg-purple-50 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-purple-600">
          {categoryIcons[tip.category]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-purple-900">{tip.title}</span>
            <span className="text-xs text-purple-500">({tip.applicableWhen})</span>
          </div>
          <p className="text-sm text-purple-800">{tip.content}</p>
        </div>
      </div>
    </div>
  )
}
