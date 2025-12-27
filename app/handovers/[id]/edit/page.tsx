'use client'

import { useState, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  Home,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useHandoverStore, useCustomerStore } from '@/store'

// モック工事担当（将来的にはユーザーストアから取得）
const mockConstructionManagers = [
  { id: 'c1', name: '工事 一郎', department: '工事部' },
  { id: 'c2', name: '工事 二郎', department: '工事部' },
  { id: 'c3', name: '工事 三郎', department: '工事部' },
]

export default function EditHandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { getHandover, updateHandover } = useHandoverStore()
  const { customers } = useCustomerStore()

  const handover = getHandover(resolvedParams.id)
  const customer = useMemo(() => {
    if (!handover?.customer_id) return null
    return customers.find(c => c.id === handover.customer_id)
  }, [customers, handover?.customer_id])

  // フォームデータ
  const [formData, setFormData] = useState(() => ({
    toUserId: handover?.to_user_id || '',
    customerNotes: handover?.customer_notes || '',
    siteNotes: handover?.site_notes || '',
    scheduleNotes: handover?.schedule_notes || '',
    specialNotes: handover?.special_notes || '',
    checklist: handover?.checklist || [],
  }))

  if (!handover) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500 mb-4">引継書が見つかりません</p>
          <Button onClick={() => router.push('/handovers')}>
            一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const handleChecklistChange = (categoryIndex: number, itemIndex: number, checked: boolean) => {
    const newChecklist = formData.checklist.map((cat, cIdx) => {
      if (cIdx !== categoryIndex) return cat
      return {
        ...cat,
        items: cat.items.map((item, iIdx) => {
          if (iIdx !== itemIndex) return item
          return { ...item, checked }
        }),
      }
    })
    setFormData({ ...formData, checklist: newChecklist })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const constructionManager = mockConstructionManagers.find(m => m.id === formData.toUserId)

      updateHandover(resolvedParams.id, {
        to_user_id: formData.toUserId || null,
        to_user_name: constructionManager?.name || null,
        customer_notes: formData.customerNotes || null,
        site_notes: formData.siteNotes || null,
        schedule_notes: formData.scheduleNotes || null,
        special_notes: formData.specialNotes || null,
        checklist: formData.checklist,
      })

      toast.success('引継書を更新しました')
      router.push(`/handovers/${resolvedParams.id}`)
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">引継書 編集</h1>
            <p className="text-gray-500">{handover.tei_name || customer?.tei_name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-orange-500" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>顧客名</Label>
                  <Input
                    value={handover.customer_name || customer?.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>営業担当（引継元）</Label>
                  <Input
                    value={handover.from_user_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>工事担当（引継先）</Label>
                <Select
                  value={formData.toUserId}
                  onValueChange={(value) => setFormData({ ...formData, toUserId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="工事担当を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockConstructionManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 引継チェックリスト */}
          {formData.checklist.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  引継チェックリスト
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {formData.checklist.map((category, catIdx) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">{category.category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.items.map((item, itemIdx) => (
                          <div key={`${catIdx}-${itemIdx}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${catIdx}-${itemIdx}`}
                              checked={item.checked}
                              onCheckedChange={(checked) => handleChecklistChange(catIdx, itemIdx, checked as boolean)}
                            />
                            <Label
                              htmlFor={`edit-${catIdx}-${itemIdx}`}
                              className={`text-sm cursor-pointer ${
                                item.checked ? 'text-green-700 line-through' : ''
                              }`}
                            >
                              {item.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 顧客情報 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-orange-500" />
                顧客情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customerNotes">お客様の性格・傾向</Label>
                <Textarea
                  id="customerNotes"
                  value={formData.customerNotes}
                  onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  placeholder="例: 細かいことを気にされる方。メールより電話連絡を好む。"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialNotes">特別なご要望・こだわり</Label>
                <Textarea
                  id="specialNotes"
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  placeholder="例: 収納スペースへの強いこだわりあり。北側の窓は大きめに。"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* スケジュール */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                スケジュール
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="scheduleNotes">スケジュール情報</Label>
                <Textarea
                  id="scheduleNotes"
                  value={formData.scheduleNotes}
                  onChange={(e) => setFormData({ ...formData, scheduleNotes: e.target.value })}
                  placeholder="例: 引渡予定日: 2025/6/30、着工: 2025/2/1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 現場情報 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Home className="w-5 h-5 mr-2 text-orange-500" />
                現場情報・注意事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="siteNotes">現場に関する注意事項</Label>
                <Textarea
                  id="siteNotes"
                  value={formData.siteNotes}
                  onChange={(e) => setFormData({ ...formData, siteNotes: e.target.value })}
                  placeholder="例: 近隣への配慮が必要（特に北側の〇〇様）。駐車スペースは前面道路のみ。"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  更新する
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
