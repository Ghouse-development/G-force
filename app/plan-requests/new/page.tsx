'use client'

import { useState, Suspense } from 'react'
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
import { ArrowLeft, Save, FileEdit, MapPin, Home, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer, User } from '@/types/database'

// モックデータ
const mockCustomers: Partial<Customer>[] = [
  { id: '1', name: '山田 太郎', tei_name: '山田様邸' },
  { id: '2', name: '佐藤 花子', tei_name: '佐藤様邸' },
  { id: '3', name: '鈴木 一郎', tei_name: '鈴木様邸' },
  { id: '4', name: '田中 次郎', tei_name: '田中様邸' },
]

const mockDesigners: Partial<User>[] = [
  { id: 'd1', name: '設計 一郎', department: '設計部' },
  { id: 'd2', name: '設計 二郎', department: '設計部' },
  { id: 'd3', name: '設計 三郎', department: '設計部' },
]

function NewPlanRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    customerId: searchParams.get('customer') || '',
    assignedTo: '',
    landAddress: '',
    landArea: '',
    budgetMin: '',
    budgetMax: '',
    preferredRooms: '',
    preferredStyle: '',
    requestDetails: '',
    deadline: '',
  })

  const selectedCustomer = mockCustomers.find(c => c.id === formData.customerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!formData.customerId) {
      toast.error('顧客を選択してください')
      return
    }
    if (!formData.landAddress) {
      toast.error('土地住所を入力してください')
      return
    }
    if (!formData.landArea) {
      toast.error('土地面積を入力してください')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('プラン依頼を作成しました')
      router.push('/plan-requests')
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">プラン依頼 新規作成</h1>
          <p className="text-gray-500">設計部への新規プラン作成依頼</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 顧客・担当選択 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileEdit className="w-5 h-5 mr-2 text-orange-500" />
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
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id!}>
                        {customer.tei_name} ({customer.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>担当設計士</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="設計士を選択（任意）" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDesigners.map((designer) => (
                      <SelectItem key={designer.id} value={designer.id!}>
                        {designer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">希望納期</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 土地情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              土地情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="landAddress">土地住所 <span className="text-red-500">*</span></Label>
              <Input
                id="landAddress"
                value={formData.landAddress}
                onChange={(e) => setFormData({ ...formData, landAddress: e.target.value })}
                placeholder="例: 大阪府豊中市〇〇町1-2-3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landArea">土地面積（坪）<span className="text-red-500">*</span></Label>
              <Input
                id="landArea"
                type="number"
                step="0.01"
                value={formData.landArea}
                onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                placeholder="例: 50"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 希望条件 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              希望条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="preferredRooms">希望間取り</Label>
                <Input
                  id="preferredRooms"
                  value={formData.preferredRooms}
                  onChange={(e) => setFormData({ ...formData, preferredRooms: e.target.value })}
                  placeholder="例: 4LDK、3LDK+書斎"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredStyle">希望スタイル</Label>
                <Select
                  value={formData.preferredStyle}
                  onValueChange={(value) => setFormData({ ...formData, preferredStyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="スタイルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">モダン</SelectItem>
                    <SelectItem value="natural">ナチュラル</SelectItem>
                    <SelectItem value="japanese">和モダン</SelectItem>
                    <SelectItem value="minimal">シンプル・ミニマル</SelectItem>
                    <SelectItem value="industrial">インダストリアル</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 予算 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wallet className="w-5 h-5 mr-2 text-orange-500" />
              予算
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">予算下限（万円）</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  placeholder="例: 3000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetMax">予算上限（万円）</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  placeholder="例: 3500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 依頼詳細 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">依頼詳細・特記事項</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.requestDetails}
              onChange={(e) => setFormData({ ...formData, requestDetails: e.target.value })}
              placeholder="その他の希望条件、特記事項などを記入してください..."
              rows={5}
            />
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
                依頼中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                依頼する
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewPlanRequestPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewPlanRequestForm />
      </Suspense>
    </Layout>
  )
}
