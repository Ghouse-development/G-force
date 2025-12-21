'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldDefinition, FormDefinition, Json } from '@/types/database'

interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface DynamicTableProps {
  formDefinition?: FormDefinition
  columns?: Column[]
  data: Record<string, unknown>[]
  onRowClick?: (row: Record<string, unknown>) => void
  onView?: (row: Record<string, unknown>) => void
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (row: Record<string, unknown>) => void
  onCreate?: () => void
  searchable?: boolean
  searchFields?: string[]
  pageSize?: number
  emptyMessage?: string
  title?: string
  actions?: {
    label: string
    icon?: React.ReactNode
    onClick: (row: Record<string, unknown>) => void
  }[]
}

// フィールド定義からカラムを生成
function fieldsToColumns(fields: FieldDefinition[]): Column[] {
  return fields
    .filter(f => f.is_active && f.field_type !== 'section')
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 6) // 最大6列
    .map(field => ({
      key: field.code,
      label: field.name,
      sortable: ['text', 'number', 'currency', 'date', 'datetime'].includes(field.field_type),
      render: createFieldRenderer(field),
    }))
}

// フィールドタイプに応じたレンダラーを生成
function createFieldRenderer(field: FieldDefinition) {
  return (value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    switch (field.field_type) {
      case 'currency':
        return `¥${Number(value).toLocaleString()}`

      case 'date':
        return new Date(value as string).toLocaleDateString('ja-JP')

      case 'datetime':
        return new Date(value as string).toLocaleString('ja-JP')

      case 'checkbox':
        return value ? (
          <Badge variant="secondary">はい</Badge>
        ) : (
          <Badge variant="outline">いいえ</Badge>
        )

      case 'select':
        const options = (field.options as { value: string; label: string }[]) || []
        const option = options.find(o => o.value === value)
        return option?.label || String(value)

      case 'multiselect':
        const multiOptions = (field.options as { value: string; label: string }[]) || []
        const values = Array.isArray(value) ? value : []
        return (
          <div className="flex gap-1 flex-wrap">
            {values.map(v => {
              const opt = multiOptions.find(o => o.value === v)
              return (
                <Badge key={v} variant="secondary" className="text-xs">
                  {opt?.label || v}
                </Badge>
              )
            })}
          </div>
        )

      default:
        return String(value)
    }
  }
}

export function DynamicTable({
  formDefinition,
  columns: propColumns,
  data,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  onCreate,
  searchable = true,
  searchFields,
  pageSize = 10,
  emptyMessage = 'データがありません',
  title,
  actions = [],
}: DynamicTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // カラム定義
  const columns = useMemo(() => {
    if (propColumns) return propColumns
    if (formDefinition?.fields) return fieldsToColumns(formDefinition.fields)
    if (data.length > 0) {
      return Object.keys(data[0]).slice(0, 6).map(key => ({
        key,
        label: key,
        sortable: true,
        width: undefined,
        render: undefined,
      } as Column))
    }
    return []
  }, [propColumns, formDefinition, data])

  // 検索フィールド
  const effectiveSearchFields = searchFields || columns.map(c => c.key)

  // フィルタリング
  const filteredData = useMemo(() => {
    if (!search) return data
    const searchLower = search.toLowerCase()
    return data.filter(row =>
      effectiveSearchFields.some(field => {
        const value = row[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    )
  }, [data, search, effectiveSearchFields])

  // ソート
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortKey, sortDirection])

  // ページネーション
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const hasActions = onView || onEdit || onDelete || actions.length > 0

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="検索..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 w-64"
              />
            </div>
          )}
        </div>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        )}
      </div>

      {/* テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(column => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none hover:bg-muted',
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
              {hasActions && <TableHead className="w-[80px]">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id as string || index}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '-')}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(row)}>
                              <Eye className="h-4 w-4 mr-2" />
                              詳細
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <Edit className="h-4 w-4 mr-2" />
                              編集
                            </DropdownMenuItem>
                          )}
                          {actions.map((action, i) => (
                            <DropdownMenuItem key={i} onClick={() => action.onClick(row)}>
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(row)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sortedData.length}件中 {(currentPage - 1) * pageSize + 1}〜
            {Math.min(currentPage * pageSize, sortedData.length)}件を表示
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
