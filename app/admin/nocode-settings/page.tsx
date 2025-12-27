'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Settings,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  GitBranch,
  Calendar,
  MapPin,
  Check,
  FileText,
  Home,
  Users,
  Phone,
  MessageSquare,
  Star,
  Flag,
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Heart,
  Award,
  Target,
  TrendingUp,
  Bookmark,
  Bell,
  Mail,
  Globe,
  Key,
  Hammer,
  Building,
  Car,
  Plane,
  Coffee,
  Gift,
  Camera,
  Music,
  Video,
  Image,
  File,
  Folder,
  Search,
  Eye,
  Edit,
  X,
} from 'lucide-react'

// =============================================
// プリセットカラー
// =============================================
const PRESET_COLORS = [
  { name: 'グレー', text: 'text-gray-600', bg: 'bg-gray-100' },
  { name: 'スレート', text: 'text-slate-600', bg: 'bg-slate-100' },
  { name: 'レッド', text: 'text-red-600', bg: 'bg-red-100' },
  { name: 'オレンジ', text: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'アンバー', text: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'イエロー', text: 'text-yellow-600', bg: 'bg-yellow-100' },
  { name: 'ライム', text: 'text-lime-600', bg: 'bg-lime-100' },
  { name: 'グリーン', text: 'text-green-600', bg: 'bg-green-100' },
  { name: 'エメラルド', text: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'ティール', text: 'text-teal-600', bg: 'bg-teal-100' },
  { name: 'シアン', text: 'text-cyan-600', bg: 'bg-cyan-100' },
  { name: 'スカイ', text: 'text-sky-600', bg: 'bg-sky-100' },
  { name: 'ブルー', text: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'インディゴ', text: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'バイオレット', text: 'text-violet-600', bg: 'bg-violet-100' },
  { name: 'パープル', text: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'ピンク', text: 'text-pink-600', bg: 'bg-pink-100' },
  { name: 'ローズ', text: 'text-rose-600', bg: 'bg-rose-100' },
]

// =============================================
// アイコンリスト
// =============================================
const ICON_LIST = [
  { name: 'Circle', icon: Circle, label: '○' },
  { name: 'CheckCircle', icon: CheckCircle, label: 'チェック' },
  { name: 'XCircle', icon: XCircle, label: 'バツ' },
  { name: 'Star', icon: Star, label: 'スター' },
  { name: 'Heart', icon: Heart, label: 'ハート' },
  { name: 'Flag', icon: Flag, label: 'フラグ' },
  { name: 'Award', icon: Award, label: '賞' },
  { name: 'Target', icon: Target, label: 'ターゲット' },
  { name: 'Zap', icon: Zap, label: '稲妻' },
  { name: 'Bell', icon: Bell, label: 'ベル' },
  { name: 'Home', icon: Home, label: '家' },
  { name: 'Building', icon: Building, label: 'ビル' },
  { name: 'Users', icon: Users, label: '人々' },
  { name: 'Phone', icon: Phone, label: '電話' },
  { name: 'Mail', icon: Mail, label: 'メール' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'メッセージ' },
  { name: 'Calendar', icon: Calendar, label: 'カレンダー' },
  { name: 'Clock', icon: Clock, label: '時計' },
  { name: 'FileText', icon: FileText, label: 'ファイル' },
  { name: 'Folder', icon: Folder, label: 'フォルダ' },
  { name: 'Search', icon: Search, label: '検索' },
  { name: 'Eye', icon: Eye, label: '目' },
  { name: 'Edit', icon: Edit, label: '編集' },
  { name: 'TrendingUp', icon: TrendingUp, label: '上昇' },
  { name: 'Globe', icon: Globe, label: 'グローブ' },
  { name: 'Key', icon: Key, label: '鍵' },
  { name: 'Hammer', icon: Hammer, label: 'ハンマー' },
  { name: 'MapPin', icon: MapPin, label: '地図ピン' },
  { name: 'Car', icon: Car, label: '車' },
  { name: 'Coffee', icon: Coffee, label: 'コーヒー' },
  { name: 'Gift', icon: Gift, label: 'ギフト' },
  { name: 'Camera', icon: Camera, label: 'カメラ' },
]

