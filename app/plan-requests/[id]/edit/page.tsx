'use client'

import { useState, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  ArrowLeft,
  Save,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePlanRequestStore, useCustomerStore } from '@/store'
import {
  PRODUCT_LIST,
  DELIVERABLE_TYPE_LIST,
  CONSTRUCTION_AREA_LIST,
  PLAN_REQUEST_STATUS_ORDER,
  PLAN_REQUEST_STATUS_CONFIG,
} from '@/types/database'
import type { PlanRequestStatus, DeliverableType, ConstructionArea } from '@/types/database'

export default function EditPlanRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { getPlanRequest, updatePlanRequest } = usePlanRequestStore()
  const { customers } = useCustomerStore()

  const planRequest = getPlanRequest(resolvedParams.id)
  const customer = useMemo(() => {
    if (!planRequest?.customer_id) return null
    return customers.find(c => c.id === planRequest.customer_id)
  }, [customers, planRequest?.customer_id])

  // フォームデータ
  const [formData, setFormData] = useState(() => ({
    productName: planRequest?.product_name || '',
    deliverableType: planRequest?.deliverable_type || '',
    constructionArea: planRequest?.construction_area || '',
    landAddress: planRequest?.land_address || '',
    landLotNumber: planRequest?.land_lot_number || '',
    buildingArea: planRequest?.building_area?.toString() || '',
    floors: planRequest?.floors?.toString() || '',
    deadline: planRequest?.deadline ? planRequest.deadline.split('T')[0] : '',
    notes: planRequest?.notes || '',
    status: planRequest?.status || '新規依頼',
  }))

  if (!planRequest) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500 mb-4">プラン依頼が見つかりません</p>
          <Button onClick={() => router.push('/plan-requests')}>
            一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      updatePlanRequest(resolvedParams.id, {
        product_name: formData.productName || null,
        deliverable_type: (formData.deliverableType as DeliverableType) || null,
        construction_area: (formData.constructionArea as ConstructionArea) || null,
        land_address: formData.landAddress || null,
        land_lot_number: formData.landLotNumber || null,
        building_area: formData.buildingArea ? parseFloat(formData.buildingArea) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        deadline: formData.deadline || null,
        notes: formData.notes || null,
        status: formData.status as PlanRequestStatus,
      })

      toast.success('プラン依頼を更新しました')
      router.push(`/plan-requests/${resolvedParams.id}`)
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
            <h1 className="text-2xl font-bold text-gray-900">プラン依頼 編集</h1>
            <p className="text-gray-500">{planRequest.tei_name || customer?.tei_name}</p>
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
                    value={planRequest.customer_name || customer?.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_REQUEST_STATUS_ORDER.map((status) => (
                        <SelectItem key={status} value={status}>
                          {PLAN_REQUEST_STATUS_CONFIG[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>商品名</Label>
                  <Select
                    value={formData.productName}
                    onValueChange={(value) => setFormData({ ...formData, productName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="商品を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_LIST.map((product) => (
                        <SelectItem key={product.value} value={product.value}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>納品形態</Label>
                  <Select
                    value={formData.deliverableType}
                    onValueChange={(value) => setFormData({ ...formData, deliverableType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="納品形態を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERABLE_TYPE_LIST.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 土地・建物情報 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                土地・建物情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="landAddress">建築地住所</Label>
                  <Input
                    id="landAddress"
                    value={formData.landAddress}
                    onChange={(e) => setFormData({ ...formData, landAddress: e.target.value })}
                    placeholder="大阪府豊中市..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landLotNumber">地番</Label>
                  <Input
                    id="landLotNumber"
                    value={formData.landLotNumber}
                    onChange={(e) => setFormData({ ...formData, landLotNumber: e.target.value })}
                    placeholder="〇〇番地"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buildingArea">施工面積（坪）</Label>
                  <Input
                    id="buildingArea"
                    type="number"
                    step="0.1"
                    value={formData.buildingArea}
                    onChange={(e) => setFormData({ ...formData, buildingArea: e.target.value })}
                    placeholder="35.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floors">階数</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>施工エリア</Label>
                  <Select
                    value={formData.constructionArea}
                    onValueChange={(value) => setFormData({ ...formData, constructionArea: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="エリアを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSTRUCTION_AREA_LIST.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* スケジュール・メモ */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                スケジュール・メモ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deadline">期限日</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">メモ・備考</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="設計への要望や注意事項を記入..."
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
