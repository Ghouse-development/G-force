'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Plus,
  MapPin,
  Banknote,
  Ruler,
  Train,
  Settings,
  Trash2,
  ExternalLink,
  Filter,
  Heart,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Car,
  Zap,
  Home,
  Search,
  ChevronRight,
  Sparkles,
  Star,
  AlertCircle,
  Info,
} from 'lucide-react'

// 大阪・兵庫・京都の市区町村
const KANSAI_AREAS = {
  '大阪府': [
    '大阪市北区', '大阪市中央区', '大阪市西区', '大阪市天王寺区', '大阪市阿倍野区',
    '豊中市', '吹田市', '高槻市', '茨木市', '箕面市', '池田市', '摂津市',
    '枚方市', '寝屋川市', '守口市', '門真市', '大東市', '東大阪市',
    '堺市北区', '堺市堺区', '堺市中区', '堺市西区', '堺市南区',
    '岸和田市', '貝塚市', '泉佐野市', '和泉市', '泉大津市',
  ],
  '兵庫県': [
    '神戸市東灘区', '神戸市灘区', '神戸市中央区', '神戸市兵庫区', '神戸市長田区',
    '神戸市須磨区', '神戸市垂水区', '神戸市北区', '神戸市西区',
    '尼崎市', '西宮市', '芦屋市', '伊丹市', '宝塚市', '川西市', '三田市',
    '明石市', '加古川市', '姫路市', '高砂市',
  ],
  '京都府': [
    '京都市北区', '京都市上京区', '京都市左京区', '京都市中京区', '京都市東山区',
    '京都市下京区', '京都市南区', '京都市右京区', '京都市伏見区', '京都市山科区', '京都市西京区',
    '宇治市', '城陽市', '向日市', '長岡京市', '八幡市', '京田辺市', '木津川市',
  ],
  '滋賀県': ['大津市', '草津市', '守山市', '栗東市', '野洲市', '近江八幡市'],
  '奈良県': ['奈良市', '生駒市', '大和郡山市', '天理市', '橿原市', '香芝市'],
  '和歌山県': ['和歌山市', '岩出市', '紀の川市', '海南市'],
}

interface PropertyAlert {
  id: string
  alertName: string
  isActive: boolean
  areas: string[]
  minPrice: number | null
  maxPrice: number | null
  minLandArea: number | null
  maxLandArea: number | null
  stationWalkMax: number | null
  roadWidthMin: number | null
  keywords: string[]
  excludeKeywords: string[]
  notifyEmail: boolean
  notifyApp: boolean
  createdAt: string
  matchCount: number
}

interface PropertyNotification {
  id: string
  matchScore: number
  isRead: boolean
  isFavorite: boolean
  createdAt: string
  property: {
    id: string
    title: string
    price: number
    address: string
    area: string
    landArea: number
    buildingCoverage: number
    floorAreaRatio: number
    roadWidth: number
    roadDirection: string
    stationName: string
    stationWalk: number
    images: string[]
    sourceUrl: string
    isNew: boolean
    daysOnMarket: number
  }
  matchDetails: {
    matchedConditions: string[]
    unmatchedConditions: string[]
  }
}

// デモデータ
const DEMO_ALERTS: PropertyAlert[] = [
  {
    id: '1',
    alertName: '豊中市 3,000万円以下 駅徒歩15分以内',
    isActive: true,
    areas: ['豊中市', '箕面市', '池田市'],
    minPrice: 2000,
    maxPrice: 3000,
    minLandArea: 100,
    maxLandArea: 150,
    stationWalkMax: 15,
    roadWidthMin: 4,
    keywords: ['整形地', '南向き'],
    excludeKeywords: ['借地', '再建築不可'],
    notifyEmail: true,
    notifyApp: true,
    createdAt: '2024-12-20T10:00:00Z',
    matchCount: 5,
  },
  {
    id: '2',
    alertName: '吹田市 駅徒歩10分以内',
    isActive: true,
    areas: ['吹田市'],
    minPrice: null,
    maxPrice: 4000,
    minLandArea: 80,
    maxLandArea: null,
    stationWalkMax: 10,
    roadWidthMin: 6,
    keywords: [],
    excludeKeywords: [],
    notifyEmail: true,
    notifyApp: true,
    createdAt: '2024-12-18T14:30:00Z',
    matchCount: 3,
  },
]

