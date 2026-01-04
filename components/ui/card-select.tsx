'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, Search, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * CardSelect - カード型選択コンポーネント
 *
 * UI/UX優先順位: カード選択 > プルダウン > 入力
 * タップで完結する操作を目指す
 */

export interface CardSelectOption<T = string> {
  value: T
  label: string
  description?: string
  icon?: React.ReactNode
  recommended?: boolean
  disabled?: boolean
}

interface CardSelectProps<T = string> {
  /** 選択肢 */
  options: CardSelectOption<T>[]
  /** 現在の値 */
  value: T | null
  /** 選択時コールバック */
  onChange: (value: T) => void
  /** 検索可能にするか */
  searchable?: boolean
  /** 検索プレースホルダー */
  searchPlaceholder?: string
  /** 初期表示数（折りたたみ時） */
  initialDisplayCount?: number
  /** グリッド列数 */
  columns?: 2 | 3 | 4
  /** ラベル */
  label?: string
  /** 説明 */
  description?: string
  /** コンパクトモード */
  compact?: boolean
}

export function CardSelect<T = string>({
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder = '検索...',
  initialDisplayCount,
  columns = 3,
  label,
  description,
  compact = false,
}: CardSelectProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(!initialDisplayCount)

  // 検索フィルタ
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // 表示数制限
  const displayedOptions = initialDisplayCount && !isExpanded
    ? filteredOptions.slice(0, initialDisplayCount)
    : filteredOptions

  const hasMore = initialDisplayCount && filteredOptions.length > initialDisplayCount

  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns]

  return (
    <div className="space-y-3">
      {/* ラベル */}
      {label && (
        <div>
          <h3 className="font-medium text-gray-900">{label}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}

      {/* 検索バー */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* カードグリッド */}
      <div className={cn('grid gap-3', gridClass)}>
        {displayedOptions.map((option) => {
          const isSelected = value === option.value
          return (
            <Card
              key={String(option.value)}
              className={cn(
                'cursor-pointer border-2 transition-all',
                isSelected
                  ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300 hover:shadow-md',
                option.disabled && 'opacity-50 cursor-not-allowed',
                option.recommended && !isSelected && 'ring-2 ring-green-200'
              )}
              onClick={() => !option.disabled && onChange(option.value)}
            >
              <CardContent className={cn('text-center', compact ? 'p-3' : 'p-4')}>
                {option.icon && (
                  <div className={cn(
                    'mx-auto rounded-full flex items-center justify-center',
                    compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-3',
                    isSelected
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {option.icon}
                  </div>
                )}
                <p className={cn(
                  'font-medium',
                  compact ? 'text-sm' : 'text-base',
                  isSelected ? 'text-orange-800' : 'text-gray-900'
                )}>
                  {option.label}
                </p>
                {option.description && !compact && (
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                )}
                {isSelected && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-orange-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">選択中</span>
                  </div>
                )}
                {option.recommended && !isSelected && (
                  <div className="mt-2 text-xs text-green-600 font-medium">推奨</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* もっと見る */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              折りたたむ
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              他{filteredOptions.length - initialDisplayCount}件を表示
            </>
          )}
        </button>
      )}
    </div>
  )
}

/**
 * QuickSelect - インライン選択コンポーネント（省スペース版）
 */
interface QuickSelectProps<T = string> {
  options: CardSelectOption<T>[]
  value: T | null
  onChange: (value: T) => void
  label?: string
}

export function QuickSelect<T = string>({
  options,
  value,
  onChange,
  label,
}: QuickSelectProps<T>) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                isSelected
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
              {option.recommended && !isSelected && (
                <span className="ml-1 text-xs text-green-600">★</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * YesNoSelect - はい/いいえ選択
 */
interface YesNoSelectProps {
  value: boolean | null
  onChange: (value: boolean) => void
  yesLabel?: string
  noLabel?: string
  recommendYes?: boolean
  label?: string
}

export function YesNoSelect({
  value,
  onChange,
  yesLabel = 'はい',
  noLabel = 'いいえ',
  recommendYes = true,
  label,
}: YesNoSelectProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'flex-1 py-3 rounded-lg border-2 font-medium transition-all',
            value === true
              ? 'border-orange-400 bg-orange-50 text-orange-700'
              : 'border-gray-200 text-gray-700 hover:border-orange-300'
          )}
        >
          {yesLabel}
          {recommendYes && value !== true && (
            <span className="ml-1 text-xs text-green-600">推奨</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex-1 py-3 rounded-lg border-2 font-medium transition-all',
            value === false
              ? 'border-orange-400 bg-orange-50 text-orange-700'
              : 'border-gray-200 text-gray-700 hover:border-orange-300'
          )}
        >
          {noLabel}
          {!recommendYes && value !== false && (
            <span className="ml-1 text-xs text-green-600">推奨</span>
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * NumberSelect - 数値選択（階数など）
 */
interface NumberSelectProps {
  options: number[]
  value: number | null
  onChange: (value: number) => void
  label?: string
  suffix?: string
}

export function NumberSelect({
  options,
  value,
  onChange,
  label,
  suffix = '',
}: NumberSelectProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex gap-2">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              'w-14 h-14 rounded-lg border-2 font-bold text-lg transition-all',
              value === num
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-700 hover:border-orange-300'
            )}
          >
            {num}{suffix}
          </button>
        ))}
      </div>
    </div>
  )
}
