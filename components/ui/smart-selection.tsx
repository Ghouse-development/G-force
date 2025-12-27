'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, ArrowLeft } from 'lucide-react'

/**
 * SmartSelection - 「現在の選択」 vs 「それ以外」 のシンプルな2択UI
 *
 * 営業が考えなくて済む仕組み:
 * 1. 最初に「現在のまま」か「変更する」かを選ぶ
 * 2. 「変更する」を選んだ場合のみ、選択肢が表示される
 */

interface SmartSelectionOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface SmartSelectionProps {
  /** 現在の値（資金計画書から取得した値など） */
  currentValue: string
  /** 現在の値のラベル */
  currentLabel: string
  /** 現在の値の説明 */
  currentDescription?: string
  /** 「それ以外」を選んだ時の選択肢リスト */
  options: SmartSelectionOption[]
  /** 選択時のコールバック */
  onSelect: (value: string) => void
  /** 現在の値のアイコン */
  currentIcon?: React.ReactNode
  /** 「それ以外」のラベル */
  otherLabel?: string
}

export function SmartSelection({
  currentValue,
  currentLabel,
  currentDescription,
  options,
  onSelect,
  currentIcon,
  otherLabel = 'それ以外',
}: SmartSelectionProps) {
  const [showOptions, setShowOptions] = useState(false)

  // 「現在の値」を除外した選択肢
  const filteredOptions = options.filter(opt => opt.value !== currentValue)

  if (showOptions) {
    return (
      <div className="space-y-4">
        {/* 戻るボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Button>

        {/* 選択肢グリッド */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredOptions.map((option) => (
            <Card
              key={option.value}
              className="cursor-pointer border-2 border-transparent hover:border-orange-300 hover:shadow-md transition-all"
              onClick={() => {
                onSelect(option.value)
                setShowOptions(false)
              }}
            >
              <CardContent className="p-4 text-center">
                {option.icon && (
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                    {option.icon}
                  </div>
                )}
                <p className="font-medium text-gray-900">{option.label}</p>
                {option.description && (
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 現在の選択（推奨） */}
      <Card
        className="cursor-pointer border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all"
        onClick={() => onSelect(currentValue)}
      >
        <CardContent className="p-6 text-center">
          {currentIcon && (
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              {currentIcon}
            </div>
          )}
          <p className="font-bold text-lg text-green-800">{currentLabel}</p>
          {currentDescription && (
            <p className="text-sm text-green-600 mt-1">{currentDescription}</p>
          )}
          <div className="mt-3 flex items-center justify-center gap-1 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">推奨</span>
          </div>
        </CardContent>
      </Card>

      {/* それ以外 */}
      <Card
        className="cursor-pointer border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all"
        onClick={() => setShowOptions(true)}
      >
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <ChevronRight className="w-6 h-6" />
          </div>
          <p className="font-bold text-lg text-gray-700">{currentLabel}以外</p>
          <p className="text-sm text-gray-500 mt-1">{otherLabel}を選択</p>
          <div className="mt-3 flex items-center justify-center gap-1 text-gray-400">
            <span className="text-sm">他{filteredOptions.length}件</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * SmartConfirmation - 「はい/いいえ」のシンプルな確認UI
 */
interface SmartConfirmationProps {
  /** 質問文 */
  question: string
  /** はいのラベル */
  yesLabel?: string
  /** いいえのラベル */
  noLabel?: string
  /** はいのアイコン */
  yesIcon?: React.ReactNode
  /** いいえのアイコン */
  noIcon?: React.ReactNode
  /** はい選択時 */
  onYes: () => void
  /** いいえ選択時 */
  onNo: () => void
  /** はいを推奨する場合 */
  recommendYes?: boolean
}

export function SmartConfirmation({
  question,
  yesLabel = 'はい',
  noLabel = 'いいえ',
  yesIcon,
  noIcon,
  onYes,
  onNo,
  recommendYes = true,
}: SmartConfirmationProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-medium text-gray-700">{question}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* はい */}
        <Card
          className={cn(
            'cursor-pointer border-2 transition-all hover:shadow-lg',
            recommendYes
              ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
              : 'border-gray-200 hover:border-orange-300'
          )}
          onClick={onYes}
        >
          <CardContent className="p-6 text-center">
            {yesIcon && (
              <div className={cn(
                'w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center',
                recommendYes ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              )}>
                {yesIcon}
              </div>
            )}
            <p className={cn(
              'font-bold text-lg',
              recommendYes ? 'text-green-800' : 'text-gray-700'
            )}>
              {yesLabel}
            </p>
            {recommendYes && (
              <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">推奨</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* いいえ */}
        <Card
          className={cn(
            'cursor-pointer border-2 transition-all hover:shadow-lg',
            !recommendYes
              ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
              : 'border-gray-200 hover:border-orange-300'
          )}
          onClick={onNo}
        >
          <CardContent className="p-6 text-center">
            {noIcon && (
              <div className={cn(
                'w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center',
                !recommendYes ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              )}>
                {noIcon}
              </div>
            )}
            <p className={cn(
              'font-bold text-lg',
              !recommendYes ? 'text-green-800' : 'text-gray-700'
            )}>
              {noLabel}
            </p>
            {!recommendYes && (
              <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">推奨</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
