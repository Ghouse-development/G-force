'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Edit,
  Package,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

// Mock data from Excel
const mockProducts: Product[] = [
  { id: '1', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE', price_per_tsubo: 760000, base_price_per_tsubo: 550000, is_active: true, sort_order: 1, created_at: '' },
  { id: '2', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE+', price_per_tsubo: 710000, base_price_per_tsubo: 630000, is_active: true, sort_order: 2, created_at: '' },
  { id: '3', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'HOURS', price_per_tsubo: 680000, base_price_per_tsubo: null, is_active: true, sort_order: 3, created_at: '' },
  { id: '4', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LACIE', price_per_tsubo: 630000, base_price_per_tsubo: null, is_active: true, sort_order: 4, created_at: '' },
  { id: '5', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE Limited', price_per_tsubo: 500000, base_price_per_tsubo: 500000, is_active: true, sort_order: 5, created_at: '' },
  { id: '6', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE+ Limited', price_per_tsubo: 550000, base_price_per_tsubo: 550000, is_active: true, sort_order: 6, created_at: '' },
  { id: '7', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'G-SMART平屋', price_per_tsubo: null, base_price_per_tsubo: 680000, is_active: true, sort_order: 7, created_at: '' },
  { id: '8', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'G-SMART平屋 Limited', price_per_tsubo: null, base_price_per_tsubo: 630000, is_active: true, sort_order: 8, created_at: '' },
  { id: '9', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'G-SMART平屋+', price_per_tsubo: null, base_price_per_tsubo: 760000, is_active: true, sort_order: 9, created_at: '' },
  { id: '10', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'G-SMART平屋+ Limited', price_per_tsubo: null, base_price_per_tsubo: 710000, is_active: true, sort_order: 10, created_at: '' },
  { id: '11', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE X(28～30坪)', price_per_tsubo: null, base_price_per_tsubo: null, is_active: true, sort_order: 11, created_at: '' },
  { id: '12', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE X(30～33坪)', price_per_tsubo: null, base_price_per_tsubo: null, is_active: true, sort_order: 12, created_at: '' },
  { id: '13', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE X(33～35坪)', price_per_tsubo: null, base_price_per_tsubo: null, is_active: true, sort_order: 13, created_at: '' },
  { id: '14', tenant_id: '00000000-0000-0000-0000-000000000001', name: 'LIFE X(35～38坪)', price_per_tsubo: null, base_price_per_tsubo: null, is_active: true, sort_order: 14, created_at: '' },
]

const formatCurrency = (value: number | null) => {
  if (value === null) return '-'
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleToggleActive = (id: string) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ))
    toast.success('商品ステータスを更新しました')
  }

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map(p =>
        p.id === editingProduct.id ? editingProduct : p
      ))
      toast.success('商品を更新しました')
    }
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">商品マスタ</h1>
              <p className="text-gray-500">商品と坪単価を管理</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            disabled
          >
            <Plus className="w-4 h-4 mr-2" />
            新規追加
          </Button>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-600">商品名</th>
                    <th className="text-right p-4 font-medium text-gray-600">坪単価</th>
                    <th className="text-right p-4 font-medium text-gray-600">基本坪単価</th>
                    <th className="text-center p-4 font-medium text-gray-600">ステータス</th>
                    <th className="text-center p-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-900">
                        {formatCurrency(product.price_per_tsubo)}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-500">
                        {formatCurrency(product.base_price_per_tsubo)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={() => handleToggleActive(product.id)}
                          />
                          <Badge
                            variant="outline"
                            className={
                              product.is_active
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }
                          >
                            {product.is_active ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (!open) setEditingProduct(null)
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>商品を編集</DialogTitle>
                              <DialogDescription>
                                商品情報を編集してください
                              </DialogDescription>
                            </DialogHeader>
                            {editingProduct && (
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="name">商品名</Label>
                                  <Input
                                    id="name"
                                    value={editingProduct.name}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="price">坪単価（税込）</Label>
                                  <Input
                                    id="price"
                                    type="number"
                                    value={editingProduct.price_per_tsubo || ''}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        price_per_tsubo: e.target.value ? parseInt(e.target.value) : null,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="basePrice">基本坪単価</Label>
                                  <Input
                                    id="basePrice"
                                    type="number"
                                    value={editingProduct.base_price_per_tsubo || ''}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        base_price_per_tsubo: e.target.value ? parseInt(e.target.value) : null,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                キャンセル
                              </Button>
                              <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-yellow-500">
                                <Save className="w-4 h-4 mr-2" />
                                保存
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