const getIconComponent = (iconName: string) => {
  const found = ICON_LIST.find(i => i.name === iconName)
  return found?.icon || Circle
}

// =============================================
// 型定義
// =============================================
interface PipelineStatusSetting {
  id: string
  status_key: string
  label: string
  category: 'pre_member' | 'pre_contract' | 'post_contract' | 'owner' | 'lost'
  color: string
  bg_color: string
  icon: string
  sort_order: number
  is_active: boolean
}

interface JourneyEventSetting {
  id: string
  event_key: string
  label: string
  category: string
  color: string
  bg_color: string
  icon: string
  sort_order: number
  is_key_milestone: boolean
  is_active: boolean
}

interface LandConditionOption {
  id: string
  option_key: string
  label: string
  description: string
  category: 'shape' | 'condition' | 'exclusion'
  sort_order: number
  is_active: boolean
  default_value: boolean
}

// =============================================
// カテゴリラベル
// =============================================
const PIPELINE_CATEGORIES = [
  { key: 'pre_member', label: '限定会員前' },
  { key: 'pre_contract', label: '契約前' },
  { key: 'post_contract', label: '契約後' },
  { key: 'owner', label: 'オーナー' },
  { key: 'lost', label: 'ボツ・他決' },
]

const EVENT_CATEGORIES = ['初期接触', 'イベント', '商談', '土地', '契約プロセス', '着工後', 'その他']

const LAND_CATEGORIES = [
  { key: 'shape', label: '形状' },
  { key: 'condition', label: '条件' },
  { key: 'exclusion', label: '除外' },
]

// =============================================
// デフォルトデータ
// =============================================
const DEFAULT_PIPELINE_STATUSES: PipelineStatusSetting[] = [
  { id: '1', status_key: '資料請求', label: '資料請求', category: 'pre_member', color: 'text-slate-600', bg_color: 'bg-slate-100', icon: 'FileText', sort_order: 10, is_active: true },
  { id: '2', status_key: 'イベント予約', label: 'イベント予約', category: 'pre_member', color: 'text-purple-600', bg_color: 'bg-purple-100', icon: 'Calendar', sort_order: 20, is_active: true },
  { id: '3', status_key: 'イベント参加', label: 'イベント参加', category: 'pre_member', color: 'text-purple-600', bg_color: 'bg-purple-100', icon: 'Users', sort_order: 30, is_active: true },
  { id: '4', status_key: '限定会員', label: '限定会員', category: 'pre_contract', color: 'text-blue-600', bg_color: 'bg-blue-100', icon: 'Star', sort_order: 40, is_active: true },
  { id: '5', status_key: '面談', label: '面談', category: 'pre_contract', color: 'text-indigo-600', bg_color: 'bg-indigo-100', icon: 'MessageSquare', sort_order: 50, is_active: true },
  { id: '6', status_key: '建築申込', label: '建築申込', category: 'pre_contract', color: 'text-orange-600', bg_color: 'bg-orange-100', icon: 'FileText', sort_order: 60, is_active: true },
  { id: '7', status_key: 'プラン提出', label: 'プラン提出', category: 'pre_contract', color: 'text-amber-600', bg_color: 'bg-amber-100', icon: 'Folder', sort_order: 70, is_active: true },
  { id: '8', status_key: '内定', label: '内定', category: 'pre_contract', color: 'text-red-600', bg_color: 'bg-red-100', icon: 'Award', sort_order: 80, is_active: true },
  { id: '9', status_key: '変更契約前', label: '変更契約前', category: 'post_contract', color: 'text-emerald-600', bg_color: 'bg-emerald-100', icon: 'Edit', sort_order: 90, is_active: true },
  { id: '10', status_key: '変更契約後', label: '変更契約後', category: 'post_contract', color: 'text-green-600', bg_color: 'bg-green-100', icon: 'CheckCircle', sort_order: 100, is_active: true },
  { id: '11', status_key: 'オーナー', label: 'オーナー', category: 'owner', color: 'text-teal-600', bg_color: 'bg-teal-100', icon: 'Home', sort_order: 110, is_active: true },
  { id: '12', status_key: 'ボツ・他決', label: 'ボツ・他決', category: 'lost', color: 'text-gray-600', bg_color: 'bg-gray-100', icon: 'XCircle', sort_order: 999, is_active: true },
]

