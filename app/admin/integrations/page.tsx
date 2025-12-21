'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store'
import {
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Copy,
  Settings,
  Database,
  FileSpreadsheet,
  Webhook,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
} from 'lucide-react'
import Link from 'next/link'

interface SyncLog {
  id: string
  entityType: string
  entityId: string
  kintoneRecordId: string | null
  direction: string
  status: string
  error?: string
  syncedAt: string
}

interface KintoneStatus {
  enabled: boolean
  connected: boolean
  message: string
}

export default function IntegrationsPage() {
  const { user } = useAuthStore()
  const [kintoneStatus, setKintoneStatus] = useState<KintoneStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    checkKintoneStatus()
    loadSyncLogs()
    // Webhook URLを生成
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/formbridge`)
    }
  }, [])

  const checkKintoneStatus = async () => {
    try {
      const res = await fetch('/api/kintone/status')
      const data = await res.json()
      setKintoneStatus(data)
    } catch {
      setKintoneStatus({ enabled: false, connected: false, message: '接続エラー' })
    } finally {
      setLoading(false)
    }
  }

  const loadSyncLogs = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ghouse-kintone-sync-log')
      if (stored) {
        setSyncLogs(JSON.parse(stored).slice(0, 20))
      }
    }
  }

  const handleSyncToKintone = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/kintone/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`同期完了: ${data.synced}件成功, ${data.failed}件失敗`)
        loadSyncLogs()
      } else {
        alert(`同期エラー: ${data.error}`)
      }
    } catch {
      alert('同期中にエラーが発生しました')
    } finally {
      setSyncing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                管理画面
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">外部連携</h1>
              <p className="text-gray-500 mt-1">外部サービスとの連携を管理</p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">kintone</p>
                    <p className="text-sm text-gray-500">顧客データ同期</p>
                  </div>
                </div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : kintoneStatus?.connected ? (
                  <Badge className="bg-green-100 text-green-700">接続中</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600">未接続</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Webhook className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Formbridge</p>
                    <p className="text-sm text-gray-500">Webhook受信</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">設定済み</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">スプレッドシート</p>
                    <p className="text-sm text-gray-500">データインポート</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">設定済み</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kintone" className="space-y-4">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="kintone" className="data-[state=active]:bg-orange-50">
              <Database className="w-4 h-4 mr-2" />
              kintone連携
            </TabsTrigger>
            <TabsTrigger value="formbridge" className="data-[state=active]:bg-orange-50">
              <Webhook className="w-4 h-4 mr-2" />
              Formbridge
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="data-[state=active]:bg-orange-50">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              スプレッドシート
            </TabsTrigger>
          </TabsList>

          {/* kintone Tab */}
          <TabsContent value="kintone" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>kintone連携設定</CardTitle>
                <CardDescription>
                  kintoneとの顧客データ双方向同期を設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {kintoneStatus?.connected ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">接続ステータス</p>
                        <p className="text-sm text-gray-500">{kintoneStatus?.message}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={checkKintoneStatus}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      再確認
                    </Button>
                  </div>
                </div>

                {/* Environment Variables Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">環境変数の設定</h3>
                  <p className="text-sm text-gray-500">
                    以下の環境変数を.env.localに設定してください
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-1">
                    <p>KINTONE_DOMAIN=your-subdomain.cybozu.com</p>
                    <p>KINTONE_API_TOKEN=your-api-token</p>
                    <p>KINTONE_APP_ID=123</p>
                  </div>
                </div>

                {/* Sync Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSyncToKintone}
                    disabled={!kintoneStatus?.connected || syncing}
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    kintoneに同期
                  </Button>
                  <Button variant="outline" disabled={!kintoneStatus?.connected}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    kintoneを開く
                  </Button>
                </div>

                {/* Sync Logs */}
                {syncLogs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      同期履歴
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {syncLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center space-x-3">
                            {log.status === 'success' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span>{log.entityType}</span>
                            <span className="text-gray-400">→</span>
                            <span>{log.direction === 'to_kintone' ? 'kintone' : 'G-force'}</span>
                          </div>
                          <span className="text-gray-400">
                            {new Date(log.syncedAt).toLocaleString('ja-JP')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formbridge Tab */}
          <TabsContent value="formbridge" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Formbridge Webhook設定</CardTitle>
                <CardDescription>
                  Formbridgeからのアンケート・ヒアリングデータを受信して顧客に紐付けます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" onClick={() => copyToClipboard(webhookUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    このURLをFormbridgeのWebhook設定に登録してください
                  </p>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">設定手順</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Formbridgeの管理画面で対象フォームを開く</li>
                    <li>「Webhook」設定を選択</li>
                    <li>上記URLを「送信先URL」に入力</li>
                    <li>「送信タイミング」で「レコード追加時」を選択</li>
                    <li>保存して設定完了</li>
                  </ol>
                </div>

                {/* Field Mapping */}
                <div className="space-y-4">
                  <h3 className="font-semibold">フィールドマッピング</h3>
                  <p className="text-sm text-gray-500">
                    Formbridgeのフィールド名と顧客データのマッピング
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded">顧客名 → name</div>
                    <div className="p-2 bg-gray-50 rounded">電話番号 → phone</div>
                    <div className="p-2 bg-gray-50 rounded">メール → email</div>
                    <div className="p-2 bg-gray-50 rounded">住所 → address</div>
                    <div className="p-2 bg-gray-50 rounded">アンケート回答 → survey_data</div>
                    <div className="p-2 bg-gray-50 rounded">反響媒体 → lead_source</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spreadsheet Tab */}
          <TabsContent value="spreadsheet" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Googleスプレッドシート連携</CardTitle>
                <CardDescription>
                  来場予約・問い合わせ・資料請求データをスプレッドシートからインポート
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Spreadsheet ID */}
                <div className="space-y-2">
                  <Label>スプレッドシートID</Label>
                  <Input placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" />
                  <p className="text-sm text-gray-500">
                    GoogleスプレッドシートのURLから取得できます
                  </p>
                </div>

                {/* Sheet Names */}
                <div className="space-y-4">
                  <h3 className="font-semibold">インポート対象シート</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">来場予約</p>
                        <p className="text-sm text-gray-500">シート名: 来場予約</p>
                      </div>
                      <Button size="sm" variant="outline">
                        インポート
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">問い合わせ</p>
                        <p className="text-sm text-gray-500">シート名: 問い合わせ</p>
                      </div>
                      <Button size="sm" variant="outline">
                        インポート
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">資料請求</p>
                        <p className="text-sm text-gray-500">シート名: 資料請求</p>
                      </div>
                      <Button size="sm" variant="outline">
                        インポート
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">設定手順</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Googleスプレッドシートを開く</li>
                    <li>「共有」からサービスアカウントのメールを追加</li>
                    <li>上記のスプレッドシートIDを入力</li>
                    <li>各シートの「インポート」ボタンで取り込み</li>
                  </ol>
                </div>

                {/* Environment Variables */}
                <div className="space-y-4">
                  <h3 className="font-semibold">環境変数の設定</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-1">
                    <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com</p>
                    <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...&quot;</p>
                    <p>GOOGLE_SPREADSHEET_ID=your-spreadsheet-id</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
