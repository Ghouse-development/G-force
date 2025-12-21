'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Smartphone,
  Landmark,
  Clock,
  ExternalLink,
  Info,
  Building,
  Wallet,
} from 'lucide-react'
import {
  BANK_CRAWL_CONFIGS,
  BANK_CATEGORY_LABELS,
  type BankCategory,
} from '@/types/crawl'

interface LoanRate {
  id: string
  bank_name: string
  bank_code: string
  rate_type: string
  rate: number
  rate_date: string
  previous_rate: number | null
  rate_change: number | null
  source_url: string
}

// デモ用のモックデータ（実際はAPIから取得）
const MOCK_RATES: LoanRate[] = [
  // フラット35
  { id: '1', bank_name: '住宅金融支援機構（フラット35）', bank_code: 'jhf', rate_type: 'フラット35（21-35年）', rate: 1.82, rate_date: '2024-12-01', previous_rate: 1.84, rate_change: -0.02, source_url: 'https://www.flat35.com/' },
  { id: '2', bank_name: '住宅金融支援機構（フラット35）', bank_code: 'jhf', rate_type: 'フラット35（15-20年）', rate: 1.43, rate_date: '2024-12-01', previous_rate: 1.45, rate_change: -0.02, source_url: 'https://www.flat35.com/' },
  { id: '3', bank_name: '住宅金融支援機構（フラット35）', bank_code: 'jhf', rate_type: 'フラット35S（21-35年）', rate: 1.57, rate_date: '2024-12-01', previous_rate: 1.59, rate_change: -0.02, source_url: 'https://www.flat35.com/' },

  // ネット銀行
  { id: '10', bank_name: '住信SBIネット銀行', bank_code: 'sbi', rate_type: '変動金利', rate: 0.298, rate_date: '2024-12-01', previous_rate: 0.298, rate_change: 0, source_url: 'https://www.netbk.co.jp/' },
  { id: '11', bank_name: '住信SBIネット銀行', bank_code: 'sbi', rate_type: '固定10年', rate: 1.195, rate_date: '2024-12-01', previous_rate: 1.180, rate_change: 0.015, source_url: 'https://www.netbk.co.jp/' },
  { id: '12', bank_name: 'auじぶん銀行', bank_code: 'aujibun', rate_type: '変動金利', rate: 0.169, rate_date: '2024-12-01', previous_rate: 0.169, rate_change: 0, source_url: 'https://www.jibunbank.co.jp/' },
  { id: '13', bank_name: 'auじぶん銀行', bank_code: 'aujibun', rate_type: '固定10年', rate: 1.195, rate_date: '2024-12-01', previous_rate: 1.180, rate_change: 0.015, source_url: 'https://www.jibunbank.co.jp/' },
  { id: '14', bank_name: 'PayPay銀行', bank_code: 'paypay', rate_type: '変動金利', rate: 0.270, rate_date: '2024-12-01', previous_rate: 0.270, rate_change: 0, source_url: 'https://www.paypay-bank.co.jp/' },
  { id: '15', bank_name: '楽天銀行', bank_code: 'rakuten', rate_type: '変動金利', rate: 0.550, rate_date: '2024-12-01', previous_rate: 0.550, rate_change: 0, source_url: 'https://www.rakuten-bank.co.jp/' },
  { id: '16', bank_name: 'ソニー銀行', bank_code: 'sony', rate_type: '変動金利', rate: 0.397, rate_date: '2024-12-01', previous_rate: 0.397, rate_change: 0, source_url: 'https://moneykit.net/' },
  { id: '17', bank_name: 'イオン銀行', bank_code: 'aeon', rate_type: '変動金利', rate: 0.380, rate_date: '2024-12-01', previous_rate: 0.380, rate_change: 0, source_url: 'https://www.aeonbank.co.jp/' },

  // メガバンク
  { id: '20', bank_name: '三菱UFJ銀行', bank_code: 'mufg', rate_type: '変動金利', rate: 0.345, rate_date: '2024-12-01', previous_rate: 0.345, rate_change: 0, source_url: 'https://www.bk.mufg.jp/' },
  { id: '21', bank_name: '三菱UFJ銀行', bank_code: 'mufg', rate_type: '固定10年', rate: 1.040, rate_date: '2024-12-01', previous_rate: 1.010, rate_change: 0.030, source_url: 'https://www.bk.mufg.jp/' },
  { id: '22', bank_name: '三井住友銀行', bank_code: 'smbc', rate_type: '変動金利', rate: 0.475, rate_date: '2024-12-01', previous_rate: 0.475, rate_change: 0, source_url: 'https://www.smbc.co.jp/' },
  { id: '23', bank_name: 'みずほ銀行', bank_code: 'mizuho', rate_type: '変動金利', rate: 0.375, rate_date: '2024-12-01', previous_rate: 0.375, rate_change: 0, source_url: 'https://www.mizuhobank.co.jp/' },
  { id: '24', bank_name: 'りそな銀行', bank_code: 'resona', rate_type: '変動金利', rate: 0.340, rate_date: '2024-12-01', previous_rate: 0.340, rate_change: 0, source_url: 'https://www.resonabank.co.jp/' },

  // 関西の地方銀行
  { id: '30', bank_name: '関西みらい銀行', bank_code: 'kansai_mirai', rate_type: '変動金利', rate: 0.395, rate_date: '2024-12-01', previous_rate: 0.395, rate_change: 0, source_url: 'https://www.kansaimiraibank.co.jp/' },
  { id: '31', bank_name: '池田泉州銀行', bank_code: 'senshu_ikeda', rate_type: '変動金利', rate: 0.475, rate_date: '2024-12-01', previous_rate: 0.475, rate_change: 0, source_url: 'https://www.sihd-bk.jp/' },
  { id: '32', bank_name: '京都銀行', bank_code: 'kyoto', rate_type: '変動金利', rate: 0.525, rate_date: '2024-12-01', previous_rate: 0.525, rate_change: 0, source_url: 'https://www.kyotobank.co.jp/' },
  { id: '33', bank_name: '滋賀銀行', bank_code: 'shiga', rate_type: '変動金利', rate: 0.475, rate_date: '2024-12-01', previous_rate: 0.475, rate_change: 0, source_url: 'https://www.shigagin.com/' },
  { id: '34', bank_name: '南都銀行', bank_code: 'nanto', rate_type: '変動金利', rate: 0.525, rate_date: '2024-12-01', previous_rate: 0.525, rate_change: 0, source_url: 'https://www.nantobank.co.jp/' },
  { id: '35', bank_name: '紀陽銀行', bank_code: 'kiyo', rate_type: '変動金利', rate: 0.525, rate_date: '2024-12-01', previous_rate: 0.525, rate_change: 0, source_url: 'https://www.kiyobank.co.jp/' },

  // 信用金庫
  { id: '40', bank_name: '大阪信用金庫', bank_code: 'osaka_shinkin', rate_type: '変動金利', rate: 0.575, rate_date: '2024-12-01', previous_rate: 0.575, rate_change: 0, source_url: '' },
  { id: '41', bank_name: '大阪シティ信用金庫', bank_code: 'osaka_city_shinkin', rate_type: '変動金利', rate: 0.625, rate_date: '2024-12-01', previous_rate: 0.625, rate_change: 0, source_url: '' },
  { id: '42', bank_name: '尼崎信用金庫', bank_code: 'amagasaki_shinkin', rate_type: '変動金利', rate: 0.575, rate_date: '2024-12-01', previous_rate: 0.575, rate_change: 0, source_url: '' },
  { id: '43', bank_name: '北おおさか信用金庫', bank_code: 'kitaosaka_shinkin', rate_type: '変動金利', rate: 0.600, rate_date: '2024-12-01', previous_rate: 0.600, rate_change: 0, source_url: '' },
]