const DEFAULT_JOURNEY_EVENTS: JourneyEventSetting[] = [
  { id: 'j1', event_key: '資料請求', label: '資料請求', category: '初期接触', color: 'text-slate-600', bg_color: 'bg-slate-100', icon: 'FileText', sort_order: 10, is_key_milestone: false, is_active: true },
  { id: 'j2', event_key: 'HP問合せ', label: 'HP問合せ', category: '初期接触', color: 'text-blue-600', bg_color: 'bg-blue-100', icon: 'Globe', sort_order: 11, is_key_milestone: false, is_active: true },
  { id: 'j3', event_key: 'MH見学会参加', label: 'MH見学会参加', category: 'イベント', color: 'text-purple-600', bg_color: 'bg-purple-100', icon: 'Home', sort_order: 25, is_key_milestone: true, is_active: true },
  { id: 'j4', event_key: '初回面談', label: '初回面談', category: '商談', color: 'text-indigo-600', bg_color: 'bg-indigo-100', icon: 'MessageSquare', sort_order: 50, is_key_milestone: true, is_active: true },
  { id: 'j5', event_key: '土地案内', label: '土地案内', category: '土地', color: 'text-lime-600', bg_color: 'bg-lime-100', icon: 'MapPin', sort_order: 65, is_key_milestone: true, is_active: true },
  { id: 'j6', event_key: '建築申込', label: '建築申込', category: '契約プロセス', color: 'text-red-600', bg_color: 'bg-red-100', icon: 'FileText', sort_order: 85, is_key_milestone: true, is_active: true },
  { id: 'j7', event_key: '契約', label: '契約', category: '契約プロセス', color: 'text-emerald-600', bg_color: 'bg-emerald-100', icon: 'CheckCircle', sort_order: 100, is_key_milestone: true, is_active: true },
  { id: 'j8', event_key: '引渡', label: '引渡', category: '着工後', color: 'text-green-600', bg_color: 'bg-green-100', icon: 'Key', sort_order: 130, is_key_milestone: true, is_active: true },
]

const DEFAULT_LAND_CONDITIONS: LandConditionOption[] = [
  { id: 'l1', option_key: '整形地', label: '整形地', description: '長方形・正方形の土地', category: 'shape', sort_order: 10, is_active: true, default_value: true },
  { id: 'l2', option_key: '旗竿地', label: '旗竿地', description: '旗竿状の形状の土地', category: 'shape', sort_order: 20, is_active: true, default_value: false },
  { id: 'l3', option_key: '不整形地', label: '不整形地', description: 'L字型など変形地', category: 'shape', sort_order: 30, is_active: true, default_value: false },
  { id: 'l4', option_key: '傾斜地', label: '傾斜地', description: '傾斜のある土地', category: 'shape', sort_order: 40, is_active: true, default_value: false },
  { id: 'l5', option_key: '建築条件付き', label: '建築条件付きOK', description: '建築条件付きでも検討可', category: 'condition', sort_order: 50, is_active: true, default_value: false },
  { id: 'l6', option_key: '古家付き', label: '古家付きOK', description: '解体が必要な古家があってもOK', category: 'condition', sort_order: 60, is_active: true, default_value: true },
  { id: 'l7', option_key: 'セットバック', label: 'セットバック可', description: 'セットバックが必要な土地も可', category: 'condition', sort_order: 70, is_active: true, default_value: true },
  { id: 'l8', option_key: '崖地除外', label: '崖地は除外', description: '急傾斜地は検討対象外', category: 'exclusion', sort_order: 80, is_active: true, default_value: true },
  { id: 'l9', option_key: '再建築不可除外', label: '再建築不可は除外', description: '再建築不可物件は除外', category: 'exclusion', sort_order: 90, is_active: true, default_value: true },
]

