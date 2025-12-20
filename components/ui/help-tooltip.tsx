'use client'

import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: string
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function HelpTooltip({ content, className, side = 'top' }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full p-0.5',
              'text-gray-400 hover:text-orange-500 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
              className
            )}
            aria-label="ヘルプを表示"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-sm bg-gray-900 text-white p-3 rounded-lg shadow-lg"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ラベル付きヘルプ
interface LabelWithHelpProps {
  label: string
  helpText: string
  required?: boolean
  htmlFor?: string
  className?: string
}

export function LabelWithHelp({
  label,
  helpText,
  required,
  htmlFor,
  className,
}: LabelWithHelpProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-0.5">*</span>
            <span className="sr-only">（必須）</span>
          </>
        )}
      </label>
      <HelpTooltip content={helpText} />
    </div>
  )
}

// 用語説明カード
interface TermCardProps {
  term: string
  definition: string
  example?: string
}

export function TermCard({ term, definition, example }: TermCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <h4 className="font-semibold text-gray-900 mb-1">{term}</h4>
      <p className="text-sm text-gray-700">{definition}</p>
      {example && (
        <p className="text-sm text-gray-500 mt-2">
          例: {example}
        </p>
      )}
    </div>
  )
}

// ページヘルプパネル
interface PageHelpProps {
  title: string
  description: string
  tips?: string[]
}

export function PageHelp({ title, description, tips }: PageHelpProps) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-full p-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">{title}</h3>
          <p className="text-sm text-blue-800 mt-1">{description}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-3 space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-sm text-blue-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// パイプラインステータスの説明
export const PIPELINE_STATUS_HELP: Record<string, string> = {
  '反響': '問い合わせや資料請求があった段階',
  'イベント参加': '見学会やイベントに参加した段階',
  '限定会員': '会員登録して詳細情報を閲覧できる段階',
  '面談': '営業担当との面談を実施した段階',
  '建築申込': 'お客様が建築を正式に申し込んだ段階',
  '内定': '建築内容が確定し契約準備中の段階',
  '契約': '請負契約を締結した段階',
  '着工': '建築工事が開始した段階',
  '引渡': '建物の引き渡しが完了した段階',
  '引渡済': '引き渡し後のアフターフォロー段階',
  'ボツ': '検討中止となった案件',
  '他決': '他社で契約となった案件',
}

// プラン依頼ステータスの説明
export const PLAN_STATUS_HELP: Record<string, string> = {
  '新規依頼': '営業からプラン作成の依頼を受けた段階',
  '役調依頼中': '役所での法規制調査を依頼中',
  '役調完了': '法規制調査が完了した段階',
  'チェック待ち': '上長のチェックを待っている段階',
  '設計割り振り': '設計担当者を割り振っている段階',
  '設計中': 'プランを設計中',
  'プレゼン作成中': 'お客様向けプレゼン資料を作成中',
  '確認待ち': 'お客様の確認を待っている段階',
  '修正依頼': 'お客様から修正依頼があった段階',
  '完了': 'プラン作成が完了した段階',
}
