'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { TextInput, NumberInput, DateInput, SectionTitle } from '../fund-plan-input'
import { Package, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FundPlanData, ProductType, FireProtectionZone, BuildingStructure, FloorCount } from '@/types/fund-plan'
import {
  productList,
  productMaster,
  fireProtectionZones,
  buildingStructures,
  floorCounts,
  salesRepMaster,
} from '@/lib/fund-plan/master-data'

// 主要商品（カード表示）
const mainProducts: ProductType[] = [
  'LIFE',
  'LIFE +',
  'HOURS',
  'LACIE',
  'G-SMART平屋',
]

// その他の商品
const otherProducts = productList.filter(p => !mainProducts.includes(p))

interface BasicInfoSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
  const [showOtherProducts, setShowOtherProducts] = useState(false)

  const handleProductChange = (productType: ProductType) => {
    onChange({
      productType,
      pricePerTsubo: productMaster[productType],
    })
  }

  const handleSalesRepChange = (name: string) => {
    const rep = salesRepMaster.find((r) => r.name === name)
    if (rep) {
      onChange({
        salesRep: rep.name,
        salesRepPhone: rep.phone,
      })
    }
  }

  // 選択中の商品が主要商品かどうか
  const isMainProduct = mainProducts.includes(data.productType)

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* 顧客情報 */}
        <div className="space-y-3">
          <SectionTitle>顧客情報</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="顧客名"
              value={data.customerName}
              onChange={(v) => onChange({ customerName: v })}
              placeholder="山田 太郎"
            />
            <TextInput
              label="邸名"
              value={data.teiName}
              onChange={(v) => onChange({ teiName: v })}
              placeholder="山田様邸"
            />
          </div>
          <TextInput
            label="工事名称"
            value={data.constructionName}
            onChange={(v) => onChange({ constructionName: v })}
            placeholder="山田様邸　新築工事"
          />
          <TextInput
            label="建築場所"
            value={data.constructionAddress}
            onChange={(v) => onChange({ constructionAddress: v })}
            placeholder="大阪府大阪市..."
          />
        </div>

        {/* 建物仕様 */}
        <div className="space-y-3">
          <SectionTitle>建物仕様</SectionTitle>

          {/* 商品選択（カード形式） */}
          <div className="space-y-3">
            <Label className="text-xs text-gray-600">商品</Label>

            {/* 主要商品カード */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {mainProducts.map((product) => (
                <button
                  key={product}
                  type="button"
                  onClick={() => handleProductChange(product)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    data.productType === product
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                  )}
                >
                  <Package className={cn(
                    'w-5 h-5 mx-auto mb-1',
                    data.productType === product ? 'text-orange-600' : 'text-gray-400'
                  )} />
                  <p className={cn(
                    'text-sm font-medium',
                    data.productType === product ? 'text-orange-700' : 'text-gray-700'
                  )}>
                    {product}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(productMaster[product] / 10000).toFixed(1)}万/坪
                  </p>
                  {data.productType === product && (
                    <Check className="w-4 h-4 text-orange-600 mx-auto mt-1" />
                  )}
                </button>
              ))}
            </div>

            {/* その他の商品（折りたたみ） */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setShowOtherProducts(!showOtherProducts)}
                className={cn(
                  'w-full px-3 py-2 flex items-center justify-between text-sm transition-colors',
                  !isMainProduct
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
              >
                <span className={cn(
                  'font-medium',
                  !isMainProduct ? 'text-orange-700' : 'text-gray-600'
                )}>
                  {!isMainProduct ? `選択中: ${data.productType}` : 'その他の商品を選択'}
                </span>
                {showOtherProducts ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showOtherProducts && (
                <div className="p-3 border-t grid grid-cols-2 md:grid-cols-3 gap-2">
                  {otherProducts.map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => {
                        handleProductChange(product)
                        setShowOtherProducts(false)
                      }}
                      className={cn(
                        'p-2 rounded-lg border transition-all text-left text-sm',
                        data.productType === product
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      )}
                    >
                      <p className={cn(
                        'font-medium',
                        data.productType === product ? 'text-orange-700' : 'text-gray-700'
                      )}>
                        {product}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(productMaster[product] / 10000).toFixed(1)}万/坪
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 坪単価表示 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <Label className="text-xs text-gray-600">選択中の商品</Label>
              <p className="font-bold text-gray-900">{data.productType}</p>
            </div>
            <NumberInput
              label="坪単価"
              value={data.pricePerTsubo}
              onChange={(v) => onChange({ pricePerTsubo: v })}
              unit="円"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="施工面積"
              value={data.constructionArea}
              onChange={(v) => onChange({ constructionArea: v })}
              unit="坪"
              step={0.5}
            />
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">階数</Label>
              <Select
                value={String(data.floorCount)}
                onValueChange={(v) => onChange({ floorCount: Number(v) as FloorCount })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floorCounts.map((f) => (
                    <SelectItem key={f} value={String(f)}>
                      {f}階
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">防火区分</Label>
              <Select
                value={data.fireProtectionZone}
                onValueChange={(v) => onChange({ fireProtectionZone: v as FireProtectionZone })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fireProtectionZones.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">建物構造</Label>
            <Select
              value={data.buildingStructure}
              onValueChange={(v) => onChange({ buildingStructure: v as BuildingStructure })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildingStructures.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 見積情報 */}
        <div className="space-y-3">
          <SectionTitle>見積情報</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="見積作成日"
              value={data.estimateDate}
              onChange={(v) => onChange({ estimateDate: v })}
            />
            <DateInput
              label="見積有効期限"
              value={data.estimateValidDate}
              onChange={(v) => onChange({ estimateValidDate: v })}
            />
          </div>
        </div>

        {/* 担当者情報 */}
        <div className="space-y-3">
          <SectionTitle>担当者情報</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">営業担当</Label>
              <Select value={data.salesRep} onValueChange={handleSalesRepChange}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {salesRepMaster.map((rep) => (
                    <SelectItem key={rep.name} value={rep.name}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextInput
              label="連絡先"
              value={data.salesRepPhone}
              onChange={(v) => onChange({ salesRepPhone: v })}
              disabled
            />
          </div>
          <TextInput
            label="所属長"
            value={data.managerName}
            onChange={(v) => onChange({ managerName: v })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
