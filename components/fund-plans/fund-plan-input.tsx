'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  note?: string
  provisional?: boolean
  disabled?: boolean
  className?: string
}

export function CurrencyInput({
  label,
  value,
  onChange,
  note,
  provisional,
  disabled,
  className,
}: CurrencyInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600 flex items-center gap-1">
        {label}
        {provisional && <span className="text-orange-500 text-[10px]">(仮)</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="pr-8 text-right h-8 text-sm"
          disabled={disabled}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">円</span>
      </div>
      {note && <p className="text-[10px] text-gray-500">{note}</p>}
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min,
  max,
  disabled,
  className,
}: NumberInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          step={step}
          min={min}
          max={max}
          className={cn('text-right h-8 text-sm', unit && 'pr-10')}
          disabled={disabled}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

interface PercentInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function PercentInput({
  label,
  value,
  onChange,
  disabled,
  className,
}: PercentInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={(value * 100).toFixed(2) || ''}
          onChange={(e) => onChange(Number(e.target.value) / 100 || 0)}
          step={0.01}
          min={0}
          max={100}
          className="pr-8 text-right h-8 text-sm"
          disabled={disabled}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
      </div>
    </div>
  )
}

interface DateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function DateInput({
  label,
  value,
  onChange,
  disabled,
  className,
}: DateInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600">{label}</Label>
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        disabled={disabled}
      />
    </div>
  )
}

interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: TextInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600">{label}</Label>
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
        disabled={disabled}
      />
    </div>
  )
}

interface DisplayValueProps {
  label: string
  value: string | number
  unit?: string
  className?: string
  highlight?: boolean
}

export function DisplayValue({
  label,
  value,
  unit,
  className,
  highlight,
}: DisplayValueProps) {
  const formattedValue = typeof value === 'number'
    ? new Intl.NumberFormat('ja-JP').format(value)
    : value

  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-600">{label}</Label>
      <div
        className={cn(
          'h-8 px-3 rounded border flex items-center justify-end text-sm font-medium',
          highlight
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        )}
      >
        {formattedValue}
        {unit && <span className="ml-1 text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

interface SectionTitleProps {
  children: React.ReactNode
  number?: string
  className?: string
}

export function SectionTitle({ children, number, className }: SectionTitleProps) {
  return (
    <h3 className={cn('text-sm font-bold text-gray-900 flex items-center gap-2', className)}>
      {number && (
        <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
          {number}
        </span>
      )}
      {children}
    </h3>
  )
}

interface SubSectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SubSectionTitle({ children, className }: SubSectionTitleProps) {
  return (
    <h4 className={cn('text-xs font-semibold text-gray-700 border-b pb-1', className)}>
      {children}
    </h4>
  )
}
