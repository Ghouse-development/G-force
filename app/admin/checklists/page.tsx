'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Settings,
  Loader2,
  Save,
} from 'lucide-react'

interface ChecklistTemplate {
  id: string
  pipeline_status: string
  item_order: number
  title: string
  description: string | null
  is_required: boolean
  is_active: boolean
}

const PIPELINE_STAGES = [
  '反響',
  'イベント参加',
  '限定会員',
  '面談',
  '建築申込',
  '契約',
  '着工',
  '引渡',
]

const STAGE_COLORS: Record<string, string> = {
  '反響': 'bg-blue-100 text-blue-800 border-blue-300',
  'イベント参加': 'bg-purple-100 text-purple-800 border-purple-300',
  '限定会員': 'bg-pink-100 text-pink-800 border-pink-300',
  '面談': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '建築申込': 'bg-orange-100 text-orange-800 border-orange-300',
  '契約': 'bg-green-100 text-green-800 border-green-300',
  '着工': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  '引渡': 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

export default function ChecklistsAdminPage() {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    Object.fromEntries(PIPELINE_STAGES.map((s) => [s, true]))
  )
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<{
    stage: string
    title: string
    description: string
    is_required: boolean
  } | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/checklist-templates')
      const data = await res.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const groupedTemplates = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = templates
      .filter((t) => t.pipeline_status === stage)
      .sort((a, b) => a.item_order - b.item_order)
    return acc
  }, {} as Record<string, ChecklistTemplate[]>)

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }))
  }

  const handleAddItem = async () => {
    if (!newItem || !newItem.title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/checklist-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_status: newItem.stage,
          title: newItem.title,
          description: newItem.description || null,
          is_required: newItem.is_required,
        }),
      })

      if (!res.ok) throw new Error('Failed to create template')

      toast.success('チェック項目を追加しました')
      setNewItem(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('チェック項目の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async (template: ChecklistTemplate) => {
    setSaving(true)
    try {
      const res = await fetch('/api/checklist-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          title: template.title,
          description: template.description,
          is_required: template.is_required,
        }),
      })

      if (!res.ok) throw new Error('Failed to update template')

      toast.success('チェック項目を更新しました')
      setEditingItem(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('チェック項目の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('このチェック項目を削除しますか？')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/checklist-templates?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete template')

      toast.success('チェック項目を削除しました')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('チェック項目の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">管理者権限が必要です</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
              パイプラインチェックリスト設定
            </h1>
            <p className="text-gray-500 mt-1">
              各ステージで営業がやるべきことを設定します
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-800">
              ここで設定したチェックリストは、顧客詳細ページに表示されます。
              営業スタッフはチェックリストを順番にこなすことで、確実に契約へ導くことができます。
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {PIPELINE_STAGES.map((stage) => (
              <Card key={stage} className="border-0 shadow-lg overflow-hidden">
                <CardHeader
                  className={`cursor-pointer ${STAGE_COLORS[stage]} border-l-4`}
                  onClick={() => toggleStage(stage)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      {expandedStages[stage] ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      {stage}
                      <span className="text-sm font-normal opacity-75">
                        ({groupedTemplates[stage]?.length || 0}項目)
                      </span>
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setNewItem({
                          stage,
                          title: '',
                          description: '',
                          is_required: false,
                        })
                        setExpandedStages((prev) => ({ ...prev, [stage]: true }))
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      追加
                    </Button>
                  </div>
                </CardHeader>

                {expandedStages[stage] && (
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {groupedTemplates[stage]?.map((template, index) => (
                        <div
                          key={template.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
                        >
                          <div className="flex items-center gap-2 text-gray-400 mt-1">
                            <GripVertical className="w-4 h-4" />
                            <span className="text-sm font-medium w-6">
                              {index + 1}.
                            </span>
                          </div>

                          {editingItem === template.id ? (
                            <div className="flex-1 space-y-3">
                              <Input
                                value={template.title}
                                onChange={(e) =>
                                  setTemplates((prev) =>
                                    prev.map((t) =>
                                      t.id === template.id
                                        ? { ...t, title: e.target.value }
                                        : t
                                    )
                                  )
                                }
                                placeholder="チェック項目のタイトル"
                              />
                              <Textarea
                                value={template.description || ''}
                                onChange={(e) =>
                                  setTemplates((prev) =>
                                    prev.map((t) =>
                                      t.id === template.id
                                        ? { ...t, description: e.target.value }
                                        : t
                                    )
                                  )
                                }
                                placeholder="説明（任意）"
                                rows={2}
                              />
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={template.is_required}
                                    onCheckedChange={(checked) =>
                                      setTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id
                                            ? { ...t, is_required: !!checked }
                                            : t
                                        )
                                      )
                                    }
                                  />
                                  必須項目
                                </label>
                                <div className="flex gap-2 ml-auto">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(null)
                                      fetchTemplates()
                                    }}
                                  >
                                    キャンセル
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateItem(template)}
                                    disabled={saving}
                                  >
                                    {saving ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4 mr-1" />
                                    )}
                                    保存
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {template.title}
                                  </span>
                                  {template.is_required && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                      必須
                                    </span>
                                  )}
                                </div>
                                {template.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(template.id)}
                                >
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteItem(template.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* New Item Form */}
                      {newItem?.stage === stage && (
                        <div className="p-4 bg-emerald-50 rounded-lg border-2 border-dashed border-emerald-300">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">
                                タイトル
                              </Label>
                              <Input
                                value={newItem.title}
                                onChange={(e) =>
                                  setNewItem({ ...newItem, title: e.target.value })
                                }
                                placeholder="例: 初回電話連絡"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                説明（任意）
                              </Label>
                              <Textarea
                                value={newItem.description}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="例: 反響から24時間以内に電話"
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={newItem.is_required}
                                  onCheckedChange={(checked) =>
                                    setNewItem({
                                      ...newItem,
                                      is_required: !!checked,
                                    })
                                  }
                                />
                                必須項目
                              </label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setNewItem(null)}
                                >
                                  キャンセル
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleAddItem}
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Plus className="w-4 h-4 mr-1" />
                                  )}
                                  追加
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {groupedTemplates[stage]?.length === 0 &&
                        newItem?.stage !== stage && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            チェック項目がありません
                          </p>
                        )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
