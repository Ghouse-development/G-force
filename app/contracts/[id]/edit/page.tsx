'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Save,
  FileSignature,
  Users,
  Home,
  Wallet,
  CreditCard,
  Shield,
  Building,
  FileText,
  Info,
  Calculator,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useContractStore, type StoredContract } from '@/store'
import { useAuthStore, useCustomerStore } from '@/store'
import { PRODUCT_LIST, IDENTITY_DOC_TYPES, LOAN_TYPES, CONTRACT_STATUS_CONFIG } from '@/types/database'
import type { OwnershipType, ContractStatus } from '@/types/database'

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { getContract, updateContract, deleteContract } = useContractStore()
  const { user } = useAuthStore()
  const { customers } = useCustomerStore()

  const contract = mounted ? getContract(resolvedParams.id) : null

  const [formData, setFormData] = useState({
    customer_id: '',
    tei_name: '',
    customer_name: '',
    partner_name: '',
    ownership_type: '単独' as OwnershipType,
    contract_date: '',
    sales_person: '',
    design_person: '',
    construction_person: '',
    ic_person: '',
    land_address: '',
    land_area: '',
    building_area: '',
    product_name: '',
    building_price: '',
    option_price: '',
    exterior_price: '',
    other_price: '',
    discount_amount: '',
    payment_at_contract: '',
    payment_at_start: '',
    payment_at_frame: '',
    payment_at_completion: '',
    identity_verified: false,
    identity_doc_type: '',
    identity_verified_date: '',
    loan_type: '',
    loan_bank: '',
    loan_amount: '',
    loan_approved: false,
    loan_approved_date: '',
    important_notes: '',
    important_notes_date: '',
    notes: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // 契約データをフォームに反映
  useEffect(() => {
    if (contract) {
      setFormData({
        customer_id: contract.customer_id || '',
        tei_name: contract.tei_name || '',
        customer_name: contract.customer_name || '',
        partner_name: contract.partner_name || '',
        ownership_type: contract.ownership_type || '単独',
        contract_date: contract.contract_date || '',
        sales_person: contract.sales_person || '',
        design_person: contract.design_person || '',
        construction_person: contract.construction_person || '',
        ic_person: contract.ic_person || '',
        land_address: contract.land_address || '',
        land_area: contract.land_area?.toString() || '',
        building_area: contract.building_area?.toString() || '',
        product_name: contract.product_name || '',
        building_price: contract.building_price?.toString() || '',
        option_price: contract.option_price?.toString() || '',
        exterior_price: contract.exterior_price?.toString() || '',
        other_price: contract.other_price?.toString() || '',
        discount_amount: contract.discount_amount?.toString() || '',
        payment_at_contract: contract.payment_at_contract?.toString() || '',
        payment_at_start: contract.payment_at_start?.toString() || '',
        payment_at_frame: contract.payment_at_frame?.toString() || '',
        payment_at_completion: contract.payment_at_completion?.toString() || '',
        identity_verified: contract.identity_verified || false,
        identity_doc_type: contract.identity_doc_type || '',
        identity_verified_date: contract.identity_verified_date || '',
        loan_type: contract.loan_type || '',
        loan_bank: contract.loan_bank || '',
        loan_amount: contract.loan_amount?.toString() || '',
        loan_approved: contract.loan_approved || false,
        loan_approved_date: contract.loan_approved_date || '',
        important_notes: contract.important_notes || '',
        important_notes_date: contract.important_notes_date || '',
        notes: contract.notes || '',
      })
    }
  }, [contract])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract) return

    if (!formData.tei_name) {
      toast.error('邸名を入力してください')
      return
    }

    setIsLoading(true)

    try {
      const { tax, total } = calculateTotal()

      updateContract(contract.id, {
        customer_id: formData.customer_id || contract.customer_id,
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
        identity_verified_by: formData.identity_verified ? (user?.name || contract.identity_verified_by) : null,
        loan_type: formData.loan_type || null,
        loan_bank: formData.loan_bank || null,
        loan_amount: parseFloat(formData.loan_amount) || null,
        loan_approved: formData.loan_approved,
        loan_approved_date: formData.loan_approved_date || null,
        important_notes: formData.important_notes || null,
        important_notes_date: formData.important_notes_date || null,
        notes: formData.notes || null,
      })

      toast.success('契約書を更新しました')
      router.push(`/contracts/${contract.id}`)
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = () => {
    if (!contract) return
    deleteContract(contract.id)
    toast.success('契約書を削除しました')
    router.push('/contracts')
  }

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <FileSignature className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">契約書が見つかりません</p>
              <Link href="/contracts">
                <Button className="mt-4" variant="outline">
                  一覧に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  // 編集可能なステータスかチェック
  const isEditable = contract.status === '作成中'
  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status]

  if (!isEditable) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">編集できません</h2>
              <p className="text-gray-500 mb-4">
                ステータスが「{statusConfig.label}」の契約書は編集できません。
              </p>
              <p className="text-gray-400 text-sm mb-6">
                編集するには差戻しが必要です。
              </p>
              <Link href={`/contracts/${contract.id}`}>
                <Button variant="outline">
                  詳細に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">契約書 編集</h1>
                <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                  {statusConfig.label}
                </Badge>
                {contract.contract_number && (
                  <span className="text-gray-500 text-sm">{contract.contract_number}</span>
                )}
              </div>
              <p className="text-gray-500">{contract.tei_name}</p>
            </div>
          </div>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>契約書を削除</AlertDialogTitle>
                <AlertDialogDescription>
                  この契約書を削除しますか？この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                      <div className="space-y-2">
                        <Label>契約日</Label>
                        <Input
                          type="date"
                          value={formData.contract_date}
                          onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>邸名 <span className="text-red-500">*</span></Label>
                        <Input
                          value={formData.tei_name}
                          onChange={(e) => setFormData({ ...formData, tei_name: e.target.value })}
                          placeholder="例: 山田様邸"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>契約者名</Label>
                        <Input
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>共有者名</Label>
                        <Input
                          value={formData.partner_name}
                          onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>設計担当</Label>
                        <Input
                          value={formData.design_person}
                          onChange={(e) => setFormData({ ...formData, design_person: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>工事担当</Label>
                        <Input
                          value={formData.construction_person}
                          onChange={(e) => setFormData({ ...formData, construction_person: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IC担当</Label>
                        <Input
                          value={formData.ic_person}
                          onChange={(e) => setFormData({ ...formData, ic_person: e.target.value })}
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>建物面積（坪）</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.building_area}
                          onChange={(e) => setFormData({ ...formData, building_area: e.target.value })}
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
                        <Label>建物本体価格</Label>
                        <Input
                          type="number"
                          value={formData.building_price}
                          onChange={(e) => setFormData({ ...formData, building_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>オプション価格</Label>
                        <Input
                          type="number"
                          value={formData.option_price}
                          onChange={(e) => setFormData({ ...formData, option_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>外構価格</Label>
                        <Input
                          type="number"
                          value={formData.exterior_price}
                          onChange={(e) => setFormData({ ...formData, exterior_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>その他費用</Label>
                        <Input
                          type="number"
                          value={formData.other_price}
                          onChange={(e) => setFormData({ ...formData, other_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>値引額</Label>
                        <Input
                          type="number"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>着工時金</Label>
                        <Input
                          type="number"
                          value={formData.payment_at_start}
                          onChange={(e) => setFormData({ ...formData, payment_at_start: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>上棟時金</Label>
                        <Input
                          type="number"
                          value={formData.payment_at_frame}
                          onChange={(e) => setFormData({ ...formData, payment_at_frame: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>完了時金</Label>
                        <Input
                          type="number"
                          value={formData.payment_at_completion}
                          onChange={(e) => setFormData({ ...formData, payment_at_completion: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>借入額</Label>
                        <Input
                          type="number"
                          value={formData.loan_amount}
                          onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
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
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  変更を保存
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