const DEMO_NOTIFICATIONS: PropertyNotification[] = [
  {
    id: '1',
    matchScore: 95,
    isRead: false,
    isFavorite: false,
    createdAt: '2024-12-21T08:00:00Z',
    property: {
      id: 'p1',
      title: '豊中市上野東 建築条件なし土地',
      price: 2800,
      address: '大阪府豊中市上野東2丁目',
      area: '豊中市',
      landArea: 120.5,
      buildingCoverage: 60,
      floorAreaRatio: 200,
      roadWidth: 6.0,
      roadDirection: '南',
      stationName: '豊中',
      stationWalk: 12,
      images: [],
      sourceUrl: 'https://example.com/property/1',
      isNew: true,
      daysOnMarket: 1,
    },
    matchDetails: {
      matchedConditions: ['エリア: 豊中市', '価格: 2,800万円', '土地面積: 120.5㎡', '駅徒歩: 12分', '道路幅員: 6m'],
      unmatchedConditions: [],
    },
  },
  {
    id: '2',
    matchScore: 88,
    isRead: false,
    isFavorite: true,
    createdAt: '2024-12-20T15:30:00Z',
    property: {
      id: 'p2',
      title: '箕面市桜井 角地・整形地',
      price: 2950,
      address: '大阪府箕面市桜井3丁目',
      area: '箕面市',
      landArea: 135.2,
      buildingCoverage: 60,
      floorAreaRatio: 200,
      roadWidth: 5.5,
      roadDirection: '南東',
      stationName: '桜井',
      stationWalk: 8,
      images: [],
      sourceUrl: 'https://example.com/property/2',
      isNew: false,
      daysOnMarket: 5,
    },
    matchDetails: {
      matchedConditions: ['エリア: 箕面市', '価格: 2,950万円', '土地面積: 135.2㎡', '駅徒歩: 8分'],
      unmatchedConditions: ['道路幅員: 5.5m (希望6m以上)'],
    },
  },
  {
    id: '3',
    matchScore: 82,
    isRead: true,
    isFavorite: false,
    createdAt: '2024-12-19T10:00:00Z',
    property: {
      id: 'p3',
      title: '池田市石橋 南向き',
      price: 2650,
      address: '大阪府池田市石橋1丁目',
      area: '池田市',
      landArea: 105.8,
      buildingCoverage: 60,
      floorAreaRatio: 200,
      roadWidth: 4.5,
      roadDirection: '南',
      stationName: '石橋阪大前',
      stationWalk: 10,
      images: [],
      sourceUrl: 'https://example.com/property/3',
      isNew: false,
      daysOnMarket: 14,
    },
    matchDetails: {
      matchedConditions: ['エリア: 池田市', '価格: 2,650万円', '駅徒歩: 10分', 'キーワード: 南向き'],
      unmatchedConditions: ['土地面積: 105.8㎡ (希望100-150㎡)', '道路幅員: 4.5m'],
    },
  },
]

