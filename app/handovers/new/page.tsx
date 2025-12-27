'use client'

import { useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, FileText, User, Home, Calendar, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerStore, useAuthStore, useHandoverStore, useContractStore } from '@/store'
import { useDemoData } from '@/hooks/use-demo-data'

// モックスタッフ（将来的にはユーザーストアから取得）
const mockConstructionManagers = [
  { id: 'c1', name: '工事 一郎', department: '工事部' },
  { id: 'c2', name: '工事 二郎', department: '工事部' },
  { id: 'c3', name: '工事 三郎', department: '工事部' },
]

// 引継チェックリスト項目
const checklistItems = [
  { id: 'contract_confirmed', label: '契約内容確認', category: '契約関連' },
  { id: 'drawings_handed', label: '図面引渡', category: '契約関連' },
  { id: 'specifications_confirmed', label: '仕様確認', category: '契約関連' },
  { id: 'schedule_confirmed', label: '工程確認', category: 'スケジュール' },
  { id: 'groundbreaking_date_set', label: '着工日確定', category: 'スケジュール' },
  { id: 'completion_date_set', label: '完成予定日確定', category: 'スケジュール' },
  { id: 'customer_preferences', label: '顧客要望共有', category: '顧客情報' },
  { id: 'special_notes', label: '特記事項共有', category: '顧客情報' },
  { id: 'neighbor_info', label: '近隣情報共有', category: '現場情報' },
  { id: 'site_access', label: '現場アクセス確認', category: '現場情報' },
]

function NewHandoverForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // ストア
  const { user: authUser } = useAuthStore()
  const { customers: storeCustomers } = useCustomerStore()
  const { contracts: storeContracts } = useContractStore()
  const { addHandover } = useHandoverStore()
  const { isDemoMode, customers: demoCustomers, contracts: demoContracts, user: demoUser } = useDemoData()

  const user = isDemoMode ? demoUser : authUser
  const customers = isDemoMode ? demoCustomers : storeCustomers
  const contracts = isDemoMode ? demoContracts : storeContracts

  // 契約済み顧客のみ（内定以降）
  const eligibleCustomers = useMemo(() => {
    return customers.filter(c =>
      ['内定', '変更契約前', '変更契約後', 'オーナー'].includes(c.pipeline_status)
    )
  }, [customers])

  // customer または customer_id のどちらでも対応
  const customerId = searchParams.get('customer_id') || searchParams.get('customer') || ''
  const contractId = searchParams.get('contract_id') || ''

  // 選択された顧客（将来的にプリフィル用）
  const _selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === customerId)
  }, [customers, customerId])

  // 選択された契約（将来的にプリフィル用）
  const _selectedContract = useMemo(() => {
    return contracts.find(c => c.id === contractId)
  }, [contracts, contractId])

  const [formData, setFormData] = useState({
    customerId,
    contractId,
    constructionManagerId: '',
    handoverDate: '',
    contractSummary: '',
    customerCharacter: '',
    specialRequests: '',
    siteNotes: '',
    checklistCompleted: [] as string[],
  })

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        checklistCompleted: [...formData.checklistCompleted, itemId],
      })
    } else {
      setFormData({
        ...formData,
        checklistCompleted: formData.checklistCompleted.filter(id => id !== itemId),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!formData.customerId) {
      toast.error('顧客を選択してください')
      return
    }
    if (!formData.constructionManagerId) {
      toast.error('工事担当を選択してください')
      return
    }

    setIsLoading(true)

    try {
      const customer = customers.find(c => c.id === formData.customerId)
      const constructionManager = mockConstructionManagers.find(m => m.id === formData.constructionManagerId)

      // チェックリストをカテゴリ別に整形
      const checklist = Object.entries(groupedChecklist).map(([category, items]) => ({
        category,
        items: items.map(item => ({
          label: item.label,
          checked: formData.checklistCompleted.includes(item.id),
        })),
      }))

      const handoverId = addHandover({
        customer_id: formData.customerId,
        contract_id: formData.contractId || null,
        from_user_id: user?.id || null,
        from_user_name: user?.name || null,
        to_user_id: formData.constructionManagerId,
        to_user_name: constructionManager?.name || null,
        status: 'draft',
        customer_name: customer?.name || null,
        tei_name: customer?.tei_name || null,
        customer_notes: formData.customerCharacter || null,
        site_notes: formData.siteNotes || null,
        schedule_notes: formData.handoverDate ? `引渡予定日: ${formData.handoverDate}` : null,
        special_notes: formData.specialRequests || null,
        checklist,
        confirmed_by: null,
        confirmed_by_name: null,
        confirmed_at: null,
      })

      toast.success('引継書を作成しました')
      router.push(`/handovers/${handoverId}`)
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // チェックリストをカテゴリ別にグループ化
  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof checklistItems>)

  return (
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
          <h1 className="text-2xl font-bold text-gray-900">引継書 新規作成</h1>
          <p className="text-gray-500">営業から工事への引継書</p>
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
                <Label>顧客 <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.tei_name} ({customer.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eligibleCustomers.length === 0 && (
                  <p className="text-sm text-gray-500">内定以降の顧客がいません</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverDate">引渡予定日</Label>
                <Input
                  id="handoverDate"
                  type="date"
                  value={formData.handoverDate}
                  onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>営業担当（引継元）</Label>
                <Input
                  value={user?.name || '未設定'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>工事担当 <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.constructionManagerId}
                  onValueChange={(value) => setFormData({ ...formData, constructionManagerId: value })}
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
            </div>
          </CardContent>
        </Card>

        {/* 引継チェックリスト */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              引継チェックリスト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedChecklist).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={formData.checklistCompleted.includes(item.id)}
                          onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                        />
                        <Label htmlFor={item.id} className="text-sm cursor-pointer">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                完了: {formData.checklistCompleted.length} / {checklistItems.length}
              </p>
            </div>
          </CardContent>
        </Card>

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
              <Label htmlFor="customerCharacter">お客様の性格・傾向</Label>
              <Textarea
                id="customerCharacter"
                value={formData.customerCharacter}
                onChange={(e) => setFormData({ ...formData, customerCharacter: e.target.value })}
                placeholder="例: 細かいことを気にされる方。メールより電話連絡を好む。"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">特別なご要望・こだわり</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="例: 収納スペースへの強いこだわりあり。北側の窓は大きめに。"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 契約概要 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              契約概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="contractSummary">契約内容サマリ</Label>
              <Textarea
                id="contractSummary"
                value={formData.contractSummary}
                onChange={(e) => setFormData({ ...formData, contractSummary: e.target.value })}
                placeholder="契約の概要、重要ポイントを記入してください..."
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* 現場情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
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
                作成中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                引継書を作成
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewHandoverPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewHandoverForm />
      </Suspense>
    </Layout>
  )
}
