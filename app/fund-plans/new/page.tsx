'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Home, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer, Product } from '@/types/database'

// Mock data
const mockCustomers: Partial<Customer>[] = [
  { id: '1', name: '山田 太郎', tei_name: '山田様邸' },
  { id: '2', name: '佐藤 花子', tei_name: '佐藤様邸' },
  { id: '3', name: '鈴木 一郎', tei_name: '鈴木様邸' },
]

const mockProducts: Partial<Product>[] = [
  { id: '1', name: 'LIFE', price_per_tsubo: 760000 },
  { id: '2', name: 'LIFE+', price_per_tsubo: 710000 },
  { id: '3', name: 'HOURS', price_per_tsubo: 680000 },
  { id: '4', name: 'LACIE', price_per_tsubo: 630000 },
  { id: '5', name: 'LIFE Limited', price_per_tsubo: 500000 },
]

function NewFundPlanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    customerId: searchParams.get('customer') || '',
    productId: '',
    constructionArea: '',
    floors: '2',
  })

  const selectedProduct = mockProducts.find(p => p.id === formData.productId)

  // Calculate estimated building price
  const estimatedPrice = selectedProduct?.price_per_tsubo && formData.constructionArea
    ? selectedProduct.price_per_tsubo * parseFloat(formData.constructionArea)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('資金計画書を作成しました')
      router.push('/fund-plans')
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
          <h1 className="text-2xl font-bold text-gray-900">資金計画書 新規作成</h1>
          <p className="text-gray-500">基本情報を入力してください</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer & Product Selection */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
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
                <Label>商品 <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="商品を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id!}>
                        {product.name}
                        {product.price_per_tsubo && (
                          <span className="text-gray-500 ml-2">
                            (¥{product.price_per_tsubo.toLocaleString()}/坪)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="area">施工面積（坪）<span className="text-red-500">*</span></Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  value={formData.constructionArea}
                  onChange={(e) => setFormData({ ...formData, constructionArea: e.target.value })}
                  placeholder="例: 30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>階数</Label>
                <Select
                  value={formData.floors}
                  onValueChange={(value) => setFormData({ ...formData, floors: value })}
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
          </CardContent>
        </Card>

        {/* Price Preview */}
        {estimatedPrice > 0 && (
          <Card className="border-0 shadow-lg mb-6 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calculator className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">建物本体概算価格</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ¥{estimatedPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{selectedProduct?.name}</p>
                  <p>{formData.constructionArea}坪 × ¥{selectedProduct?.price_per_tsubo?.toLocaleString()}/坪</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={isLoading || !formData.customerId || !formData.productId || !formData.constructionArea}
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
                作成する
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewFundPlanPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewFundPlanForm />
      </Suspense>
    </Layout>
  )
}
