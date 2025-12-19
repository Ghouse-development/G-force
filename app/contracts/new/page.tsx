'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowLeft,
  Save,
  FileSignature,
  User,
  Users,
  Home,
  Wallet,
  CreditCard,
  Shield,
  Building,
  FileText,
  Info,
  Calculator,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useContractStore } from '@/store'
import { useAuthStore, useCustomerStore } from '@/store'
import { PRODUCT_LIST, IDENTITY_DOC_TYPES, LOAN_TYPES } from '@/types/database'
import type { OwnershipType } from '@/types/database'

function NewContractForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { addContract } = useContractStore()
  const { user } = useAuthStore()
  const { customers } = useCustomerStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState({
    // 基本情報
    customer_id: searchParams.get('customer') || '',
    tei_name: '',
    customer_name: '',
    partner_name: '',
    ownership_type: '単独' as OwnershipType,
    contract_date: '',
    // 担当者
    sales_person: user?.name || '',
    design_person: '',
    construction_person: '',
    ic_person: '',
    // 物件情報
    land_address: '',
    land_area: '',
    building_area: '',
    product_name: '',
    // 金額情報
    building_price: '',
    option_price: '',
    exterior_price: '',
    other_price: '',
    discount_amount: '',
    // 支払条件
    payment_at_contract: '',
    payment_at_start: '',
    payment_at_frame: '',
    payment_at_completion: '',
    // 本人確認
    identity_verified: false,
    identity_doc_type: '',
    identity_verified_date: '',
    // ローン
    loan_type: '',
    loan_bank: '',
    loan_amount: '',
    loan_approved: false,
    loan_approved_date: '',
    // 重要事項
    important_notes: '',
    important_notes_date: '',
    // 指定承認者
    designated_checker_id: '',
    designated_checker_name: '',
    designated_approver_id: '',
    designated_approver_name: '',
    // 備考
    notes: '',
  })

  // 顧客選択時に自動入力
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        tei_name: customer.tei_name || '',
        customer_name: customer.name,
        partner_name: customer.partner_name || '',
        ownership_type: customer.ownership_type || '単独',
        land_address: customer.address || '',
        land_area: customer.land_area?.toString() || '',
        building_area: customer.building_area?.toString() || '',
      }))
    } else {
      setFormData(prev => ({ ...prev, customer_id: customerId }))
    }
  }

  // 金額計算
  const calculateTotal = () => {
    const building = parseFloat(formData.building_price) || 0
    const option = parseFloat(formData.option_price) || 0
    const exterior = parseFloat(formData.exterior_price) || 0
    const other = parseFloat(formData.other_price) || 0
    const discount = parseFloat(formData.discount_amount) || 0
    const subtotal = building + option + exterior + other - discount
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const { subtotal, tax, total } = calculateTotal()

  // 支払合計チェック
  const paymentTotal = () => {
    return (
      (parseFloat(formData.payment_at_contract) || 0) +
      (parseFloat(formData.payment_at_start) || 0) +
      (parseFloat(formData.payment_at_frame) || 0) +
      (parseFloat(formData.payment_at_completion) || 0)
    )
  }

  // バリデーション関数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必須フィールド
    if (!formData.customer_id && !formData.customer_name.trim()) {
      newErrors.customer_name = '顧客を選択するか、顧客名を入力してください'
    }
    if (!formData.tei_name.trim()) {
      newErrors.tei_name = '邸名は必須です'
    }
    if (!formData.contract_date) {
      newErrors.contract_date = '契約日は必須です'
    }
    if (!formData.building_price) {
      newErrors.building_price = '建物本体価格は必須です'
    }

    // 金額の整合性チェック
    const { total } = calculateTotal()
    const payments = paymentTotal()
    if (total > 0 && payments > 0 && payments !== total) {
      newErrors.payment_total = `支払合計（¥${payments.toLocaleString()}）が契約総額（¥${total.toLocaleString()}）と一致しません`
    }

    // 本人確認の整合性
    if (formData.identity_verified && !formData.identity_doc_type) {
      newErrors.identity_doc_type = '本人確認済みの場合、確認書類を選択してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フィールドのブラー時にtouchedを更新
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 全フィールドをtouched状態に
    setTouched({
      customer_name: true,
      tei_name: true,
      contract_date: true,
      building_price: true,
      payment_total: true,
      identity_doc_type: true,
    })

    // バリデーション
    if (!validateForm()) {
      toast.error('入力内容に不備があります。赤枠の項目を確認してください。')
      return
    }

    setIsLoading(true)

    try {
      const { subtotal, tax, total } = calculateTotal()

      const id = addContract({
        customer_id: formData.customer_id || `temp-${Date.now()}`,
        fund_plan_id: null,
        status: '作成中',
        contract_number: null,
        contract_date: formData.contract_date || null,
        tei_name: formData.tei_name,
        customer_name: formData.customer_name,
        partner_name: formData.partner_name || null,
        ownership_type: formData.ownership_type,
        sales_person: formData.sales_person || null,
        design_person: formData.design_person || null,
        construction_person: formData.construction_person || null,
        ic_person: formData.ic_person || null,
        land_address: formData.land_address || null,
        land_area: parseFloat(formData.land_area) || null,
        building_area: parseFloat(formData.building_area) || null,
        product_name: formData.product_name || null,
        building_price: parseFloat(formData.building_price) || null,
        option_price: parseFloat(formData.option_price) || null,
        exterior_price: parseFloat(formData.exterior_price) || null,
        other_price: parseFloat(formData.other_price) || null,
        discount_amount: parseFloat(formData.discount_amount) || null,
        tax_amount: tax || null,
        total_amount: total || null,
        payment_at_contract: parseFloat(formData.payment_at_contract) || null,
        payment_at_start: parseFloat(formData.payment_at_start) || null,
        payment_at_frame: parseFloat(formData.payment_at_frame) || null,
        payment_at_completion: parseFloat(formData.payment_at_completion) || null,
        identity_verified: formData.identity_verified,
        identity_doc_type: formData.identity_doc_type || null,
        identity_verified_date: formData.identity_verified_date || null,
        identity_verified_by: formData.identity_verified ? (user?.name || null) : null,
        loan_type: formData.loan_type || null,
        loan_bank: formData.loan_bank || null,
        loan_amount: parseFloat(formData.loan_amount) || null,
        loan_approved: formData.loan_approved,
        loan_approved_date: formData.loan_approved_date || null,
        important_notes: formData.important_notes || null,
        important_notes_date: formData.important_notes_date || null,
        attachments: null,
        created_by: user?.id || null,
        created_by_name: user?.name || null,
        checked_by: null,
        checked_by_name: null,
        checked_at: null,
        check_comment: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null,
        returned_by: null,
        returned_by_name: null,
        returned_at: null,
        return_comment: null,
        designated_checker_id: formData.designated_checker_id || null,
        designated_checker_name: formData.designated_checker_name || null,
        designated_approver_id: formData.designated_approver_id || null,
        designated_approver_name: formData.designated_approver_name || null,
        notes: formData.notes || null,
      })

      toast.success('契約書を作成しました')
      router.push(`/contracts/${id}`)
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">契約書 新規作成</h1>
          <p className="text-gray-500">請負契約書の作成（kintone承認フロー対応）</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Accordion type="multiple" defaultValue={['basic', 'amount', 'payment']} className="space-y-4">
          {/* 基本情報 */}
          <AccordionItem value="basic" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <FileSignature className="w-5 h-5 mr-2 text-orange-500" />
                  基本情報
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customers.length > 0 && (
                      <div className="space-y-2">
                        <Label>顧客選択</Label>
                        <Select
                          value={formData.customer_id}
                          onValueChange={handleCustomerChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="顧客を選択（または下記で直接入力）" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.tei_name || customer.name} ({customer.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>契約日 <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={formData.contract_date}
                        onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                        onBlur={() => handleBlur('contract_date')}
                        className={touched.contract_date && errors.contract_date ? 'border-red-500' : ''}
                      />
                      {touched.contract_date && errors.contract_date && (
                        <p className="text-xs text-red-500">{errors.contract_date}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>邸名 <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.tei_name}
                        onChange={(e) => setFormData({ ...formData, tei_name: e.target.value })}
                        onBlur={() => handleBlur('tei_name')}
                        placeholder="例: 山田様邸"
                        className={touched.tei_name && errors.tei_name ? 'border-red-500' : ''}
                        required
                      />
                      {touched.tei_name && errors.tei_name && (
                        <p className="text-xs text-red-500">{errors.tei_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>契約者名 {!formData.customer_id && <span className="text-red-500">*</span>}</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        onBlur={() => handleBlur('customer_name')}
                        placeholder="例: 山田 太郎"
                        className={touched.customer_name && errors.customer_name ? 'border-red-500' : ''}
                      />
                      {touched.customer_name && errors.customer_name && (
                        <p className="text-xs text-red-500">{errors.customer_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>共有者名</Label>
                      <Input
                        value={formData.partner_name}
                        onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                        placeholder="例: 山田 花子"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>名義</Label>
                    <Select
                      value={formData.ownership_type}
                      onValueChange={(value: OwnershipType) => setFormData({ ...formData, ownership_type: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="単独">単独</SelectItem>
                        <SelectItem value="共有">共有</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 担当者情報 */}
          <AccordionItem value="staff" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  担当者情報
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>営業担当</Label>
                      <Input
                        value={formData.sales_person}
                        onChange={(e) => setFormData({ ...formData, sales_person: e.target.value })}
                        placeholder="営業担当者名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>設計担当</Label>
                      <Input
                        value={formData.design_person}
                        onChange={(e) => setFormData({ ...formData, design_person: e.target.value })}
                        placeholder="設計担当者名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>工事担当</Label>
                      <Input
                        value={formData.construction_person}
                        onChange={(e) => setFormData({ ...formData, construction_person: e.target.value })}
                        placeholder="工事担当者名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IC担当</Label>
                      <Input
                        value={formData.ic_person}
                        onChange={(e) => setFormData({ ...formData, ic_person: e.target.value })}
                        placeholder="IC担当者名"
                      />
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 物件情報 */}
          <AccordionItem value="property" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Home className="w-5 h-5 mr-2 text-orange-500" />
                  物件情報
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-2">
                    <Label>建築地住所</Label>
                    <Input
                      value={formData.land_address}
                      onChange={(e) => setFormData({ ...formData, land_address: e.target.value })}
                      placeholder="例: 東京都世田谷区〇〇1-2-3"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>土地面積（坪）</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.land_area}
                        onChange={(e) => setFormData({ ...formData, land_area: e.target.value })}
                        placeholder="例: 50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>建物面積（坪）</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.building_area}
                        onChange={(e) => setFormData({ ...formData, building_area: e.target.value })}
                        placeholder="例: 35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>商品名</Label>
                      <Select
                        value={formData.product_name}
                        onValueChange={(value) => setFormData({ ...formData, product_name: value })}
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
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 金額情報 */}
          <AccordionItem value="amount" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                  見積・金額情報
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>建物本体価格 <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={formData.building_price}
                        onChange={(e) => setFormData({ ...formData, building_price: e.target.value })}
                        onBlur={() => handleBlur('building_price')}
                        placeholder="例: 35000000"
                        className={touched.building_price && errors.building_price ? 'border-red-500' : ''}
                      />
                      {touched.building_price && errors.building_price && (
                        <p className="text-xs text-red-500">{errors.building_price}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>オプション価格</Label>
                      <Input
                        type="number"
                        value={formData.option_price}
                        onChange={(e) => setFormData({ ...formData, option_price: e.target.value })}
                        placeholder="例: 2000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>外構価格</Label>
                      <Input
                        type="number"
                        value={formData.exterior_price}
                        onChange={(e) => setFormData({ ...formData, exterior_price: e.target.value })}
                        placeholder="例: 1500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>その他費用</Label>
                      <Input
                        type="number"
                        value={formData.other_price}
                        onChange={(e) => setFormData({ ...formData, other_price: e.target.value })}
                        placeholder="例: 500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>値引額</Label>
                      <Input
                        type="number"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        placeholder="例: 1000000"
                      />
                    </div>
                  </div>

                  {/* 自動計算結果 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calculator className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">自動計算</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">小計（税抜）</p>
                        <p className="font-bold">¥{subtotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">消費税（10%）</p>
                        <p className="font-bold">¥{tax.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-2">
                        <p className="text-xs text-gray-500">合計（税込）</p>
                        <p className="font-bold text-lg text-orange-600">¥{total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 支払条件 */}
          <AccordionItem value="payment" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="w-5 h-5 mr-2 text-orange-500" />
                  支払条件
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>契約時金</Label>
                      <Input
                        type="number"
                        value={formData.payment_at_contract}
                        onChange={(e) => setFormData({ ...formData, payment_at_contract: e.target.value })}
                        placeholder="例: 5000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>着工時金</Label>
                      <Input
                        type="number"
                        value={formData.payment_at_start}
                        onChange={(e) => setFormData({ ...formData, payment_at_start: e.target.value })}
                        placeholder="例: 10000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>上棟時金</Label>
                      <Input
                        type="number"
                        value={formData.payment_at_frame}
                        onChange={(e) => setFormData({ ...formData, payment_at_frame: e.target.value })}
                        placeholder="例: 15000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>完了時金</Label>
                      <Input
                        type="number"
                        value={formData.payment_at_completion}
                        onChange={(e) => setFormData({ ...formData, payment_at_completion: e.target.value })}
                        placeholder="残額"
                      />
                    </div>
                  </div>
                  <div className={`rounded-lg p-4 ${errors.payment_total ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">支払合計</span>
                      <span className={`font-bold ${paymentTotal() === total ? 'text-green-600' : 'text-red-600'}`}>
                        ¥{paymentTotal().toLocaleString()}
                        {paymentTotal() !== total && total > 0 && (
                          <span className="text-xs ml-2">
                            （差額: ¥{(total - paymentTotal()).toLocaleString()}）
                          </span>
                        )}
                      </span>
                    </div>
                    {errors.payment_total && (
                      <p className="text-xs text-red-500 mt-2">{errors.payment_total}</p>
                    )}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 本人確認 */}
          <AccordionItem value="identity" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2 text-orange-500" />
                  本人確認
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={formData.identity_verified}
                      onCheckedChange={(checked) => setFormData({ ...formData, identity_verified: checked })}
                    />
                    <Label>本人確認済み</Label>
                  </div>
                  {formData.identity_verified && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>確認書類</Label>
                        <Select
                          value={formData.identity_doc_type}
                          onValueChange={(value) => setFormData({ ...formData, identity_doc_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="書類を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {IDENTITY_DOC_TYPES.map((doc) => (
                              <SelectItem key={doc.value} value={doc.value}>
                                {doc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>確認日</Label>
                        <Input
                          type="date"
                          value={formData.identity_verified_date}
                          onChange={(e) => setFormData({ ...formData, identity_verified_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 住宅ローン */}
          <AccordionItem value="loan" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Building className="w-5 h-5 mr-2 text-orange-500" />
                  住宅ローン
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>ローン種類</Label>
                      <Select
                        value={formData.loan_type}
                        onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map((loan) => (
                            <SelectItem key={loan.value} value={loan.value}>
                              {loan.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>金融機関</Label>
                      <Input
                        value={formData.loan_bank}
                        onChange={(e) => setFormData({ ...formData, loan_bank: e.target.value })}
                        placeholder="例: みずほ銀行"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>借入額</Label>
                      <Input
                        type="number"
                        value={formData.loan_amount}
                        onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                        placeholder="例: 35000000"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={formData.loan_approved}
                      onCheckedChange={(checked) => setFormData({ ...formData, loan_approved: checked })}
                    />
                    <Label>ローン承認済み</Label>
                    {formData.loan_approved && (
                      <Input
                        type="date"
                        value={formData.loan_approved_date}
                        onChange={(e) => setFormData({ ...formData, loan_approved_date: e.target.value })}
                        className="w-[180px]"
                      />
                    )}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 重要事項説明 */}
          <AccordionItem value="important" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-orange-500" />
                  重要事項説明
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>説明状況</Label>
                      <Select
                        value={formData.important_notes}
                        onValueChange={(value) => setFormData({ ...formData, important_notes: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">未実施</SelectItem>
                          <SelectItem value="説明済">説明済</SelectItem>
                          <SelectItem value="説明予定">説明予定</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.important_notes === '説明済' && (
                      <div className="space-y-2">
                        <Label>説明日</Label>
                        <Input
                          type="date"
                          value={formData.important_notes_date}
                          onChange={(e) => setFormData({ ...formData, important_notes_date: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 承認者指定 */}
          <AccordionItem value="approver" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <UserCheck className="w-5 h-5 mr-2 text-orange-500" />
                  承認者指定（任意）
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    承認者を事前に指定できます。指定しない場合は、ロールに基づいて自動的に承認権限が割り当てられます。
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>書類確認者（書類確認ステップ）</Label>
                      <Input
                        value={formData.designated_checker_name}
                        onChange={(e) => setFormData({ ...formData, designated_checker_name: e.target.value })}
                        placeholder="例: 事務 太郎"
                      />
                      <p className="text-xs text-gray-500">書類確認を行う担当者を指定</p>
                    </div>
                    <div className="space-y-2">
                      <Label>上長承認者（上長承認ステップ）</Label>
                      <Input
                        value={formData.designated_approver_name}
                        onChange={(e) => setFormData({ ...formData, designated_approver_name: e.target.value })}
                        placeholder="例: 部長 花子"
                      />
                      <p className="text-xs text-gray-500">最終承認を行う上長を指定</p>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* 備考 */}
          <AccordionItem value="notes" className="border-0 shadow-lg rounded-lg overflow-hidden">
            <Card className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardTitle className="flex items-center text-lg">
                  <Info className="w-5 h-5 mr-2 text-orange-500" />
                  備考・特記事項
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="契約に関する特記事項を記入してください..."
                    rows={5}
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
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