export default function PropertyAlertsPage() {
  const [alerts, setAlerts] = useState<PropertyAlert[]>(DEMO_ALERTS)
  const [notifications, setNotifications] = useState<PropertyNotification[]>(DEMO_NOTIFICATIONS)
  const [properties, setProperties] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts' | 'search'>('notifications')
  const [filterUnread, setFilterUnread] = useState(false)
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)

  // 物件データをフェッチ
  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      const data = await response.json()
      if (data.success && data.data) {
        setProperties(data.data)
        // 物件データから通知リストを生成（デモ）
        const newNotifications: PropertyNotification[] = data.data.slice(0, 5).map((prop: any, idx: number) => ({
          id: prop.id,
          matchScore: 95 - idx * 5,
          isRead: idx > 1,
          isFavorite: idx === 0,
          createdAt: prop.created_at || new Date().toISOString(),
          property: {
            id: prop.id,
            title: prop.title || '土地物件',
            price: prop.price || 0,
            address: prop.address || '',
            area: prop.area || '',
            landArea: prop.land_area || 0,
            buildingCoverage: prop.building_coverage || 60,
            floorAreaRatio: prop.floor_area_ratio || 200,
            roadWidth: prop.road_width || 4,
            roadDirection: prop.road_direction || '南',
            stationName: prop.station_name || '',
            stationWalk: prop.station_walk || 10,
            images: prop.images || [],
            sourceUrl: prop.source_url || '#',
            isNew: idx === 0,
            daysOnMarket: idx + 1,
          },
          matchDetails: {
            matchedConditions: ['エリア', '価格', '土地面積'].slice(0, 3 - idx > 0 ? 3 - idx : 1).map(c => `${c}: OK`),
            unmatchedConditions: [],
          },
        }))
        if (newNotifications.length > 0) {
          setNotifications(newNotifications)
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  // SUUMOからクロール実行
  const runCrawl = async () => {
    setCrawling(true)
    try {
      const response = await fetch('/api/cron/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full', maxPages: 2 }),
      })
      const data = await response.json()
      console.log('Crawl result:', data)
      await fetchProperties() // 再読込
    } catch (error) {
      console.error('Error crawling:', error)
    } finally {
      setCrawling(false)
    }
  }

  // 初回読み込み
  useEffect(() => {
    fetchProperties()
  }, [])

  // 新規アラートのフォーム状態
  const [newAlert, setNewAlert] = useState({
    alertName: '',
    selectedPrefecture: '大阪府',
    areas: [] as string[],
    minPrice: 2000,
    maxPrice: 4000,
    minLandArea: 80,
    maxLandArea: 200,
    stationWalkMax: 15,
    roadWidthMin: 4,
    keywords: '',
    excludeKeywords: '',
  })

  // フィルタリングされた通知
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterUnread && n.isRead) return false
      if (filterFavorite && !n.isFavorite) return false
      return true
    })
  }, [notifications, filterUnread, filterFavorite])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleCreateAlert = () => {
    const alert: PropertyAlert = {
      id: String(Date.now()),
      alertName: newAlert.alertName || `${newAlert.areas.join('・')} ${newAlert.maxPrice}万円以下`,
      isActive: true,
      areas: newAlert.areas,
      minPrice: newAlert.minPrice,
      maxPrice: newAlert.maxPrice,
      minLandArea: newAlert.minLandArea,
      maxLandArea: newAlert.maxLandArea,
      stationWalkMax: newAlert.stationWalkMax,
      roadWidthMin: newAlert.roadWidthMin,
      keywords: newAlert.keywords.split(',').map(k => k.trim()).filter(Boolean),
      excludeKeywords: newAlert.excludeKeywords.split(',').map(k => k.trim()).filter(Boolean),
      notifyEmail: true,
      notifyApp: true,
      createdAt: new Date().toISOString(),
      matchCount: 0,
    }
    setAlerts([alert, ...alerts])
    setIsDialogOpen(false)
    setNewAlert({
      alertName: '',
      selectedPrefecture: '大阪府',
      areas: [],
      minPrice: 2000,
      maxPrice: 4000,
      minLandArea: 80,
      maxLandArea: 200,
      stationWalkMax: 15,
      roadWidthMin: 4,
      keywords: '',
      excludeKeywords: '',
    })
  }

  const toggleFavorite = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
    ))
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ))
  }

  const ScoreIndicator = ({ score }: { score: number }) => {
    const color = score >= 90 ? 'bg-green-500' : score >= 80 ? 'bg-blue-500' : score >= 70 ? 'bg-yellow-500' : 'bg-gray-400'
    return (
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
          {score}
        </div>
        <span className="text-xs text-muted-foreground">マッチ度</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8 text-primary" />
            土地情報アラート
          </h1>
          <p className="text-muted-foreground mt-1">
            条件に合う土地が見つかったら自動でお知らせ
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600">
              <Plus className="w-5 h-5 mr-2" />
              新規アラート作成
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                土地アラートを作成
              </DialogTitle>
              <DialogDescription>
                条件を設定すると、合致する土地が見つかった際に通知されます
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* アラート名 */}
              <div className="space-y-2">
                <Label htmlFor="alertName">アラート名（任意）</Label>
                <Input
                  id="alertName"
                  placeholder="例: 豊中市 駅近物件"
                  value={newAlert.alertName}
                  onChange={e => setNewAlert({ ...newAlert, alertName: e.target.value })}
                />
              </div>

              {/* エリア選択 */}
              <div className="space-y-3">
                <Label>エリア選択</Label>
                <Select
                  value={newAlert.selectedPrefecture}
                  onValueChange={v => setNewAlert({ ...newAlert, selectedPrefecture: v, areas: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(KANSAI_AREAS).map(pref => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {KANSAI_AREAS[newAlert.selectedPrefecture as keyof typeof KANSAI_AREAS]?.map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={city}
                        checked={newAlert.areas.includes(city)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewAlert({ ...newAlert, areas: [...newAlert.areas, city] })
                          } else {
                            setNewAlert({ ...newAlert, areas: newAlert.areas.filter(a => a !== city) })
                          }
                        }}
                      />
                      <label htmlFor={city} className="text-sm cursor-pointer">{city}</label>
                    </div>
                  ))}
                </div>
                {newAlert.areas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newAlert.areas.map(area => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                        <button
                          className="ml-1 hover:text-red-500"
                          onClick={() => setNewAlert({ ...newAlert, areas: newAlert.areas.filter(a => a !== area) })}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 価格帯 */}
              <div className="space-y-3">
                <Label>価格帯: {newAlert.minPrice.toLocaleString()}万円 〜 {newAlert.maxPrice.toLocaleString()}万円</Label>
                <div className="px-2">
                  <Slider
                    min={500}
                    max={10000}
                    step={100}
                    value={[newAlert.minPrice, newAlert.maxPrice]}
                    onValueChange={([min, max]) => setNewAlert({ ...newAlert, minPrice: min, maxPrice: max })}
                  />
                </div>
              </div>

              {/* 土地面積 */}
              <div className="space-y-3">
                <Label>土地面積: {newAlert.minLandArea}㎡ 〜 {newAlert.maxLandArea}㎡</Label>
                <div className="px-2">
                  <Slider
                    min={50}
                    max={500}
                    step={10}
                    value={[newAlert.minLandArea, newAlert.maxLandArea]}
                    onValueChange={([min, max]) => setNewAlert({ ...newAlert, minLandArea: min, maxLandArea: max })}
                  />
                </div>
              </div>

              {/* 駅徒歩 */}
              <div className="space-y-3">
                <Label>駅徒歩: {newAlert.stationWalkMax}分以内</Label>
                <div className="px-2">
                  <Slider
                    min={1}
                    max={30}
                    step={1}
                    value={[newAlert.stationWalkMax]}
                    onValueChange={([val]) => setNewAlert({ ...newAlert, stationWalkMax: val })}
                  />
                </div>
              </div>

              {/* 道路幅員 */}
              <div className="space-y-3">
                <Label>前面道路幅員: {newAlert.roadWidthMin}m以上</Label>
                <div className="px-2">
                  <Slider
                    min={2}
                    max={12}
                    step={0.5}
                    value={[newAlert.roadWidthMin]}
                    onValueChange={([val]) => setNewAlert({ ...newAlert, roadWidthMin: val })}
                  />
                </div>
              </div>

              {/* キーワード */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">含むキーワード</Label>
                  <Input
                    id="keywords"
                    placeholder="整形地, 南向き, 角地"
                    value={newAlert.keywords}
                    onChange={e => setNewAlert({ ...newAlert, keywords: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">カンマ区切り</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excludeKeywords">除外キーワード</Label>
                  <Input
                    id="excludeKeywords"
                    placeholder="借地, 再建築不可"
                    value={newAlert.excludeKeywords}
                    onChange={e => setNewAlert({ ...newAlert, excludeKeywords: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">カンマ区切り</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateAlert} disabled={newAlert.areas.length === 0}>
                <Bell className="w-4 h-4 mr-2" />
                アラートを作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => { setActiveTab('notifications'); setFilterUnread(true); setFilterFavorite(false); }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">未読通知</p>
                <p className="text-4xl font-bold text-orange-800 mt-1">{unreadCount}</p>
              </div>
              <Bell className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => { setActiveTab('notifications'); setFilterFavorite(true); setFilterUnread(false); }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-700 font-medium">お気に入り</p>
                <p className="text-4xl font-bold text-pink-800 mt-1">
                  {notifications.filter(n => n.isFavorite).length}
                </p>
              </div>
              <Heart className="w-10 h-10 text-pink-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('alerts')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">アクティブなアラート</p>
                <p className="text-4xl font-bold text-green-800 mt-1">
                  {alerts.filter(a => a.isActive).length}
                </p>
              </div>
              <Settings className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">マッチした物件</p>
                <p className="text-4xl font-bold mt-1">{notifications.length}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            物件通知
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            アラート設定
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            物件検索
          </TabsTrigger>
        </TabsList>

        {/* 物件通知タブ */}
        <TabsContent value="notifications" className="space-y-4">
          {/* フィルター */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="unread" checked={filterUnread} onCheckedChange={setFilterUnread} />
              <Label htmlFor="unread">未読のみ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="favorite" checked={filterFavorite} onCheckedChange={setFilterFavorite} />
              <Label htmlFor="favorite">お気に入りのみ</Label>
            </div>
          </div>

          {/* 物件カード一覧 */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">該当する物件がありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notif => (
                <Card
                  key={notif.id}
                  className={`transition-all hover:shadow-lg ${!notif.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* 左側: スコアと基本情報 */}
                      <div className="flex items-start gap-4">
                        <ScoreIndicator score={notif.matchScore} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg truncate">{notif.property.title}</h3>
                            {notif.property.isNew && (
                              <Badge className="bg-red-500">NEW</Badge>
                            )}
                            {notif.property.daysOnMarket <= 7 && !notif.property.isNew && (
                              <Badge variant="outline">掲載{notif.property.daysOnMarket}日</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {notif.property.address}
                          </p>
                        </div>
                      </div>

                      {/* 中央: 物件詳細 */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Banknote className="w-4 h-4" />
                            価格
                          </p>
                          <p className="font-bold text-lg text-primary">{notif.property.price.toLocaleString()}万円</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            土地面積
                          </p>
                          <p className="font-semibold">{notif.property.landArea}㎡</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Train className="w-4 h-4" />
                            最寄駅
                          </p>
                          <p className="font-semibold">{notif.property.stationName}駅 徒歩{notif.property.stationWalk}分</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            道路
                          </p>
                          <p className="font-semibold">{notif.property.roadDirection} {notif.property.roadWidth}m</p>
                        </div>
                      </div>

                      {/* 右側: アクション */}
                      <div className="flex lg:flex-col items-center gap-2 lg:min-w-[120px]">
                        <Button
                          variant={notif.isFavorite ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(notif.id); }}
                          className="flex-1 lg:w-full"
                        >
                          <Heart className={`w-4 h-4 mr-1 ${notif.isFavorite ? 'fill-current' : ''}`} />
                          {notif.isFavorite ? 'お気に入り' : '追加'}
                        </Button>
                        <Button variant="outline" size="sm" asChild className="flex-1 lg:w-full">
                          <a href={notif.property.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            詳細
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* マッチ条件 */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {notif.matchDetails.matchedConditions.map((cond, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {cond}
                          </Badge>
                        ))}
                        {notif.matchDetails.unmatchedConditions.map((cond, i) => (
                          <Badge key={i} variant="outline" className="text-orange-600 border-orange-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* アラート設定タブ */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.map(alert => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {alert.alertName}
                      {alert.isActive ? (
                        <Badge className="bg-green-500">有効</Badge>
                      ) : (
                        <Badge variant="secondary">停止中</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      作成日: {new Date(alert.createdAt).toLocaleDateString('ja-JP')} | マッチ物件: {alert.matchCount}件
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={alert.isActive} />
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {alert.areas.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alert.areas.join(', ')}
                    </Badge>
                  )}
                  {(alert.minPrice || alert.maxPrice) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Banknote className="w-3 h-3" />
                      {alert.minPrice?.toLocaleString() || 0}〜{alert.maxPrice?.toLocaleString() || '上限なし'}万円
                    </Badge>
                  )}
                  {(alert.minLandArea || alert.maxLandArea) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      {alert.minLandArea || 0}〜{alert.maxLandArea || '上限なし'}㎡
                    </Badge>
                  )}
                  {alert.stationWalkMax && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Train className="w-3 h-3" />
                      駅徒歩{alert.stationWalkMax}分以内
                    </Badge>
                  )}
                  {alert.roadWidthMin && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      道路{alert.roadWidthMin}m以上
                    </Badge>
                  )}
                  {alert.keywords.map(kw => (
                    <Badge key={kw} className="bg-blue-100 text-blue-800">{kw}</Badge>
                  ))}
                  {alert.excludeKeywords.map(kw => (
                    <Badge key={kw} variant="destructive" className="bg-red-100 text-red-800">除外: {kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {alerts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">アラートがありません</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  最初のアラートを作成
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 物件検索タブ */}
        <TabsContent value="search" className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Search className="w-6 h-6" />
                    SUUMOから土地情報を取得
                  </h3>
                  <p className="text-blue-700 max-w-md">
                    関西エリア（大阪・兵庫・京都・奈良・滋賀）の土地情報をSUUMOから取得します
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={runCrawl}
                  disabled={crawling}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {crawling ? (
                    <>
                      <Zap className="w-5 h-5 mr-2 animate-pulse" />
                      取得中...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      今すぐ取得
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 取得済み物件一覧 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                取得済み物件一覧
                <Badge variant="secondary">{properties.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>物件データがありません</p>
                  <p className="text-sm mt-2">上のボタンをクリックしてSUUMOから取得してください</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {properties.map(prop => (
                    <div key={prop.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{prop.title || '土地物件'}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {prop.address || prop.area}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm">
                            <Badge variant="outline">
                              <Banknote className="w-3 h-3 mr-1" />
                              {prop.price?.toLocaleString() || '-'}万円
                            </Badge>
                            <Badge variant="outline">
                              <Ruler className="w-3 h-3 mr-1" />
                              {prop.land_area || '-'}㎡
                            </Badge>
                            {prop.station_name && (
                              <Badge variant="outline">
                                <Train className="w-3 h-3 mr-1" />
                                {prop.station_name}駅 徒歩{prop.station_walk || '-'}分
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={prop.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ヘルプカード */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Info className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-purple-900">土地探しのポイント</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>道路幅員6m以上</strong>: 車の出し入れが楽、日当たり良好</li>
                <li>• <strong>整形地</strong>: 建物の設計自由度が高く、無駄なスペースが少ない</li>
                <li>• <strong>南向き</strong>: 日当たり・採光に優れる</li>
                <li>• <strong>角地</strong>: 開放感があり、建ぺい率緩和の可能性</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
