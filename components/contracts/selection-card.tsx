'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface SelectionCardProps {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  selected: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function SelectionCard({
  value: _value,
  label,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
  className,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200',
        'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        selected
          ? 'border-orange-500 bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-orange-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* チェックマーク */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* アイコン */}
      {icon && (
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mb-3',
          selected ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
        )}>
          {icon}
        </div>
      )}

      {/* ラベル */}
      <h3 className={cn(
        'text-lg font-bold mb-1',
        selected ? 'text-orange-700' : 'text-gray-900'
      )}>
        {label}
      </h3>

      {/* 説明 */}
      {description && (
        <p className="text-sm text-gray-500 text-center">
          {description}
        </p>
      )}
    </button>
  )
}

interface MultiSelectCardProps {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  selected: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function MultiSelectCard({
  value: _value,
  label,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
  className,
}: MultiSelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-orange-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* チェックボックス */}
      <div className={cn(
        'w-6 h-6 rounded-md border-2 flex items-center justify-center mr-4 shrink-0',
        selected
          ? 'border-orange-500 bg-orange-500'
          : 'border-gray-300 bg-white'
      )}>
        {selected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* アイコン */}
      {icon && (
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0',
          selected ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
        )}>
          {icon}
        </div>
      )}

      {/* テキスト */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-semibold',
          selected ? 'text-orange-700' : 'text-gray-900'
        )}>
          {label}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 truncate">
            {description}
          </p>
        )}
      </div>
    </button>
  )
}

interface ConfirmationCardProps {
  question: string
  currentValue: string
  onConfirm: () => void
  onChange: () => void
  icon?: React.ReactNode
  className?: string
}

export function ConfirmationCard({
  question,
  currentValue,
  onConfirm,
  onChange,
  icon,
  className,
}: ConfirmationCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-6 shadow-sm',
      className
    )}>
      <div className="flex items-start gap-4 mb-4">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{question}</h3>
          <p className="text-2xl font-bold text-orange-600 mt-1">{currentValue}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all"
        >
          このままでOK
        </button>
        <button
          type="button"
          onClick={onChange}
          className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-400 hover:text-orange-600 transition-all"
        >
          変更する
        </button>
      </div>
    </div>
  )
}
