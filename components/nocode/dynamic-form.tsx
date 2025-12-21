'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FieldDefinition, FormDefinition, FieldType, Json } from '@/types/database'

interface DynamicFormProps {
  formDefinition: FormDefinition
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isLoading?: boolean
  readOnly?: boolean
}

// フィールドタイプに基づいてZodスキーマを生成
function createFieldSchema(field: FieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.field_type) {
    case 'text':
    case 'textarea':
      schema = z.string()
      if (field.validation) {
        const validation = field.validation as { minLength?: number; maxLength?: number; pattern?: string }
        if (validation.minLength) {
          schema = (schema as z.ZodString).min(validation.minLength)
        }
        if (validation.maxLength) {
          schema = (schema as z.ZodString).max(validation.maxLength)
        }
        if (validation.pattern) {
          schema = (schema as z.ZodString).regex(new RegExp(validation.pattern))
        }
      }
      break

    case 'number':
    case 'currency':
      schema = z.number()
      if (field.validation) {
        const validation = field.validation as { min?: number; max?: number }
        if (validation.min !== undefined) {
          schema = (schema as z.ZodNumber).min(validation.min)
        }
        if (validation.max !== undefined) {
          schema = (schema as z.ZodNumber).max(validation.max)
        }
      }
      break

    case 'date':
    case 'datetime':
      schema = z.string()
      break

    case 'checkbox':
      schema = z.boolean()
      break

    case 'select':
    case 'user':
    case 'reference':
      schema = z.string()
      break

    case 'multiselect':
      schema = z.array(z.string())
      break

    case 'file':
      schema = z.any() // ファイルは別途処理
      break

    case 'calculated':
      schema = z.any() // 計算フィールドは読み取り専用
      break

    default:
      schema = z.any()
  }

  // 必須でない場合はoptional
  if (!field.is_required) {
    schema = schema.optional().nullable()
  }

  return schema
}

// フォーム定義からZodスキーマを生成
function createFormSchema(fields: FieldDefinition[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach(field => {
    if (field.is_active && field.field_type !== 'section') {
      shape[field.code] = createFieldSchema(field)
    }
  })
  return z.object(shape)
}

// 個別フィールドのレンダリング
function DynamicField({
  field,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form,
  readOnly,
}: {
  field: FieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  readOnly?: boolean
}) {
  const options = (field.options as { value: string; label: string }[]) || []

  // セクションは特別な表示
  if (field.field_type === 'section') {
    return (
      <div className="col-span-full">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">
          {field.name}
        </h3>
      </div>
    )
  }

  // 幅の計算
  const widthClass = {
    full: 'col-span-full',
    half: 'col-span-1 md:col-span-1',
    third: 'col-span-1',
    quarter: 'col-span-1',
  }[field.layout?.width || 'full']

  return (
    <FormField
      control={form.control}
      name={field.code}
      render={({ field: formField }) => (
        <FormItem className={cn(widthClass)}>
          <FormLabel>
            {field.name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {renderFieldInput(field, formField, readOnly, options)}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// フィールドタイプに応じた入力コンポーネントのレンダリング
function renderFieldInput(
  field: FieldDefinition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formField: any,
  readOnly?: boolean,
  options: { value: string; label: string }[] = []
) {
  const commonProps = {
    ...formField,
    disabled: readOnly,
    placeholder: `${field.name}を入力`,
  }

  switch (field.field_type) {
    case 'text':
      return <Input {...commonProps} type="text" />

    case 'number':
      return (
        <Input
          {...commonProps}
          type="number"
          onChange={e => formField.onChange(e.target.value ? Number(e.target.value) : null)}
        />
      )

    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
          <Input
            {...commonProps}
            type="number"
            className="pl-7"
            onChange={e => formField.onChange(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      )

    case 'date':
      return <Input {...commonProps} type="date" />

    case 'datetime':
      return <Input {...commonProps} type="datetime-local" />

    case 'textarea':
      return <Textarea {...commonProps} rows={4} />

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.code}
            checked={formField.value}
            onCheckedChange={formField.onChange}
            disabled={readOnly}
          />
          <Label htmlFor={field.code} className="text-sm font-normal">
            {field.name}
          </Label>
        </div>
      )

    case 'select':
    case 'user':
    case 'reference':
      return (
        <Select
          onValueChange={formField.onChange}
          value={formField.value || ''}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder={`${field.name}を選択`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'multiselect':
      // TODO: マルチセレクトコンポーネントを実装
      return (
        <Select
          onValueChange={formField.onChange}
          value={formField.value?.[0] || ''}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder={`${field.name}を選択`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'calculated':
      return (
        <Input
          {...commonProps}
          type="text"
          disabled
          className="bg-gray-50"
        />
      )

    case 'file':
      return (
        <Input
          type="file"
          disabled={readOnly}
          onChange={e => formField.onChange(e.target.files)}
        />
      )

    default:
      return <Input {...commonProps} type="text" />
  }
}

export function DynamicForm({
  formDefinition,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  readOnly = false,
}: DynamicFormProps) {
  const fields = formDefinition.fields || []
  const sortedFields = [...fields].sort((a, b) => a.sort_order - b.sort_order)

  // スキーマを生成
  const schema = useMemo(() => createFormSchema(fields), [fields])

  // デフォルト値を生成
  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = {}
    fields.forEach(field => {
      if (field.field_type !== 'section') {
        values[field.code] = initialData[field.code] ?? field.default_value ?? null
      }
    })
    return values
  }, [fields, initialData])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const handleSubmit = form.handleSubmit(data => {
    onSubmit(data)
  })

  // セクションでグループ化
  const groupedFields = useMemo(() => {
    const groups: { section?: string; fields: FieldDefinition[] }[] = []
    let currentGroup: { section?: string; fields: FieldDefinition[] } = { fields: [] }

    sortedFields.forEach(field => {
      if (field.field_type === 'section') {
        if (currentGroup.fields.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = { section: field.name, fields: [] }
      } else {
        currentGroup.fields.push(field)
      }
    })

    if (currentGroup.fields.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }, [sortedFields])

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {groupedFields.map((group, groupIndex) => (
          <Card key={groupIndex}>
            {group.section && (
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{group.section}</CardTitle>
              </CardHeader>
            )}
            <CardContent className={cn(!group.section && 'pt-6')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map(field => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    form={form}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {!readOnly && (
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                キャンセル
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
