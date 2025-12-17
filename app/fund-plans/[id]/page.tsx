'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Calculator,
  Home,
  Building2,
  Wallet,
  Map,
  Download,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Product, DocumentStatus } from '@/types/database'

// Mock products data
const mockProducts: Product[] = [
  { id: '1', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE', price_per_tsubo: 760000, base_price_per_tsubo: 550000, is_active: true, sort_order: 1, created_at: '' },
  { id: '2', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE+', price_per_tsubo: 710000, base_price_per_tsubo: 630000, is_active: true, sort_order: 2, created_at: '' },
  { id: '3', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'HOURS', price_per_tsubo: 680000, base_price_per_tsubo: null, is_active: true, sort_order: 3, created_at: '' },
  { id: '4', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LACIE', price_per_tsubo: 630000, base_price_per_tsubo: null, is_active: true, sort_order: 4, created_at: '' },
  { id: '5', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE Limited', price_per_tsubo: 500000, base_price_per_tsubo: 500000, is_active: true, sort_order: 5, created_at: '' },
]

// Mock fund plan data
const mockFundPlan = {
  id: 'fp-1',
  customer_id: '1',
  customer_name: '山田 太郎',
  tei_name: '山田様邸',
  product_id: '1',
  status: 'draft' as DocumentStatus,
  version: 1,
  created_at: '2024-12-15T10:00:00Z',
  updated_at: '2024-12-15T10:00:00Z',
  data: {
    // 建物情報
    constructionArea: 30,
    floors: 2,
    // 建物本体工事
    buildingBase: 0,
    // 付帯工事A（建物本体以外）
    temporaryConstruction: 650000, // 仮設工事
    exteriorBase: 800000, // 外構基本
    waterSupply: 350000, // 給水工事
    drainage: 400000, // 排水工事
    gasConstruction: 150000, // ガス工事
    electricalIntro: 200000, // 電気引込
    // 付帯工事B（間取り・オプション）
    optionWorks: 500000, // オプション工事
    // 付帯工事C（土地条件）
    foundationReinforce: 0, // 基礎補強
    retainingWall: 0, // 擁壁工事
    // 諸費用
    designFee: 300000, // 設計料
    permitFee: 150000, // 確認申請費
    registerFee: 200000, // 登記費用
    loanFee: 100000, // ローン諸費用
    fireFee: 50000, // 火災保険
    // 土地費用
    landPrice: 15000000, // 土地代金
    landBrokerageFee: 495000, // 仲介手数料
    landRegisterFee: 150000, // 土地登記費用
  },
}

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  approved: '承認済',
  rejected: '差戻し',
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function FundPlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [plan, setPlan] = useState(mockFundPlan)
  const [data, setData] = useState(mockFundPlan.data)

  const selectedProduct = mockProducts.find(p => p.id === plan.product_id)

  // 計算ロジック
  const calculations = useMemo(() => {
    const pricePerTsubo = selectedProduct?.price_per_tsubo || 0

    // 建物本体工事
    const buildingBase = pricePerTsubo * data.constructionArea

    // 付帯工事A（建物本体以外）
    const futaiA =
      data.temporaryConstruction +
      data.exteriorBase +
      data.waterSupply +
      data.drainage +
      data.gasConstruction +
      data.electricalIntro

    // 付帯工事B（間取り・オプション）
    const futaiB = data.optionWorks

    // 付帯工事C（土地条件）
    const futaiC = data.foundationReinforce + data.retainingWall

    // 建築工事費合計
    const constructionTotal = buildingBase + futaiA + futaiB + futaiC

    // 諸費用
    const fees =
      data.designFee +
      data.permitFee +
      data.registerFee +
      data.loanFee +
      data.fireFee

    // 土地費用
    const landTotal =
      data.landPrice +
      data.landBrokerageFee +
      data.landRegisterFee

    // 総合計
    const grandTotal = constructionTotal + fees + landTotal

    return {
      buildingBase,
      futaiA,
      futaiB,
      futaiC,
      constructionTotal,
      fees,
      landTotal,
      grandTotal,
    }
  }, [data, selectedProduct])

  const handleDataChange = (key: keyof typeof data, value: number) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('保存しました')
    } catch (error) {
      toast.error('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setPlan(prev => ({ ...prev, status: 'submitted' }))
      toast.success('提出しました')
    } catch (error) {
      toast.error('提出に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{plan.tei_name}</h1>
                <Badge variant="outline" className={statusColors[plan.status]}>
                  {statusLabels[plan.status]}
                </Badge>
                <span className="text-sm text-gray-400">v{plan.version}</span>
              </div>
              <p className="text-gray-500">{plan.customer_name} / {selectedProduct?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" disabled>
              <Download className="w-4 h-4 mr-2" />
              PDF出力
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
            {plan.status === 'draft' && (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                提出する
              </Button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">建物本体</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculations.buildingBase)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">付帯工事</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculations.futaiA + calculations.futaiB + calculations.futaiC)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">諸費用</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculations.fees)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-bold">総合計</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(calculations.grandTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="building" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="building" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              建物
            </TabsTrigger>
            <TabsTrigger value="futai" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              付帯工事
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              諸費用
            </TabsTrigger>
            <TabsTrigger value="land" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              土地
            </TabsTrigger>
          </TabsList>

          {/* 建物タブ */}
          <TabsContent value="building">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Home className="w-5 h-5 mr-2 text-orange-500" />
                  建物本体工事
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>商品</Label>
                    <Select
                      value={plan.product_id}
                      onValueChange={(value) => setPlan(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({formatCurrency(product.price_per_tsubo || 0)}/坪)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">施工面積（坪）</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      value={data.constructionArea}
                      onChange={(e) => handleDataChange('constructionArea', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>階数</Label>
                    <Select
                      value={String(data.floors)}
                      onValueChange={(value) => handleDataChange('floors', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1階（平屋）</SelectItem>
                        <SelectItem value="2">2階建て</SelectItem>
                        <SelectItem value="3">3階建て</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">建物本体工事</span>
                    <span className="text-xl font-bold">{formatCurrency(calculations.buildingBase)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.constructionArea}坪 × {formatCurrency(selectedProduct?.price_per_tsubo || 0)}/坪
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 付帯工事タブ */}
          <TabsContent value="futai">
            <div className="space-y-6">
              {/* 付帯工事A */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">付帯工事A（建物本体以外）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>仮設工事</Label>
                      <Input
                        type="number"
                        value={data.temporaryConstruction}
                        onChange={(e) => handleDataChange('temporaryConstruction', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>外構基本</Label>
                      <Input
                        type="number"
                        value={data.exteriorBase}
                        onChange={(e) => handleDataChange('exteriorBase', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>給水工事</Label>
                      <Input
                        type="number"
                        value={data.waterSupply}
                        onChange={(e) => handleDataChange('waterSupply', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>排水工事</Label>
                      <Input
                        type="number"
                        value={data.drainage}
                        onChange={(e) => handleDataChange('drainage', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ガス工事</Label>
                      <Input
                        type="number"
                        value={data.gasConstruction}
                        onChange={(e) => handleDataChange('gasConstruction', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>電気引込</Label>
                      <Input
                        type="number"
                        value={data.electricalIntro}
                        onChange={(e) => handleDataChange('electricalIntro', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium">付帯工事A 小計</span>
                    <span className="text-lg font-bold">{formatCurrency(calculations.futaiA)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 付帯工事B */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">付帯工事B（間取り・オプション）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>オプション工事</Label>
                    <Input
                      type="number"
                      value={data.optionWorks}
                      onChange={(e) => handleDataChange('optionWorks', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium">付帯工事B 小計</span>
                    <span className="text-lg font-bold">{formatCurrency(calculations.futaiB)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 付帯工事C */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">付帯工事C（土地条件）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>基礎補強</Label>
                      <Input
                        type="number"
                        value={data.foundationReinforce}
                        onChange={(e) => handleDataChange('foundationReinforce', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>擁壁工事</Label>
                      <Input
                        type="number"
                        value={data.retainingWall}
                        onChange={(e) => handleDataChange('retainingWall', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium">付帯工事C 小計</span>
                    <span className="text-lg font-bold">{formatCurrency(calculations.futaiC)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 諸費用タブ */}
          <TabsContent value="fees">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="w-5 h-5 mr-2 text-orange-500" />
                  諸費用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>設計料</Label>
                    <Input
                      type="number"
                      value={data.designFee}
                      onChange={(e) => handleDataChange('designFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>確認申請費</Label>
                    <Input
                      type="number"
                      value={data.permitFee}
                      onChange={(e) => handleDataChange('permitFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>登記費用</Label>
                    <Input
                      type="number"
                      value={data.registerFee}
                      onChange={(e) => handleDataChange('registerFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ローン諸費用</Label>
                    <Input
                      type="number"
                      value={data.loanFee}
                      onChange={(e) => handleDataChange('loanFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>火災保険</Label>
                    <Input
                      type="number"
                      value={data.fireFee}
                      onChange={(e) => handleDataChange('fireFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium">諸費用 合計</span>
                  <span className="text-lg font-bold">{formatCurrency(calculations.fees)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 土地タブ */}
          <TabsContent value="land">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Map className="w-5 h-5 mr-2 text-orange-500" />
                  土地費用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>土地代金</Label>
                    <Input
                      type="number"
                      value={data.landPrice}
                      onChange={(e) => handleDataChange('landPrice', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>仲介手数料</Label>
                    <Input
                      type="number"
                      value={data.landBrokerageFee}
                      onChange={(e) => handleDataChange('landBrokerageFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>土地登記費用</Label>
                    <Input
                      type="number"
                      value={data.landRegisterFee}
                      onChange={(e) => handleDataChange('landRegisterFee', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium">土地費用 合計</span>
                  <span className="text-lg font-bold">{formatCurrency(calculations.landTotal)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