export default function LoanRatesPage() {
  const [rates, setRates] = useState<LoanRate[]>(MOCK_RATES)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRateType, setSelectedRateType] = useState<string>('変動金利')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cron/loan-rates')
      const data = await response.json()
      if (data.success && data.data && data.data.length > 0) {
        setRates(data.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching rates:', error)
      // デモデータを維持
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込み時にAPIからデータ取得
  useEffect(() => {
    fetchRates()
  }, [])

  const refreshRates = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/cron/loan-rates', { method: 'POST' })
      await fetchRates()
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing rates:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // カテゴリ別に分類
  const categorizedRates = useMemo(() => {
    const getBankCategory = (code: string): BankCategory | null => {
      const config = BANK_CRAWL_CONFIGS.find(b => b.bankCode === code)
      return config?.category || null
    }

    return {
      flat35: rates.filter(r => getBankCategory(r.bank_code) === 'flat35'),
      net: rates.filter(r => getBankCategory(r.bank_code) === 'net'),
      mega: rates.filter(r => getBankCategory(r.bank_code) === 'mega'),
      kansai_regional: rates.filter(r => getBankCategory(r.bank_code) === 'kansai_regional'),
      credit_union: rates.filter(r => getBankCategory(r.bank_code) === 'credit_union'),
    }
  }, [rates])

  // 金利タイプでフィルタ
  const filteredRates = useMemo(() => {
    if (selectedRateType === 'all') return rates
    return rates.filter(r => r.rate_type.includes(selectedRateType))
  }, [rates, selectedRateType])

  // 最低金利の計算
  const lowestRates = useMemo(() => {
    const variableRates = rates.filter(r => r.rate_type === '変動金利')
    const fixed10Rates = rates.filter(r => r.rate_type.includes('固定10年'))

    return {
      variable: variableRates.length > 0 ? Math.min(...variableRates.map(r => r.rate)) : null,
      variableBank: variableRates.reduce((min, r) => r.rate < (min?.rate || Infinity) ? r : min, variableRates[0])?.bank_name,
      fixed10: fixed10Rates.length > 0 ? Math.min(...fixed10Rates.map(r => r.rate)) : null,
      fixed10Bank: fixed10Rates.reduce((min, r) => r.rate < (min?.rate || Infinity) ? r : min, fixed10Rates[0])?.bank_name,
    }
  }, [rates])

  const RateChangeIndicator = ({ change }: { change: number | null }) => {
    if (change === null || change === 0) {
      return <span className="text-gray-400 text-sm">-</span>
    }
    if (change > 0) {
      return (
        <span className="flex items-center text-red-500 text-sm">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{(change * 100).toFixed(2)}bp
        </span>
      )
    }
    return (
      <span className="flex items-center text-green-500 text-sm">
        <TrendingDown className="w-3 h-3 mr-1" />
        {(change * 100).toFixed(2)}bp
      </span>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flat35': return <Building2 className="w-5 h-5" />
      case 'net': return <Smartphone className="w-5 h-5" />
      case 'mega': return <Landmark className="w-5 h-5" />
      case 'kansai_regional': return <Building className="w-5 h-5" />
      case 'credit_union': return <Wallet className="w-5 h-5" />
      default: return <Landmark className="w-5 h-5" />
    }
  }

  const RateTable = ({ data, showRateType = true }: { data: LoanRate[], showRateType?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">銀行名</TableHead>
          {showRateType && <TableHead>金利タイプ</TableHead>}
          <TableHead className="text-right w-[100px]">適用金利</TableHead>
          <TableHead className="text-right w-[100px]">前月比</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showRateType ? 5 : 4} className="text-center text-muted-foreground py-8">
              データがありません
            </TableCell>
          </TableRow>
        ) : (
          data.map((rate) => (
            <TableRow key={rate.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{rate.bank_name}</TableCell>
              {showRateType && (
                <TableCell>
                  <Badge variant="outline" className="text-xs">{rate.rate_type}</Badge>
                </TableCell>
              )}
              <TableCell className="text-right">
                <span className="font-mono text-lg font-semibold">{rate.rate.toFixed(3)}%</span>
              </TableCell>
              <TableCell className="text-right">
                <RateChangeIndicator change={rate.rate_change} />
              </TableCell>
              <TableCell>
                {rate.source_url && (
                  <a
                    href={rate.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">住宅ローン金利情報</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            最終更新: {lastUpdated.toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRateType} onValueChange={setSelectedRateType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="金利タイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="変動金利">変動金利</SelectItem>
              <SelectItem value="固定10年">固定10年</SelectItem>
              <SelectItem value="固定35年">固定35年</SelectItem>
              <SelectItem value="フラット35">フラット35</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshRates} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">変動金利 最安</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  {lowestRates.variable?.toFixed(3) || '-'}%
                </p>
                <p className="text-xs text-green-600 mt-1">{lowestRates.variableBank}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">固定10年 最安</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">
                  {lowestRates.fixed10?.toFixed(3) || '-'}%
                </p>
                <p className="text-xs text-blue-600 mt-1">{lowestRates.fixed10Bank}</p>
              </div>
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">フラット35</p>
                <p className="text-3xl font-bold text-orange-800 mt-1">
                  {categorizedRates.flat35.find(r => r.rate_type.includes('21-35年'))?.rate.toFixed(3) || '-'}%
                </p>
                <p className="text-xs text-orange-600 mt-1">21-35年固定</p>
              </div>
              <Landmark className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">登録銀行数</p>
                <p className="text-3xl font-bold mt-1">{BANK_CRAWL_CONFIGS.length}</p>
                <p className="text-xs text-muted-foreground mt-1">関西の銀行中心</p>
              </div>
              <Building className="w-10 h-10 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 金利一覧（タブ切り替え） */}
      <Tabs defaultValue="net" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="net" className="flex items-center gap-1">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">ネット銀行</span>
          </TabsTrigger>
          <TabsTrigger value="mega" className="flex items-center gap-1">
            <Landmark className="w-4 h-4" />
            <span className="hidden sm:inline">メガバンク</span>
          </TabsTrigger>
          <TabsTrigger value="kansai" className="flex items-center gap-1">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">地方銀行</span>
          </TabsTrigger>
          <TabsTrigger value="shinkin" className="flex items-center gap-1">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">信用金庫</span>
          </TabsTrigger>
          <TabsTrigger value="flat35" className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">フラット35</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="net">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                ネット銀行
              </CardTitle>
              <CardDescription>低金利で人気のネット銀行の住宅ローン</CardDescription>
            </CardHeader>
            <CardContent>
              <RateTable data={categorizedRates.net} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mega">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                メガバンク
              </CardTitle>
              <CardDescription>三菱UFJ・三井住友・みずほ・りそな</CardDescription>
            </CardHeader>
            <CardContent>
              <RateTable data={categorizedRates.mega} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kansai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                関西の地方銀行
              </CardTitle>
              <CardDescription>関西みらい・池田泉州・京都銀行など</CardDescription>
            </CardHeader>
            <CardContent>
              <RateTable data={categorizedRates.kansai_regional} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shinkin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                信用金庫
              </CardTitle>
              <CardDescription>大阪・兵庫・京都の信用金庫</CardDescription>
            </CardHeader>
            <CardContent>
              <RateTable data={categorizedRates.credit_union} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flat35">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                フラット35（住宅金融支援機構）
              </CardTitle>
              <CardDescription>長期固定金利の住宅ローン</CardDescription>
            </CardHeader>
            <CardContent>
              <RateTable data={categorizedRates.flat35} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 注意事項 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-800">
              <p className="font-medium">金利情報について</p>
              <ul className="list-disc pl-4 space-y-1 text-blue-700">
                <li>表示金利は各銀行の公式サイトに基づいています</li>
                <li>実際の適用金利は審査結果により異なる場合があります</li>
                <li>諸費用・保証料・団信保険料などは別途必要です</li>
                <li>最新の正確な情報は各銀行にお問い合わせください</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
