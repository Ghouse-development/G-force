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
import { ArrowLeft, Save, FileSignature, User, Home, Wallet, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer, User as UserType } from '@/types/database'

// モックデータ
const mockCustomers: Partial<Customer>[] = [
  { id: '1', name: '山田 太郎', tei_name: '山田様邸' },
  { id: '2', name: '佐藤 花子', tei_name: '佐藤様邸' },
  { id: '3', name: '鈴木 一郎', tei_name: '鈴木様邸' },
  { id: '4', name: '田中 次郎', tei_name: '田中様邸' },
]

const mockSalesStaff: Partial<UserType>[] = [
  { id: 's1', name: '営業 太郎', department: '営業部' },
  { id: 's2', name: '営業 次郎', department: '営業部' },
]

function NewContractForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    customerId: searchParams.get('customer') || '',
    salesStaffId: '',
    contractDate: '',
    contractAmount: '',
    buildingArea: '',
    floors: '',
    structure: '',
    groundbreakingDate: '',
    completionDate: '',
    handoverDate: '',
    paymentSchedule: '',
    notes: '',
  })

  const selectedCustomer = mockCustomers.find(c => c.id === formData.customerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!formData.customerId) {
      toast.error('顧客を選択してください')
      return
    }
    if (!formData.contractDate) {
      toast.error('契約日を入力してください')
      return
    }
    if (!formData.contractAmount) {
      toast.error('契約金額を入力してください')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('契約書を作成しました')
      router.push('/contracts')
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
          <h1 className="text-2xl font-bold text-gray-900">契約書 新規作成</h1>
          <p className="text-gray-500">請負契約書の作成</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileSignature className="w-5 h-5 mr-2 text-orange-500" />
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
                <Label>営業担当</Label>
                <Select
                  value={formData.salesStaffId}
                  onValueChange={(value) => setFormData({ ...formData, salesStaffId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="営業担当を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSalesStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id!}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contractDate">契約日 <span className="text-red-500">*</span></Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractAmount">契約金額（税込）<span className="text-red-500">*</span></Label>
                <Input
                  id="contractAmount"
                  type="number"
                  value={formData.contractAmount}
                  onChange={(e) => setFormData({ ...formData, contractAmount: e.target.value })}
                  placeholder="例: 38000000"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 建物情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              建物情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="buildingArea">延床面積（坪）</Label>
                <Input
                  id="buildingArea"
                  type="number"
                  step="0.01"
                  value={formData.buildingArea}
                  onChange={(e) => setFormData({ ...formData, buildingArea: e.target.value })}
                  placeholder="例: 35.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floors">階数</Label>
                <Select
                  value={formData.floors}
                  onValueChange={(value) => setFormData({ ...formData, floors: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="階数を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">平屋</SelectItem>
                    <SelectItem value="2">2階建て</SelectItem>
                    <SelectItem value="3">3階建て</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="structure">構造</Label>
                <Select
                  value={formData.structure}
                  onValueChange={(value) => setFormData({ ...formData, structure: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="構造を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood">木造</SelectItem>
                    <SelectItem value="steel">軽量鉄骨造</SelectItem>
                    <SelectItem value="rc">RC造</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スケジュール */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              工事スケジュール
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="groundbreakingDate">着工予定日</Label>
                <Input
                  id="groundbreakingDate"
                  type="date"
                  value={formData.groundbreakingDate}
                  onChange={(e) => setFormData({ ...formData, groundbreakingDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completionDate">完成予定日</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                />
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
          </CardContent>
        </Card>

        {/* 支払条件 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wallet className="w-5 h-5 mr-2 text-orange-500" />
              支払条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="paymentSchedule">支払スケジュール</Label>
              <Textarea
                id="paymentSchedule"
                value={formData.paymentSchedule}
                onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value })}
                placeholder="例:&#10;契約時: 10%&#10;着工時: 30%&#10;上棟時: 30%&#10;引渡時: 30%"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">備考・特記事項</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="契約に関する特記事項を記入してください..."
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
                作成中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                契約書を作成
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewContractPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewContractForm />
      </Suspense>
    </Layout>
  )
}
