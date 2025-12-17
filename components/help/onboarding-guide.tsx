'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface GuideStep {
  title: string
  description: string
  icon: string
  tips?: string[]
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: '顧客登録',
    description: '新規顧客を登録します。反響があったらすぐに登録しましょう。',
    icon: '👤',
    tips: [
      '邸名は「〇〇様邸」の形式で自動生成されます',
      '反響経路を正確に記録することで分析に役立ちます',
    ],
  },
  {
    title: 'パイプライン管理',
    description: '顧客のステータスを管理します。反響→面談→契約の流れを追跡できます。',
    icon: '📊',
    tips: [
      'ステータス変更は顧客詳細画面から行えます',
      'ボツ・他決の場合は理由を記録しましょう',
    ],
  },
  {
    title: 'プラン依頼',
    description: '設計部にプランの作成を依頼します。',
    icon: '📋',
    tips: [
      '土地情報と予算は必ず入力してください',
      '期限を設定すると設計部に通知されます',
    ],
  },
  {
    title: '契約書作成',
    description: '請負契約書を作成します。承認フローで品質を担保します。',
    icon: '📄',
    tips: [
      '契約金額は資金計画書と連動します',
      '印刷前に必ず上長の承認を得てください',
    ],
  },
  {
    title: '引継書',
    description: '工事部への引継ぎ情報を記録します。',
    icon: '📝',
    tips: [
      'チェックリストを活用して漏れを防ぎましょう',
      '特記事項は詳しく記載してください',
    ],
  },
]

const STORAGE_KEY = 'g-force-onboarding-completed'

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    // 初回訪問時に自動表示
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setIsOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    if (currentStep < GUIDE_STEPS.length - 1) {
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

  if (!isOpen) return null

  const step = GUIDE_STEPS[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{step.icon}</span>
                <div>
                  <p className="text-white/80 text-sm">
                    ステップ {currentStep + 1} / {GUIDE_STEPS.length}
                  </p>
                  <h2 className="text-xl font-bold text-white">{step.title}</h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleComplete}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-1 px-6 py-3 bg-gray-50">
            {GUIDE_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-orange-500'
                    : completedSteps.includes(index)
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-600">{step.description}</p>

            {step.tips && step.tips.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                  <Lightbulb className="w-4 h-4" />
                  ポイント
                </div>
                <ul className="space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              戻る
            </Button>
            <Button
              variant="ghost"
              onClick={handleComplete}
              className="text-gray-500"
            >
              スキップ
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {currentStep === GUIDE_STEPS.length - 1 ? '完了' : '次へ'}
              {currentStep < GUIDE_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ヘルプボタンコンポーネント
export function HelpButton() {
  const handleResetGuide = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleResetGuide}
      className="text-gray-500 hover:text-orange-500"
    >
      <Lightbulb className="w-4 h-4 mr-1" />
      ガイドを見る
    </Button>
  )
}
