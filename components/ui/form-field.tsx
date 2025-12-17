'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FormFieldProps {
  label: string
  name: string
  required?: boolean
  error?: string
  helpText?: string
  children?: React.ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  required = false,
  error,
  helpText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  required?: boolean
  error?: string
  helpText?: string
}

export function FormInput({
  label,
  name,
  required = false,
  error,
  helpText,
  className,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Input
        id={name}
        name={name}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    </FormField>
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  required?: boolean
  error?: string
  helpText?: string
}

export function FormTextarea({
  label,
  name,
  required = false,
  error,
  helpText,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Textarea
        id={name}
        name={name}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    </FormField>
  )
}

// 金額入力用コンポーネント
interface FormCurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  name: string
  required?: boolean
  error?: string
  helpText?: string
  value: number | null | undefined
  onChange: (value: number | null) => void
}

export function FormCurrencyInput({
  label,
  name,
  required = false,
  error,
  helpText,
  value,
  onChange,
  className,
  ...props
}: FormCurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState('')

  React.useEffect(() => {
    if (value !== null && value !== undefined) {
      setDisplayValue(value.toLocaleString())
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setDisplayValue('')
      onChange(null)
    } else {
      const num = parseInt(raw, 10)
      setDisplayValue(num.toLocaleString())
      onChange(num)
    }
  }

  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      helpText={helpText}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
        <Input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            'pl-8',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
    </FormField>
  )
}
