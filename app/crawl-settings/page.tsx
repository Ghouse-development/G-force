'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Bell,
  Settings,
  Calendar,
  Activity,
  Zap,
  AlertTriangle,
  Database,
  Users,
} from 'lucide-react'
import Link from 'next/link'

interface CrawlLog {
  id: string
  crawl_type: string
  source: string | null
  status: 'success' | 'error' | 'partial'
  items_fetched: number
  items_new: number
  items_updated: number
  error_message: string | null
  started_at: string
  finished_at: string | null
  created_at: string
}

interface CrawlStats {
  totalProperties: number
  todayCrawls: number
  lastCrawl: string | null
  matchedAlerts: number
}

export default function CrawlSettingsPage() {
  const [logs, setLogs] = useState<CrawlLog[]>([])
  const [stats, setStats] = useState<CrawlStats>({
    totalProperties: 0,
    todayCrawls: 0,
    lastCrawl: null,
    matchedAlerts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [crawlType, setCrawlType] = useState<'properties' | 'loan-rates'>('properties')

  // 設定
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [dailyLimit, setDailyLimit] = useState('2')
  const [crawlTime, setCrawlTime] = useState('09:00')

  // データ取得
  const fetchData = async () => {
    setLoading(true)
    try {
      // クロールログ取得
      const logsRes = await fetch('/api/crawl-logs')
      const logsData = await logsRes.json()
      if (logsData.success) {
        setLogs(logsData.data || [])
        setStats(logsData.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // クロール実行
  const runCrawl = async () => {
    // 1日2回制限チェック
    if (stats.todayCrawls >= parseInt(dailyLimit)) {
      alert(`本日のクロール回数が上限（${dailyLimit}回）に達しています`)
      return
    }

    setCrawling(true)
    try {
      const endpoint = crawlType === 'properties'
        ? '/api/cron/properties'
        : '/api/cron/loan-rates'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full', maxPages: 3 }),
      })

      const data = await res.json()
      console.log('Crawl result:', data)

      // 再読み込み
      await fetchData()
    } catch (error) {
      console.error('Crawl error:', error)
    } finally {
      setCrawling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />成功</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />エラー</Badge>
      case 'partial':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />一部成功</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            クロール設定・管理
          </h1>
          <p className="text-muted-foreground mt-1">
            土地情報・金利情報の自動取得を管理
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={crawlType} onValueChange={(v) => setCrawlType(v as 'properties' | 'loan-rates')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="properties">土地情報（SUUMO）</SelectItem>
              <SelectItem value="loan-rates">住宅ローン金利</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={runCrawl}
            disabled={crawling || stats.todayCrawls >= parseInt(dailyLimit)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {crawling ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                今すぐ実行
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">取得済み物件</p>
                <p className="text-3xl font-bold mt-1">{stats.totalProperties}</p>
              </div>
              <Database className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.todayCrawls >= parseInt(dailyLimit) ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本日のクロール</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.todayCrawls} / {dailyLimit}
                </p>
              </div>
              <Zap className={`w-10 h-10 ${stats.todayCrawls >= parseInt(dailyLimit) ? 'text-red-400' : 'text-green-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">最終実行</p>
                <p className="text-lg font-bold mt-1">
                  {stats.lastCrawl ? formatDate(stats.lastCrawl) : '未実行'}
                </p>
              </div>
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <Link href="/property-alerts">
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-orange-700">マッチした通知</p>
                  <p className="text-3xl font-bold text-orange-800 mt-1">{stats.matchedAlerts}</p>
                </div>
                <Bell className="w-10 h-10 text-orange-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 設定・ログ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 自動クロール設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              自動クロール設定
            </CardTitle>
            <CardDescription>
              Vercel Cronで毎日自動実行されます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-crawl">自動クロール</Label>
              <Switch
                id="auto-crawl"
                checked={autoEnabled}
                onCheckedChange={setAutoEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>1日の実行上限</Label>
              <Select value={dailyLimit} onValueChange={setDailyLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1回/日</SelectItem>
                  <SelectItem value="2">2回/日（推奨）</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                API負荷軽減のため2回までに制限
              </p>
            </div>

            <div className="space-y-2">
              <Label>実行時刻</Label>
              <Select value={crawlTime} onValueChange={setCrawlTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">06:00</SelectItem>
                  <SelectItem value="09:00">09:00（推奨）</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                vercel.json で設定済み（毎日9時・10時）
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium">現在の設定（vercel.json）</p>
              <div className="bg-muted p-3 rounded-lg text-xs font-mono">
                <p>土地クロール: 毎日 10:00 JST</p>
                <p>金利クロール: 毎日 09:00 JST</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 顧客紐付け */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              顧客紐付け・通知
            </CardTitle>
            <CardDescription>
              条件に合う物件が見つかると顧客に通知
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">仕組み</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal pl-4">
                <li>顧客ごとに「物件アラート」を設定</li>
                <li>クロールで新規物件を取得</li>
                <li>条件マッチングを自動実行</li>
                <li>マッチした物件を通知一覧に表示</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Link href="/property-alerts">
                <Button className="w-full" variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  通知一覧を見る
                </Button>
              </Link>
              <Link href="/customers">
                <Button className="w-full" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  顧客一覧を見る
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">アラート条件の例</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>・エリア: 豊中市、吹田市</li>
                <li>・価格: 2,000〜3,500万円</li>
                <li>・面積: 100㎡以上</li>
                <li>・駅徒歩: 15分以内</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* クイックリンク */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              関連ページ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/property-alerts">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">土地情報アラート</p>
                    <p className="text-sm text-muted-foreground">物件通知・アラート設定</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loan-rates">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium">住宅ローン金利</p>
                    <p className="text-sm text-muted-foreground">銀行別金利一覧</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/customers">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium">顧客管理</p>
                    <p className="text-sm text-muted-foreground">顧客情報・アラート紐付け</p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* クロールログ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                クロール実行ログ
              </CardTitle>
              <CardDescription>
                直近のクロール実行履歴
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>クロール履歴がありません</p>
              <p className="text-sm mt-2">「今すぐ実行」ボタンでクロールを開始してください</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>実行日時</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">取得件数</TableHead>
                  <TableHead className="text-right">新規</TableHead>
                  <TableHead>エラー</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.started_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.crawl_type === 'properties' ? '土地' : '金利'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right font-mono">{log.items_fetched}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">+{log.items_new}</TableCell>
                    <TableCell className="text-sm text-red-500 truncate max-w-[200px]">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ヘルプ */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-purple-900">動作確認方法</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>1. 「今すぐ実行」ボタンでクロールを手動実行</li>
                <li>2. 実行ログで「成功」ステータスを確認</li>
                <li>3. 「土地情報アラート」ページで取得した物件を確認</li>
                <li>4. Vercel ダッシュボード → Functions → Cron Jobs で自動実行を確認</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
