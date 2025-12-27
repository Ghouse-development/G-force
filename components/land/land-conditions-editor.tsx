'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  DollarSign,
  Ruler,
  Train,
  School,
  ShoppingCart,
  Building,
  CornerUpRight,
  Layers,
  Star,
  Save,
  RefreshCw,
  X,
  Plus,
} from 'lucide-react'
import type { LandSearchConditions } from '@/lib/land/land-conditions'
import { useLandStore } from '@/store/land-store'

interface LandConditionsEditorProps {
  customerId: string
  customerName: string
  onSave?: (conditions: LandSearchConditions) => void
  onClose?: () => void
}

export function LandConditionsEditor({
  customerId,
  customerName,
  onSave,
  onClose,
}: LandConditionsEditorProps) {
  const { getConditionsByCustomer, setConditions, createConditionsForCustomer } = useLandStore()

  const [conditions, setLocalConditions] = useState<LandSearchConditions | null>(null)
  const [newArea, setNewArea] = useState('')
  const [newExcludedArea, setNewExcludedArea] = useState('')

  useEffect(() => {
    let existing = getConditionsByCustomer(customerId)
    if (!existing) {
      existing = createConditionsForCustomer(customerId)
    }
    setLocalConditions(existing)
  }, [customerId, getConditionsByCustomer, createConditionsForCustomer])

  if (!conditions) {
    return <div className="p-4">読み込み中...</div>
  }

  const handleSave = () => {
    const updated = {
      ...conditions,
      lastUpdatedFrom: 'manual' as const,
      lastUpdatedAt: new Date().toISOString(),
    }
    setConditions(updated)
    onSave?.(updated)
  }

  const updateField = <K extends keyof LandSearchConditions>(
    field: K,
    value: LandSearchConditions[K]
  ) => {
    setLocalConditions(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const addArea = () => {
    if (newArea.trim()) {
      updateField('desiredAreas', [...conditions.desiredAreas, newArea.trim()])
      setNewArea('')
    }
  }

  const removeArea = (area: string) => {
    updateField('desiredAreas', conditions.desiredAreas.filter(a => a !== area))
  }

  const addExcludedArea = () => {
    if (newExcludedArea.trim()) {
      updateField('excludedAreas', [...conditions.excludedAreas, newExcludedArea.trim()])
      setNewExcludedArea('')
    }
  }

  const removeExcludedArea = (area: string) => {
    updateField('excludedAreas', conditions.excludedAreas.filter(a => a !== area))
  }

  const updatePriority = (key: keyof LandSearchConditions['priorities'], value: number) => {
    updateField('priorities', { ...conditions.priorities, [key]: value })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            土地探し条件 - {customerName}様
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {conditions.lastUpdatedFrom === 'manual' ? '手動入力' :
               conditions.lastUpdatedFrom === 'hearing_sheet' ? 'ヒアリング' :
               conditions.lastUpdatedFrom === 'reception' ? '受付台帳' : '商談'}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* エリア条件 */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            希望エリア
          </Label>
          <div className="flex flex-wrap gap-2">
            {conditions.desiredAreas.map(area => (
              <Badge key={area} variant="secondary" className="gap-1">
                {area}
                <button onClick={() => removeArea(area)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="エリア名を入力"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addArea()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addArea}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            除外エリア
          </Label>
          <div className="flex flex-wrap gap-2">
            {conditions.excludedAreas.map(area => (
              <Badge key={area} variant="destructive" className="gap-1">
                {area}
                <button onClick={() => removeExcludedArea(area)} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="除外エリア"
              value={newExcludedArea}
              onChange={(e) => setNewExcludedArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExcludedArea()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addExcludedArea}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 価格条件 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4" />
              予算下限（万円）
            </Label>
            <Input
              type="number"
              placeholder="例: 1000"
              value={conditions.minPrice || ''}
              onChange={(e) => updateField('minPrice', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              予算上限（万円）
            </Label>
            <Input
              type="number"
              placeholder="例: 2000"
              value={conditions.maxPrice || ''}
              onChange={(e) => updateField('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        {/* 面積条件 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Ruler className="w-4 h-4" />
              最小面積（坪）
            </Label>
            <Input
              type="number"
              placeholder="例: 40"
              value={conditions.minLandArea || ''}
              onChange={(e) => updateField('minLandArea', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">希望面積（坪）</Label>
            <Input
              type="number"
              placeholder="例: 50"
              value={conditions.preferredLandArea || ''}
              onChange={(e) => updateField('preferredLandArea', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">最大面積（坪）</Label>
            <Input
              type="number"
              placeholder="例: 70"
              value={conditions.maxLandArea || ''}
              onChange={(e) => updateField('maxLandArea', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        {/* アクセス条件 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Train className="w-4 h-4" />
              駅徒歩（分以内）
            </Label>
            <Input
              type="number"
              placeholder="例: 15"
              value={conditions.stationDistance || ''}
              onChange={(e) => updateField('stationDistance', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <School className="w-4 h-4" />
              学校（分以内）
            </Label>
            <Input
              type="number"
              placeholder="例: 10"
              value={conditions.schoolDistance || ''}
              onChange={(e) => updateField('schoolDistance', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4" />
              スーパー（分以内）
            </Label>
            <Input
              type="number"
              placeholder="例: 10"
              value={conditions.supermarketDistance || ''}
              onChange={(e) => updateField('supermarketDistance', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4" />
              病院（分以内）
            </Label>
            <Input
              type="number"
              placeholder="例: 15"
              value={conditions.hospitalDistance || ''}
              onChange={(e) => updateField('hospitalDistance', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        {/* 道路・土地条件 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4" />
              前面道路幅員（m以上）
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="例: 4.0"
              value={conditions.roadWidth || ''}
              onChange={(e) => updateField('roadWidth', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <CornerUpRight className="w-4 h-4" />
              角地希望
            </Label>
            <Select
              value={conditions.cornerLot === null ? 'any' : conditions.cornerLot ? 'yes' : 'no'}
              onValueChange={(v) => updateField('cornerLot', v === 'any' ? null : v === 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">指定なし</SelectItem>
                <SelectItem value="yes">角地希望</SelectItem>
                <SelectItem value="no">角地でなくてよい</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">新規分譲地</Label>
            <Select
              value={conditions.newDevelopment === null ? 'any' : conditions.newDevelopment ? 'yes' : 'no'}
              onValueChange={(v) => updateField('newDevelopment', v === 'any' ? null : v === 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">指定なし</SelectItem>
                <SelectItem value="yes">新規分譲地希望</SelectItem>
                <SelectItem value="no">分譲地でなくてよい</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">平坦地</Label>
            <Select
              value={conditions.flatLand === null ? 'any' : conditions.flatLand ? 'yes' : 'no'}
              onValueChange={(v) => updateField('flatLand', v === 'any' ? null : v === 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">指定なし</SelectItem>
                <SelectItem value="yes">平坦地希望</SelectItem>
                <SelectItem value="no">傾斜可</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 優先順位 */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Star className="w-4 h-4 text-yellow-500" />
            優先順位（重み付け）
          </Label>
          <div className="grid gap-4">
            {[
              { key: 'area' as const, label: 'エリア' },
              { key: 'price' as const, label: '価格' },
              { key: 'size' as const, label: '面積' },
              { key: 'access' as const, label: 'アクセス' },
              { key: 'environment' as const, label: '周辺環境' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="w-24 text-sm">{label}</span>
                <Slider
                  value={[conditions.priorities[key]]}
                  onValueChange={([v]) => updatePriority(key, v)}
                  max={5}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-sm text-center">{conditions.priorities[key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* メモ */}
        <div className="space-y-2">
          <Label className="text-sm">その他メモ</Label>
          <Textarea
            placeholder="その他の条件やご要望"
            value={conditions.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
          />
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            条件を保存
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
