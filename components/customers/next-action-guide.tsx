'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Phone,
  Calendar,
  FileText,
  FileEdit,
  FileSignature,
  Users,
  MapPin,
  CheckCircle2,
  Sparkles,
  Home,
  ClipboardCheck,
} from 'lucide-react'
import type { PipelineStatus, CustomerLandStatus } from '@/types/database'

interface NextActionGuideProps {
  customerId: string
  pipelineStatus: PipelineStatus
  landStatus?: CustomerLandStatus
  hasFundPlan?: boolean
  hasPlanRequest?: boolean
  hasContract?: boolean
  lastContactDate?: string
}

// ステータスごとの次のアクション定義
const NEXT_ACTIONS: Record<string, {
  title: string
  description: string
  icon: React.ReactNode
  actions: Array<{
    label: string
    href: string
    variant?: 'default' | 'outline'
    icon: React.ReactNode
  }>
  tips?: string[]
}> = {
  '資料請求': {
    title: 'イベントへご案内しましょう',
    description: 'まずはモデルハウス見学会や完成見学会への参加をおすすめしてください',
    icon: <Calendar className="w-6 h-6 text-blue-500" />,
    actions: [
      { label: '電話する', href: 'tel:', variant: 'default', icon: <Phone className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      '資料請求から3日以内の連絡が効果的',
      '直近のイベント日程を確認しておく',
    ],
  },
  'イベント予約': {
    title: 'イベント前の確認連絡を',
    description: '予約日の前日に確認の電話をしましょう',
    icon: <Phone className="w-6 h-6 text-purple-500" />,
    actions: [
      { label: '電話する', href: 'tel:', variant: 'default', icon: <Phone className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      '当日の流れを簡単に説明',
      '駐車場の案内を忘れずに',
    ],
  },
  'イベント参加': {
    title: '面談の日程を決めましょう',
    description: 'イベント参加後1週間以内に面談を設定するのが理想です',
    icon: <Users className="w-6 h-6 text-orange-500" />,
    actions: [
      { label: '電話で日程調整', href: 'tel:', variant: 'default', icon: <Phone className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      'イベント時に興味を示した点を確認',
      '土日の面談枠を優先的に提案',
    ],
  },
  '限定会員': {
    title: '面談を実施しましょう',
    description: 'お客様のご要望をしっかりヒアリングし、土地・建物のイメージを共有します',
    icon: <Users className="w-6 h-6 text-indigo-500" />,
    actions: [
      { label: '面談日程を調整', href: 'tel:', variant: 'default', icon: <Calendar className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      'ヒアリングシートを事前に準備',
      '資金計画の概算を用意しておく',
    ],
  },
  '面談': {
    title: '資金計画書を作成しましょう',
    description: '面談内容をもとに、具体的な資金計画をご提案します',
    icon: <FileText className="w-6 h-6 text-cyan-500" />,
    actions: [
      { label: '資金計画書を作成', href: '/fund-plans/new?customer_id={id}', variant: 'default', icon: <FileText className="w-4 h-4" /> },
      { label: '土地情報を探す', href: '/property-alerts', variant: 'outline', icon: <MapPin className="w-4 h-4" /> },
    ],
    tips: [
      '土地探し中なら物件情報も準備',
      '複数パターンの資金計画を用意すると効果的',
    ],
  },
  '建築申込': {
    title: 'プラン依頼を出しましょう',
    description: '設計チームにプラン作成を依頼します',
    icon: <FileEdit className="w-6 h-6 text-teal-500" />,
    actions: [
      { label: 'プラン依頼を作成', href: '/plan-requests/new?customer_id={id}', variant: 'default', icon: <FileEdit className="w-4 h-4" /> },
      { label: '資金計画書を確認', href: '/fund-plans?customer_id={id}', variant: 'outline', icon: <FileText className="w-4 h-4" /> },
    ],
    tips: [
      'お客様の要望を明確に伝える',
      '土地の調査状況を確認',
    ],
  },
  'プラン提出': {
    title: 'プランをお客様にご提案',
    description: '設計チームから上がってきたプランをお客様にご説明します',
    icon: <Home className="w-6 h-6 text-sky-500" />,
    actions: [
      { label: 'プラン打合せを設定', href: 'tel:', variant: 'default', icon: <Calendar className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      'プランの特徴・工夫点を整理しておく',
      '変更要望は設計チームに速やかに共有',
    ],
  },
  '内定': {
    title: '契約書を作成しましょう',
    description: '契約に向けて必要書類を準備します',
    icon: <FileSignature className="w-6 h-6 text-emerald-500" />,
    actions: [
      { label: '契約書を作成', href: '/contract-requests/new?customer_id={id}', variant: 'default', icon: <FileSignature className="w-4 h-4" /> },
      { label: '書類を確認', href: '/customers/{id}#documents', variant: 'outline', icon: <FileText className="w-4 h-4" /> },
    ],
    tips: [
      '本人確認書類の準備を依頼',
      'ローン本審査の進捗を確認',
    ],
  },
  '変更契約前': {
    title: '変更契約の準備をしましょう',
    description: '詳細仕様の確定と変更契約の締結を進めます',
    icon: <FileSignature className="w-6 h-6 text-orange-500" />,
    actions: [
      { label: 'IC打合せを設定', href: 'tel:', variant: 'default', icon: <Calendar className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      'IC担当と連携してスケジュール調整',
      '追加費用の説明を丁寧に',
    ],
  },
  '変更契約後': {
    title: '着工に向けて準備完了',
    description: '工事部門と連携し、着工・上棟・引渡しを進めます',
    icon: <CheckCircle2 className="w-6 h-6 text-amber-500" />,
    actions: [
      { label: '引継書を確認', href: '/handovers', variant: 'default', icon: <FileText className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      '地鎮祭・上棟式の日程を確認',
      '現場見学のご案内',
    ],
  },
  'オーナー': {
    title: 'アフターフォロー',
    description: '定期点検と紹介のお願いをしましょう',
    icon: <Sparkles className="w-6 h-6 text-green-500" />,
    actions: [
      { label: '点検を確認', href: '/owners', variant: 'default', icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: '活動を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      '6ヶ月点検・1年点検を忘れずに',
      '満足度が高ければ紹介をお願い',
    ],
  },
  'ボツ・他決': {
    title: '記録を残しましょう',
    description: 'ボツ・他決の理由を記録して次に活かします',
    icon: <FileText className="w-6 h-6 text-gray-500" />,
    actions: [
      { label: '理由を記録', href: '/customers/{id}#journey', variant: 'outline', icon: <ClipboardCheck className="w-4 h-4" /> },
    ],
    tips: [
      '他決の場合は競合情報を記録',
      'ボツの理由を明確に',
    ],
  },
}

export function NextActionGuide({
  customerId,
  pipelineStatus,
  landStatus,
  hasFundPlan,
  hasPlanRequest,
  hasContract,
  lastContactDate,
}: NextActionGuideProps) {
  const actionConfig = useMemo(() => {
    const config = NEXT_ACTIONS[pipelineStatus]
    if (!config) return null
    return config
  }, [pipelineStatus])

  // 最終連絡からの経過日数
  const daysSinceContact = useMemo(() => {
    if (!lastContactDate) return null
    const last = new Date(lastContactDate)
    const now = new Date()
    const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [lastContactDate])

  if (!actionConfig) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 via-white to-yellow-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
            {actionConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-orange-100 text-orange-700 border-0">
                次のアクション
              </Badge>
              {daysSinceContact !== null && daysSinceContact > 7 && (
                <Badge variant="destructive" className="text-xs">
                  {daysSinceContact}日間連絡なし
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {actionConfig.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {actionConfig.description}
            </p>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-2 mb-4">
              {actionConfig.actions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href.replace('{id}', customerId)}
                >
                  <Button
                    variant={action.variant || 'default'}
                    className={action.variant === 'default' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600' : ''}
                  >
                    {action.icon}
                    <span className="ml-1.5">{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              ))}
            </div>

            {/* Tips */}
            {actionConfig.tips && actionConfig.tips.length > 0 && (
              <div className="bg-white/70 rounded-lg p-3 border border-orange-100">
                <p className="text-xs font-medium text-orange-700 mb-1.5">💡 ポイント</p>
                <ul className="space-y-1">
                  {actionConfig.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-orange-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
