'use client'

import { CardSelect, type CardSelectOption } from '@/components/ui/card-select'
import type { ProductType } from '@/types/fund-plan'
import { Home, Building2, Star, Crown } from 'lucide-react'

/**
 * 商品タイプの詳細情報
 */
interface ProductInfo {
  type: ProductType
  label: string
  category: 'standard' | 'premium' | 'hiraya' | 'limited'
  pricePerTsubo: number
  description: string
  recommended?: boolean
}

const PRODUCT_LIST: ProductInfo[] = [
  // スタンダード
  { type: 'LIFE', label: 'LIFE', category: 'standard', pricePerTsubo: 550000, description: 'スタンダードプラン' },
  { type: 'LIFE +', label: 'LIFE +', category: 'standard', pricePerTsubo: 580000, description: '機能充実プラン', recommended: true },
  { type: 'HOURS', label: 'HOURS', category: 'standard', pricePerTsubo: 560000, description: '時間を楽しむ家' },
  { type: 'LACIE', label: 'LACIE', category: 'standard', pricePerTsubo: 570000, description: '女性視点の設計' },
  { type: 'LIFE choose', label: 'LIFE choose', category: 'standard', pricePerTsubo: 540000, description: 'カスタマイズ重視' },

  // プレミアム
  { type: 'LIFE X(28～30坪)', label: 'LIFE X(28～30坪)', category: 'premium', pricePerTsubo: 620000, description: 'ハイグレード' },
  { type: 'LIFE X(30～33坪)', label: 'LIFE X(30～33坪)', category: 'premium', pricePerTsubo: 610000, description: 'ハイグレード' },
  { type: 'LIFE X(33～35坪)', label: 'LIFE X(33～35坪)', category: 'premium', pricePerTsubo: 600000, description: 'ハイグレード' },
  { type: 'LIFE X(35～38坪)', label: 'LIFE X(35～38坪)', category: 'premium', pricePerTsubo: 590000, description: 'ハイグレード' },

  // 平屋
  { type: 'G-SMART平屋', label: 'G-SMART平屋', category: 'hiraya', pricePerTsubo: 600000, description: '平屋スタンダード' },
  { type: 'G-SMART平屋+', label: 'G-SMART平屋+', category: 'hiraya', pricePerTsubo: 630000, description: '平屋機能充実' },

  // Limited
  { type: 'LIFE Limited', label: 'LIFE Limited', category: 'limited', pricePerTsubo: 680000, description: '限定モデル' },
  { type: 'LIFE+ Limited', label: 'LIFE+ Limited', category: 'limited', pricePerTsubo: 700000, description: '最上位モデル' },
  { type: 'G-SMART平屋 Limited', label: 'G-SMART平屋 Limited', category: 'limited', pricePerTsubo: 680000, description: '平屋限定' },
  { type: 'G-SMART平屋+ Limited', label: 'G-SMART平屋+ Limited', category: 'limited', pricePerTsubo: 700000, description: '平屋最上位' },
]

const categoryIcons: Record<ProductInfo['category'], React.ReactNode> = {
  standard: <Home className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
  hiraya: <Building2 className="w-5 h-5" />,
  limited: <Star className="w-5 h-5" />,
}

const categoryLabels: Record<ProductInfo['category'], string> = {
  standard: 'スタンダード',
  premium: 'プレミアム',
  hiraya: '平屋',
  limited: 'Limited',
}

interface ProductTypeSelectorProps {
  value: ProductType
  onChange: (value: ProductType, pricePerTsubo: number) => void
  compact?: boolean
}

/**
 * ProductTypeSelector - 商品タイプ選択コンポーネント
 *
 * カテゴリごとにグループ化して表示
 */
export function ProductTypeSelector({
  value,
  onChange,
  compact = false,
}: ProductTypeSelectorProps) {
  const options: CardSelectOption<ProductType>[] = PRODUCT_LIST.map((product) => ({
    value: product.type,
    label: product.label,
    description: `${product.pricePerTsubo.toLocaleString()}円/坪`,
    icon: categoryIcons[product.category],
    recommended: product.recommended,
  }))

  const handleChange = (productType: ProductType) => {
    const product = PRODUCT_LIST.find((p) => p.type === productType)
    if (product) {
      onChange(productType, product.pricePerTsubo)
    }
  }

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={handleChange}
      label="商品タイプ"
      description="建物の商品タイプを選択してください"
      searchable
      searchPlaceholder="商品名で検索..."
      initialDisplayCount={compact ? 6 : undefined}
      columns={compact ? 2 : 3}
      compact={compact}
    />
  )
}

/**
 * ProductTypeSelectorCategorized - カテゴリ別商品タイプ選択
 */
export function ProductTypeSelectorCategorized({
  value,
  onChange,
}: ProductTypeSelectorProps) {
  const categories = ['standard', 'premium', 'hiraya', 'limited'] as const

  const handleChange = (productType: ProductType) => {
    const product = PRODUCT_LIST.find((p) => p.type === productType)
    if (product) {
      onChange(productType, product.pricePerTsubo)
    }
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const products = PRODUCT_LIST.filter((p) => p.category === category)
        const options: CardSelectOption<ProductType>[] = products.map((product) => ({
          value: product.type,
          label: product.label,
          description: `${product.pricePerTsubo.toLocaleString()}円/坪`,
          icon: categoryIcons[product.category],
          recommended: product.recommended,
        }))

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                {categoryIcons[category]}
              </div>
              <h4 className="font-medium text-gray-800">{categoryLabels[category]}</h4>
            </div>
            <CardSelect
              options={options}
              value={value}
              onChange={handleChange}
              columns={category === 'premium' ? 4 : 3}
              compact
            />
          </div>
        )
      })}
    </div>
  )
}

/**
 * getProductInfo - 商品情報取得
 */
export function getProductInfo(productType: ProductType): ProductInfo | undefined {
  return PRODUCT_LIST.find((p) => p.type === productType)
}

/**
 * getPricePerTsubo - 坪単価取得
 */
export function getPricePerTsubo(productType: ProductType): number {
  const product = PRODUCT_LIST.find((p) => p.type === productType)
  return product?.pricePerTsubo ?? 550000
}