// =============================================
// カラーピッカーコンポーネント
// =============================================
function ColorPicker({
  value,
  onChange,
}: {
  value: { text: string; bg: string }
  onChange: (color: { text: string; bg: string }) => void
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PRESET_COLORS.map((color) => {
        const isSelected = value.text === color.text
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange({ text: color.text, bg: color.bg })}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
              color.bg,
              isSelected && 'ring-2 ring-offset-2 ring-orange-500'
            )}
            title={color.name}
          >
            {isSelected && <Check className={cn('w-5 h-5', color.text)} />}
          </button>
        )
      })}
    </div>
  )
}

// =============================================
// アイコンピッカーコンポーネント
// =============================================
function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string
  onChange: (icon: string) => void
  color: string
}) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {ICON_LIST.map((item) => {
        const Icon = item.icon
        const isSelected = value === item.name
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onChange(item.name)}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gray-50 hover:bg-gray-100',
              isSelected && 'ring-2 ring-offset-2 ring-orange-500 bg-orange-50'
            )}
            title={item.label}
          >
            <Icon className={cn('w-5 h-5', isSelected ? color : 'text-gray-500')} />
          </button>
        )
      })}
    </div>
  )
}

// =============================================
// プレビューバッジ
// =============================================
function PreviewBadge({ label, color, bgColor, icon }: { label: string; color: string; bgColor: string; icon: string }) {
  const Icon = getIconComponent(icon)
  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
      <span className="text-sm text-gray-500">プレビュー:</span>
      <Badge className={cn(bgColor, color, 'border-0 gap-1')}>
        <Icon className="w-3 h-3" />
        {label || '表示名'}
      </Badge>
    </div>
  )
}

