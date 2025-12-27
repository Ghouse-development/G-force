'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  FileText,
  FileEdit,
  FileSignature,
  ClipboardList,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'

interface WelcomeGuideProps {
  onComplete?: () => void
}

const ONBOARDING_KEY = 'gforce-onboarding-completed'

interface Step {
  title: string
  description: string
  icon: typeof LayoutDashboard
  color: string
  tips: string[]
}

const STEPS: Step[] = [
  {
    title: 'ようこそ Gハウス業務システムへ',
    description: '営業活動を効率化するためのシステムです。このガイドで基本的な使い方を説明します。',
    icon: Sparkles,
    color: 'text-orange-500',
    tips: [
      '全ての画面はカード形式で見やすく設計されています',
      '困ったときは各セクションの「?」アイコンをクリック',
      'ダッシュボードで今日のタスクを確認しましょう',
    ],
  },
  {
    title: 'ダッシュボード',
    description: '営業活動の全体像を一目で把握できます。目標達成率、本日の予定、注意が必要な顧客を確認しましょう。',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    tips: [
      '今期の契約目標と達成率を確認できます',
      '停滞している顧客にはアラートが表示されます',
      'クイックアクションで素早く作業を開始',
    ],
  },
  {
    title: '顧客管理',
    description: 'お客様の情報を一元管理します。パイプライン形式で進捗を追跡できます。',
    icon: Users,
    color: 'text-green-500',
    tips: [
      '顧客カードをクリックして詳細を確認',
      'ステータスで絞り込みができます',
      'チェックリストで次にやるべきことを確認',
    ],
  },
  {
    title: '書類作成の流れ',
    description: '契約までの書類は順番に作成します。資金計画書 → プラン依頼 → 契約 → 引継書の流れで進めましょう。',
    icon: FileText,
    color: 'text-purple-500',
    tips: [
      '① 資金計画書：お客様の予算を明確に',
      '② プラン依頼：設計部門にプランを依頼',
      '③ 契約：成約したら契約書を作成',
      '④ 引継書：工事部門への引き継ぎ',
    ],
  },
  {
    title: '準備完了！',
    description: 'これで基本的な使い方は以上です。実際に操作しながら覚えていきましょう！',
    icon: Target,
    color: 'text-orange-500',
    tips: [
      '分からないことがあればヘルプアイコン「?」を確認',
      'まずはダッシュボードを眺めてみましょう',
      '頑張って成約を目指しましょう！',
    ],
  },
]

export function WelcomeGuide({ onComplete }: WelcomeGuideProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // 初回表示判定
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOpen(false)
    onComplete?.()
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = STEPS[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <StepIcon className={`w-6 h-6 ${step.color}`} />
              {step.title}
            </DialogTitle>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {STEPS.length}
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600 mb-6">{step.description}</p>

          {/* ステップインジケーター */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-orange-500'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* ヒントカード */}
          <Card className="border-0 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-orange-700">ポイント</span>
              </div>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 書類フロー図（ステップ4の時のみ表示） */}
          {currentStep === 3 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <FileText className="w-4 h-4" />
                <span>資金計画</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg">
                <FileEdit className="w-4 h-4" />
                <span>プラン</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                <FileSignature className="w-4 h-4" />
                <span>契約</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <ClipboardList className="w-4 h-4" />
                <span>引継</span>
              </div>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500"
          >
            スキップ
          </Button>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                戻る
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {isLastStep ? (
                <>
                  始める
                  <Sparkles className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  次へ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 手動でガイドを再表示するためのユーティリティ
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY)
}
