'use client'

import { useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  ArrowLeft,
  Save,
  User,
  Home,
  Phone,
  Megaphone,
  Globe,
  Instagram,
  Users,
  MessageSquare,
  Building,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'
import {
  type OwnershipType,
  type LeadSource,
  LEAD_SOURCE_CONFIG,
} from '@/types/database'

export default function NewCustomerPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    nameKana: '',
    partnerName: '',
    partnerNameKana: '',
    ownershipType: '単独' as OwnershipType,
    phone: '',
    email: '',
    address: '',
    leadSource: '' as LeadSource | '',
    leadDate: new Date().toISOString().split('T')[0],
    estimatedAmount: '',
    notes: '',
  })

  // Auto-generate tei_name from surname
  const getTeiName = () => {
    if (!formData.name) return ''
    const surname = formData.name.split(/[\s　]/)[0]
    return `${surname}様邸`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.leadSource) {
      toast.error('反響経路を選択してください')
      return
    }

    setIsLoading(true)

    try {
      // For now, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success('反響を登録しました')
      router.push('/customers')
    } catch (error) {
      toast.error('登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新規反響登録</h1>
            <p className="text-gray-500">顧客情報を入力してください</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 反響情報 */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Megaphone className="w-5 h-5 mr-2 text-orange-500" />
                反響情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 反響経路をカードで選択 */}
              <div className="space-y-3">
                <Label>反響経路 <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: '資料請求', icon: Megaphone, color: 'text-blue-600' },
                    { value: 'モデルハウス見学会予約', icon: Home, color: 'text-orange-600' },
                    { value: 'HP問合せ', icon: Globe, color: 'text-green-600' },
                    { value: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                    { value: 'オーナー紹介', icon: Users, color: 'text-purple-600' },
                    { value: '社員紹介', icon: Building, color: 'text-indigo-600' },
                    { value: '業者紹介', icon: Building, color: 'text-teal-600' },
                    { value: 'TEL問合せ', icon: Phone, color: 'text-amber-600' },
                  ].map((source) => {
                    const Icon = source.icon
                    const isSelected = formData.leadSource === source.value
                    return (
                      <button
                        key={source.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, leadSource: source.value as LeadSource })}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 shadow-md'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-orange-600' : source.color}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                          {source.value === 'モデルハウス見学会予約' ? 'MH見学会' : source.value}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadDate">反響日</Label>
                  <Input
                    id="leadDate"
                    type="date"
                    value={formData.leadDate}
                    onChange={(e) => setFormData({ ...formData, leadDate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedAmount">見込金額（万円）</Label>
                  <Input
                    id="estimatedAmount"
                    type="number"
                    value={formData.estimatedAmount}
                    onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                    placeholder="例: 3500"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-orange-500" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ownership Type */}
              <div className="space-y-3">
                <Label>名義タイプ</Label>
                <RadioGroup
                  value={formData.ownershipType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ownershipType: value as OwnershipType })
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="単独" id="single" />
                    <Label htmlFor="single" className="cursor-pointer">
                      単独名義
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="共有" id="joint" />
                    <Label htmlFor="joint" className="cursor-pointer">
                      共有名義
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Main Person */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    氏名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="山田 太郎"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameKana">フリガナ</Label>
                  <Input
                    id="nameKana"
                    value={formData.nameKana}
                    onChange={(e) =>
                      setFormData({ ...formData, nameKana: e.target.value })
                    }
                    placeholder="ヤマダ タロウ"
                  />
                </div>
              </div>

              {/* Partner (for joint ownership) */}
              {formData.ownershipType === '共有' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl">
                  <div className="space-y-2">
                    <Label htmlFor="partnerName">
                      パートナー氏名
                    </Label>
                    <Input
                      id="partnerName"
                      value={formData.partnerName}
                      onChange={(e) =>
                        setFormData({ ...formData, partnerName: e.target.value })
                      }
                      placeholder="山田 花子"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerNameKana">パートナーフリガナ</Label>
                    <Input
                      id="partnerNameKana"
                      value={formData.partnerNameKana}
                      onChange={(e) =>
                        setFormData({ ...formData, partnerNameKana: e.target.value })
                      }
                      placeholder="ヤマダ ハナコ"
                    />
                  </div>
                </div>
              )}

              {/* Tei Name Preview */}
              {formData.name && (
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                  <Home className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">邸名（自動生成）</p>
                    <p className="text-lg font-bold text-gray-900">{getTeiName()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Phone className="w-5 h-5 mr-2 text-orange-500" />
                連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="090-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="大阪府大阪市北区梅田1-1-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 備考 */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-lg">備考・メモ</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="初回問い合わせ内容、お客様の関心事項などを記入..."
                rows={4}
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
              disabled={isLoading || !formData.name || !formData.leadSource}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  登録中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  反響を登録
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