// =============================================
// メインコンポーネント
// =============================================
export default function NocodeSettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState('pipeline')

  // データ
  const [pipelineStatuses, setPipelineStatuses] = useState<PipelineStatusSetting[]>(DEFAULT_PIPELINE_STATUSES)
  const [journeyEvents, setJourneyEvents] = useState<JourneyEventSetting[]>(DEFAULT_JOURNEY_EVENTS)
  const [landConditions, setLandConditions] = useState<LandConditionOption[]>(DEFAULT_LAND_CONDITIONS)

  // 編集ダイアログ
  const [editingPipeline, setEditingPipeline] = useState<PipelineStatusSetting | null>(null)
  const [editingJourney, setEditingJourney] = useState<JourneyEventSetting | null>(null)
  const [editingLand, setEditingLand] = useState<LandConditionOption | null>(null)

  // 新規追加モード
  const [isAddingPipeline, setIsAddingPipeline] = useState(false)
  const [isAddingJourney, setIsAddingJourney] = useState(false)
  const [isAddingLand, setIsAddingLand] = useState(false)

  // 権限チェック
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">管理者権限が必要です</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  // =============================================
  // パイプラインステータス操作
  // =============================================
  const handleSavePipeline = (item: PipelineStatusSetting, isNew: boolean) => {
    if (!item.label) {
      toast.error('表示名を入力してください')
      return
    }
    if (isNew) {
      const newItem = { ...item, id: `p-${Date.now()}`, sort_order: pipelineStatuses.length * 10 + 10 }
      setPipelineStatuses([...pipelineStatuses, newItem])
      toast.success('追加しました')
    } else {
      setPipelineStatuses(pipelineStatuses.map(s => s.id === item.id ? item : s))
      toast.success('保存しました')
    }
    setEditingPipeline(null)
    setIsAddingPipeline(false)
  }

  const handleDeletePipeline = (id: string) => {
    setPipelineStatuses(pipelineStatuses.filter(s => s.id !== id))
    toast.success('削除しました')
  }

  const togglePipelineActive = (id: string) => {
    setPipelineStatuses(pipelineStatuses.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s))
  }

  // =============================================
  // ジャーニーイベント操作
  // =============================================
  const handleSaveJourney = (item: JourneyEventSetting, isNew: boolean) => {
    if (!item.label) {
      toast.error('表示名を入力してください')
      return
    }
    if (isNew) {
      const newItem = { ...item, id: `j-${Date.now()}`, sort_order: journeyEvents.length * 10 + 10 }
      setJourneyEvents([...journeyEvents, newItem])
      toast.success('追加しました')
    } else {
      setJourneyEvents(journeyEvents.map(e => e.id === item.id ? item : e))
      toast.success('保存しました')
    }
    setEditingJourney(null)
    setIsAddingJourney(false)
  }

  const handleDeleteJourney = (id: string) => {
    setJourneyEvents(journeyEvents.filter(e => e.id !== id))
    toast.success('削除しました')
  }

  const toggleJourneyActive = (id: string) => {
    setJourneyEvents(journeyEvents.map(e => e.id === id ? { ...e, is_active: !e.is_active } : e))
  }

  // =============================================
  // 土地条件操作
  // =============================================
  const handleSaveLand = (item: LandConditionOption, isNew: boolean) => {
    if (!item.label) {
      toast.error('表示名を入力してください')
      return
    }
    if (isNew) {
      const newItem = { ...item, id: `l-${Date.now()}`, sort_order: landConditions.length * 10 + 10 }
      setLandConditions([...landConditions, newItem])
      toast.success('追加しました')
    } else {
      setLandConditions(landConditions.map(c => c.id === item.id ? item : c))
      toast.success('保存しました')
    }
    setEditingLand(null)
    setIsAddingLand(false)
  }

  const handleDeleteLand = (id: string) => {
    setLandConditions(landConditions.filter(c => c.id !== id))
    toast.success('削除しました')
  }

  const toggleLandActive = (id: string) => {
    setLandConditions(landConditions.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c))
  }

  const toggleLandDefault = (id: string) => {
    setLandConditions(landConditions.map(c => c.id === id ? { ...c, default_value: !c.default_value } : c))
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">設定管理</h1>
            <p className="text-sm text-gray-500">ステータス・イベント・土地条件を管理</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="pipeline" className="gap-1">
              <GitBranch className="w-4 h-4" />
              ステータス
            </TabsTrigger>
            <TabsTrigger value="journey" className="gap-1">
              <Calendar className="w-4 h-4" />
              イベント
            </TabsTrigger>
            <TabsTrigger value="land" className="gap-1">
              <MapPin className="w-4 h-4" />
              土地条件
            </TabsTrigger>
          </TabsList>

          {/* =============================================
              パイプラインステータス
              ============================================= */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setEditingPipeline({
                  id: '',
                  status_key: '',
                  label: '',
                  category: 'pre_contract',
                  color: 'text-blue-600',
                  bg_color: 'bg-blue-100',
                  icon: 'Circle',
                  sort_order: 0,
                  is_active: true,
                })
                setIsAddingPipeline(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                ステータス追加
              </Button>
            </div>

            {PIPELINE_CATEGORIES.map(cat => {
              const items = pipelineStatuses.filter(s => s.category === cat.key).sort((a, b) => a.sort_order - b.sort_order)
              if (items.length === 0) return null
              return (
                <Card key={cat.key} className="border shadow-sm">
                  <CardHeader className="py-3 bg-gray-50">
                    <CardTitle className="text-sm font-medium text-gray-700">{cat.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {items.map(item => {
                      const Icon = getIconComponent(item.icon)
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border bg-white',
                            !item.is_active && 'opacity-50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={cn(item.bg_color, item.color, 'border-0 gap-1')}>
                              <Icon className="w-3 h-3" />
                              {item.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={item.is_active} onCheckedChange={() => togglePipelineActive(item.id)} />
                            <Button variant="ghost" size="sm" onClick={() => setEditingPipeline(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePipeline(item.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* =============================================
              ジャーニーイベント
              ============================================= */}
          <TabsContent value="journey" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setEditingJourney({
                  id: '',
                  event_key: '',
                  label: '',
                  category: '商談',
                  color: 'text-blue-600',
                  bg_color: 'bg-blue-100',
                  icon: 'Circle',
                  sort_order: 0,
                  is_key_milestone: false,
                  is_active: true,
                })
                setIsAddingJourney(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                イベント追加
              </Button>
            </div>

            {EVENT_CATEGORIES.map(cat => {
              const items = journeyEvents.filter(e => e.category === cat).sort((a, b) => a.sort_order - b.sort_order)
              if (items.length === 0) return null
              return (
                <Card key={cat} className="border shadow-sm">
                  <CardHeader className="py-3 bg-gray-50">
                    <CardTitle className="text-sm font-medium text-gray-700">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {items.map(item => {
                      const Icon = getIconComponent(item.icon)
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border bg-white',
                            !item.is_active && 'opacity-50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={cn(item.bg_color, item.color, 'border-0 gap-1')}>
                              <Icon className="w-3 h-3" />
                              {item.label}
                            </Badge>
                            {item.is_key_milestone && (
                              <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">重要</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={item.is_active} onCheckedChange={() => toggleJourneyActive(item.id)} />
                            <Button variant="ghost" size="sm" onClick={() => setEditingJourney(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteJourney(item.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* =============================================
              土地条件
              ============================================= */}
          <TabsContent value="land" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setEditingLand({
                  id: '',
                  option_key: '',
                  label: '',
                  description: '',
                  category: 'condition',
                  sort_order: 0,
                  is_active: true,
                  default_value: false,
                })
                setIsAddingLand(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                条件追加
              </Button>
            </div>

            {LAND_CATEGORIES.map(cat => {
              const items = landConditions.filter(c => c.category === cat.key).sort((a, b) => a.sort_order - b.sort_order)
              if (items.length === 0) return null
              return (
                <Card key={cat.key} className="border shadow-sm">
                  <CardHeader className="py-3 bg-gray-50">
                    <CardTitle className="text-sm font-medium text-gray-700">{cat.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border bg-white',
                          !item.is_active && 'opacity-50'
                        )}
                      >
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <Switch checked={item.default_value} onCheckedChange={() => toggleLandDefault(item.id)} />
                            <span className="text-gray-500">初期ON</span>
                          </label>
                          <Switch checked={item.is_active} onCheckedChange={() => toggleLandActive(item.id)} />
                          <Button variant="ghost" size="sm" onClick={() => setEditingLand(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLand(item.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* =============================================
          パイプライン編集ダイアログ
          ============================================= */}
      <Dialog open={!!editingPipeline || isAddingPipeline} onOpenChange={() => { setEditingPipeline(null); setIsAddingPipeline(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAddingPipeline ? 'ステータス追加' : 'ステータス編集'}</DialogTitle>
          </DialogHeader>
          {editingPipeline && (
            <div className="space-y-4">
              <PreviewBadge
                label={editingPipeline.label}
                color={editingPipeline.color}
                bgColor={editingPipeline.bg_color}
                icon={editingPipeline.icon}
              />
              <div>
                <Label>表示名</Label>
                <Input
                  value={editingPipeline.label}
                  onChange={(e) => setEditingPipeline({ ...editingPipeline, label: e.target.value, status_key: e.target.value })}
                  placeholder="例: 商談中"
                />
              </div>
              <div>
                <Label>カテゴリ</Label>
                <Select
                  value={editingPipeline.category}
                  onValueChange={(v) => setEditingPipeline({ ...editingPipeline, category: v as PipelineStatusSetting['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>色</Label>
                <ColorPicker
                  value={{ text: editingPipeline.color, bg: editingPipeline.bg_color }}
                  onChange={(c) => setEditingPipeline({ ...editingPipeline, color: c.text, bg_color: c.bg })}
                />
              </div>
              <div>
                <Label>アイコン</Label>
                <IconPicker
                  value={editingPipeline.icon}
                  onChange={(icon) => setEditingPipeline({ ...editingPipeline, icon })}
                  color={editingPipeline.color}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPipeline(null); setIsAddingPipeline(false) }}>
              キャンセル
            </Button>
            <Button onClick={() => editingPipeline && handleSavePipeline(editingPipeline, isAddingPipeline)}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =============================================
          ジャーニー編集ダイアログ
          ============================================= */}
      <Dialog open={!!editingJourney || isAddingJourney} onOpenChange={() => { setEditingJourney(null); setIsAddingJourney(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAddingJourney ? 'イベント追加' : 'イベント編集'}</DialogTitle>
          </DialogHeader>
          {editingJourney && (
            <div className="space-y-4">
              <PreviewBadge
                label={editingJourney.label}
                color={editingJourney.color}
                bgColor={editingJourney.bg_color}
                icon={editingJourney.icon}
              />
              <div>
                <Label>表示名</Label>
                <Input
                  value={editingJourney.label}
                  onChange={(e) => setEditingJourney({ ...editingJourney, label: e.target.value, event_key: e.target.value })}
                  placeholder="例: 構造見学会"
                />
              </div>
              <div>
                <Label>カテゴリ</Label>
                <Select
                  value={editingJourney.category}
                  onValueChange={(v) => setEditingJourney({ ...editingJourney, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>色</Label>
                <ColorPicker
                  value={{ text: editingJourney.color, bg: editingJourney.bg_color }}
                  onChange={(c) => setEditingJourney({ ...editingJourney, color: c.text, bg_color: c.bg })}
                />
              </div>
              <div>
                <Label>アイコン</Label>
                <IconPicker
                  value={editingJourney.icon}
                  onChange={(icon) => setEditingJourney({ ...editingJourney, icon })}
                  color={editingJourney.color}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingJourney.is_key_milestone}
                  onCheckedChange={(checked) => setEditingJourney({ ...editingJourney, is_key_milestone: checked })}
                />
                <Label>重要マイルストーン（契約への重要ステップ）</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingJourney(null); setIsAddingJourney(false) }}>
              キャンセル
            </Button>
            <Button onClick={() => editingJourney && handleSaveJourney(editingJourney, isAddingJourney)}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =============================================
          土地条件編集ダイアログ
          ============================================= */}
      <Dialog open={!!editingLand || isAddingLand} onOpenChange={() => { setEditingLand(null); setIsAddingLand(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddingLand ? '条件追加' : '条件編集'}</DialogTitle>
          </DialogHeader>
          {editingLand && (
            <div className="space-y-4">
              <div>
                <Label>表示名</Label>
                <Input
                  value={editingLand.label}
                  onChange={(e) => setEditingLand({ ...editingLand, label: e.target.value, option_key: e.target.value })}
                  placeholder="例: 角地OK"
                />
              </div>
              <div>
                <Label>説明</Label>
                <Textarea
                  value={editingLand.description}
                  onChange={(e) => setEditingLand({ ...editingLand, description: e.target.value })}
                  placeholder="例: 角地の土地も検討対象"
                  rows={2}
                />
              </div>
              <div>
                <Label>カテゴリ</Label>
                <Select
                  value={editingLand.category}
                  onValueChange={(v) => setEditingLand({ ...editingLand, category: v as LandConditionOption['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAND_CATEGORIES.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingLand.default_value}
                  onCheckedChange={(checked) => setEditingLand({ ...editingLand, default_value: checked })}
                />
                <Label>新規顧客で初期ONにする</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingLand(null); setIsAddingLand(false) }}>
              キャンセル
            </Button>
            <Button onClick={() => editingLand && handleSaveLand(editingLand, isAddingLand)}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
