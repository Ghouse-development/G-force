'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  User,
  FileText,
  FileSignature,
  FileEdit,
  Home,
  ChevronRight,
  Command,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'customer' | 'plan_request' | 'contract' | 'handover' | 'fund_plan'
  title: string
  subtitle?: string
  status?: string
  href: string
}

const typeConfig = {
  customer: { icon: User, label: '顧客', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  plan_request: { icon: FileEdit, label: 'プラン依頼', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  contract: { icon: FileSignature, label: '契約書', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  handover: { icon: Home, label: '引継書', color: 'text-green-600', bgColor: 'bg-green-100' },
  fund_plan: { icon: FileText, label: '資金計画書', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
}

// モック検索結果（実際はAPIから取得）
const mockSearchResults: SearchResult[] = [
  { id: '1', type: 'customer', title: '山田様邸', subtitle: '山田 太郎', status: '面談', href: '/customers/1' },
  { id: '2', type: 'customer', title: '佐藤様邸', subtitle: '佐藤 花子', status: '建築申込', href: '/customers/2' },
  { id: '3', type: 'customer', title: '鈴木様邸', subtitle: '鈴木 一郎', status: '契約', href: '/customers/3' },
  { id: '1', type: 'plan_request', title: '山田様邸プラン', subtitle: '山田 太郎', status: '依頼中', href: '/plan-requests/1' },
  { id: '2', type: 'plan_request', title: '佐藤様邸プラン', subtitle: '佐藤 花子', status: '作成中', href: '/plan-requests/2' },
  { id: '1', type: 'contract', title: '鈴木様邸契約書', subtitle: '鈴木 一郎', status: '締結済', href: '/contracts/1' },
  { id: '1', type: 'fund_plan', title: '山田様邸資金計画', subtitle: '山田 太郎', status: '下書き', href: '/fund-plans/fp-1' },
]

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])

  // 検索処理
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const filtered = mockSearchResults.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
    setSelectedIndex(0)
  }, [query])

  // キーボードナビゲーション
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href)
            onOpenChange(false)
            setQuery('')
          }
          break
        case 'Escape':
          onOpenChange(false)
          break
      }
    },
    [results, selectedIndex, router, onOpenChange]
  )

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    onOpenChange(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0">
        {/* 検索入力 */}
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <Input
            placeholder="お客様名、邸名、書類を検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs text-gray-500">
            ESC
          </kbd>
        </div>

        {/* 検索結果 */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>検索キーワードを入力してください</p>
              <p className="text-sm mt-1">お客様名、邸名、書類名で検索できます</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>「{query}」に一致する結果がありません</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => {
                const config = typeConfig[result.type]
                const Icon = config.icon
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{result.subtitle}</span>
                        {result.status && (
                          <>
                            <span>•</span>
                            <span>{result.status}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-gray-500 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-white">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded border bg-white">↓</kbd>
              <span>で移動</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-white">Enter</kbd>
              <span>で開く</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>+ K で検索</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// キーボードショートカットフック
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isOpen, setIsOpen }
}
