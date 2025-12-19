'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  RotateCcw,
  Check,
  Landmark,
  CreditCard,
  Route,
  UserCheck,
  Home,
  MapPin,
  Wallet,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  useMasterDataStore,
  MasterDataType,
  MasterDataItem,
} from '@/store/master-data-store'
import { cn } from '@/lib/utils'

// アイコンマッピング
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  CreditCard,
  Route,
  UserCheck,
  Home,
  MapPin,
  Wallet,
}

export default function MasterDataPage() {
  const router = useRouter()
  const { masterData, addItem, updateItem, deleteItem, resetToDefaults } = useMasterDataStore()

  const [selectedType, setSelectedType] = useState<MasterDataType>('banks')
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [resetConfirmType, setResetConfirmType] = useState<MasterDataType | null>(null)

  // 新規追加フォーム
  const [newItem, setNewItem] = useState({
    code: '',
    label: '',
    description: '',
    isActive: true,
  })

  const currentData = masterData[selectedType]
  const sortedItems = [...currentData.items].sort((a, b) => a.sortOrder - b.sortOrder)
  const Icon = iconMap[currentData.icon] || Database

  const handleAdd = () => {
    if (!newItem.code || !newItem.label) {
      toast.error('コードと表示名は必須です')
      return
    }

    // コード重複チェック
    if (currentData.items.some((item) => item.code === newItem.code)) {
      toast.error('このコードは既に使用されています')
      return
    }

    addItem(selectedType, {
      code: newItem.code,
      label: newItem.label,
      description: newItem.description || undefined,
      isActive: newItem.isActive,
    })

    setNewItem({ code: '', label: '', description: '', isActive: true })
    setIsAddDialogOpen(false)
    toast.success('項目を追加しました')
  }

  const handleEdit = () => {
    if (!editingItem) return

    updateItem(selectedType, editingItem.id, {
      label: editingItem.label,
      description: editingItem.description,
      isActive: editingItem.isActive,
    })

    setEditingItem(null)
    setIsEditDialogOpen(false)
    toast.success('項目を更新しました')
  }

  const handleDelete = (id: string) => {
    deleteItem(selectedType, id)
    setDeleteConfirmId(null)
    toast.success('項目を削除しました')
  }

  const handleReset = (type: MasterDataType) => {
    resetToDefaults(type)
    setResetConfirmType(null)
    toast.success('初期値にリセットしました')
  }

  const handleToggleActive = (item: MasterDataItem) => {
    updateItem(selectedType, item.id, { isActive: !item.isActive })
    toast.success(item.isActive ? '無効にしました' : '有効にしました')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            管理画面へ戻る
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">マスターデータ管理</h1>
            <p className="text-gray-500">選択肢やマスターデータを管理します</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* カテゴリ一覧 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">データカテゴリ</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(Object.keys(masterData) as MasterDataType[]).map((type) => {
                    const data = masterData[type]
                    const TypeIcon = iconMap[data.icon] || Database
                    const activeCount = data.items.filter((i) => i.isActive).length

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 text-left transition-colors',
                          selectedType === type
                            ? 'bg-orange-50 border-l-4 border-orange-500'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <TypeIcon
                          className={cn(
                            'h-5 w-5',
                            selectedType === type ? 'text-orange-500' : 'text-gray-400'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium truncate',
                              selectedType === type ? 'text-orange-700' : 'text-gray-700'
                            )}
                          >
                            {data.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activeCount}/{data.items.length} 有効
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 選択中のデータ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-orange-500" />
                    <div>
                      <CardTitle>{currentData.name}</CardTitle>
                      <CardDescription>{currentData.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetConfirmType(selectedType)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      リセット
                    </Button>
                    {currentData.allowAdd && (
                      <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 権限表示 */}
                <div className="flex gap-2 mb-4">
                  <Badge variant={currentData.allowAdd ? 'default' : 'secondary'}>
                    追加: {currentData.allowAdd ? '可' : '不可'}
                  </Badge>
                  <Badge variant={currentData.allowEdit ? 'default' : 'secondary'}>
                    編集: {currentData.allowEdit ? '可' : '不可'}
                  </Badge>
                  <Badge variant={currentData.allowDelete ? 'default' : 'secondary'}>
                    削除: {currentData.allowDelete ? '可' : '不可'}
                  </Badge>
                </div>

                {/* 項目一覧 */}
                <div className="border rounded-lg divide-y">
                  {sortedItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      項目がありません
                    </div>
                  ) : (
                    sortedItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-4 p-4',
                          !item.isActive && 'bg-gray-50 opacity-60'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.label}</p>
                            {item.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                デフォルト
                              </Badge>
                            )}
                            {!item.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                無効
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            コード: {item.code}
                            {item.description && ` | ${item.description}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => handleToggleActive(item)}
                            disabled={!currentData.allowEdit}
                          />

                          {currentData.allowEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingItem(item)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          {currentData.allowDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteConfirmId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>項目を追加</DialogTitle>
            <DialogDescription>
              {currentData.name}に新しい項目を追加します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>コード（半角英数字）</Label>
              <Input
                value={newItem.code}
                onChange={(e) =>
                  setNewItem({ ...newItem, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                }
                placeholder="例: new_item"
              />
              <p className="text-xs text-gray-500">
                システム内部で使用するコードです。後から変更できません。
              </p>
            </div>
            <div className="space-y-2">
              <Label>表示名</Label>
              <Input
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                placeholder="例: 新しい項目"
              />
            </div>
            <div className="space-y-2">
              <Label>説明（任意）</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="項目の説明を入力..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newItem.isActive}
                onCheckedChange={(checked) => setNewItem({ ...newItem, isActive: checked })}
              />
              <Label>有効にする</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>項目を編集</DialogTitle>
            <DialogDescription>
              項目の表示名や説明を編集できます
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>コード</Label>
                <Input value={editingItem.code} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500">コードは変更できません</p>
              </div>
              <div className="space-y-2">
                <Label>表示名</Label>
                <Input
                  value={editingItem.label}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>説明（任意）</Label>
                <Textarea
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingItem.isActive}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, isActive: checked })
                  }
                />
                <Label>有効</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEdit}>
              <Check className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>項目を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。この項目を使用しているデータに影響が出る可能性があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* リセット確認 */}
      <AlertDialog
        open={!!resetConfirmType}
        onOpenChange={() => setResetConfirmType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>初期値にリセットしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              すべての変更が失われ、システムの初期値に戻ります。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => resetConfirmType && handleReset(resetConfirmType)}
            >
              リセット
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
