'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Database,
  Users,
  FileText,
  Landmark,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { toast } from 'sonner'
import {
  collectBackupData,
  downloadBackup,
  exportToCSV,
  validateBackupData,
  restoreFromBackup,
  calculateStorageUsage,
  clearAllData,
  BackupData,
} from '@/lib/backup-export'
import { useCustomerStore } from '@/store'
import { useLoanStore } from '@/store/loan-store'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function BackupPage() {
  const router = useRouter()
  const { customers } = useCustomerStore()
  const { loans } = useLoanStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [storageInfo, setStorageInfo] = useState<ReturnType<typeof calculateStorageUsage> | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [pendingBackupData, setPendingBackupData] = useState<BackupData | null>(null)

  // ストレージ情報を更新
  const updateStorageInfo = useCallback(() => {
    setStorageInfo(calculateStorageUsage())
  }, [])

  useEffect(() => {
    updateStorageInfo()
  }, [updateStorageInfo])

  // フルバックアップ
  const handleFullBackup = async () => {
    setIsExporting(true)
    try {
      const data = collectBackupData()
      downloadBackup(data)
      toast.success('バックアップファイルをダウンロードしました')
    } catch (error) {
      toast.error('バックアップに失敗しました')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  // 顧客データCSVエクスポート
  const handleExportCustomersCSV = () => {
    try {
      exportToCSV(
        customers.map((c) => ({
          id: c.id,
          name: c.name,
          name_kana: c.name_kana || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          assigned_to: c.assigned_to || '',
          lead_source: c.lead_source || '',
          created_at: c.created_at,
        })),
        `顧客データ_${format(new Date(), 'yyyyMMdd')}`,
        [
          { key: 'id', label: 'ID' },
          { key: 'name', label: '氏名' },
          { key: 'name_kana', label: 'フリガナ' },
          { key: 'phone', label: '電話番号' },
          { key: 'email', label: 'メール' },
          { key: 'address', label: '住所' },
          { key: 'assigned_to', label: '担当者' },
          { key: 'lead_source', label: '来店経路' },
          { key: 'created_at', label: '登録日' },
        ]
      )
      toast.success('顧客データをCSV出力しました')
    } catch (error) {
      toast.error('エクスポートに失敗しました')
      console.error(error)
    }
  }

  // ローンデータCSVエクスポート
  const handleExportLoansCSV = () => {
    try {
      exportToCSV(
        loans.map((l) => ({
          id: l.id,
          customerName: l.customerName,
          bank: l.bank,
          loanType: l.loanType,
          amount: l.amount,
          interestRate: l.interestRate,
          years: l.years,
          monthlyPayment: l.monthlyPayment,
          status: l.status,
          createdAt: l.createdAt,
        })),
        `ローンデータ_${format(new Date(), 'yyyyMMdd')}`,
        [
          { key: 'id', label: 'ID' },
          { key: 'customerName', label: '顧客名' },
          { key: 'bank', label: '金融機関' },
          { key: 'loanType', label: 'ローン種別' },
          { key: 'amount', label: '借入額' },
          { key: 'interestRate', label: '金利' },
          { key: 'years', label: '返済年数' },
          { key: 'monthlyPayment', label: '月々返済額' },
          { key: 'status', label: 'ステータス' },
          { key: 'createdAt', label: '登録日' },
        ]
      )
      toast.success('ローンデータをCSV出力しました')
    } catch (error) {
      toast.error('エクスポートに失敗しました')
      console.error(error)
    }
  }

  // バックアップファイルの読み込み
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!validateBackupData(data)) {
        toast.error('無効なバックアップファイルです')
        return
      }

      setPendingBackupData(data)
      setShowRestoreConfirm(true)
    } catch (error) {
      toast.error('ファイルの読み込みに失敗しました')
      console.error(error)
    }

    // inputをリセット
    e.target.value = ''
  }

  // データ復元
  const handleRestore = async () => {
    if (!pendingBackupData) return

    setIsRestoring(true)
    setShowRestoreConfirm(false)

    try {
      const result = restoreFromBackup(pendingBackupData)
      if (result.success) {
        toast.success('データを復元しました。ページを再読み込みしてください。')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(`復元に失敗しました: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      toast.error('復元中にエラーが発生しました')
      console.error(error)
    } finally {
      setIsRestoring(false)
      setPendingBackupData(null)
    }
  }

  // データクリア
  const handleClearData = () => {
    clearAllData()
    setShowClearConfirm(false)
    toast.success('すべてのデータを削除しました。ページを再読み込みしてください。')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStorageIcon = (key: string) => {
    if (key.includes('customer')) return Users
    if (key.includes('contract')) return FileText
    if (key.includes('loan')) return Landmark
    if (key.includes('master')) return Database
    if (key.includes('security')) return Settings
    return Database
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
          <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg">
            <Download className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">バックアップ・エクスポート</h1>
            <p className="text-gray-500">データのバックアップと出力を管理</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* バックアップ */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-purple-500" />
                フルバックアップ
              </CardTitle>
              <CardDescription>
                すべてのデータをJSON形式でバックアップします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleFullBackup}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-purple-500 to-violet-500"
                >
                  {isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  バックアップを作成
                </Button>
                <span className="text-sm text-gray-500">
                  顧客、契約、ローン、マスターデータをすべて含む
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">バックアップから復元</h4>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isRestoring}
                    />
                    <Button variant="outline" asChild disabled={isRestoring}>
                      <span>
                        {isRestoring ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        ファイルを選択
                      </span>
                    </Button>
                  </label>
                  <span className="text-sm text-gray-500">
                    JSONバックアップファイルを選択してください
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ストレージ使用量 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                ストレージ使用量
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageInfo && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>使用量</span>
                      <span>
                        {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                      </span>
                    </div>
                    <Progress
                      value={(storageInfo.used / storageInfo.total) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    {storageInfo.breakdown.slice(0, 5).map((item) => {
                      const Icon = getStorageIcon(item.key)
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[120px]">
                              {item.key.replace('ghouse-', '')}
                            </span>
                          </div>
                          <span className="text-gray-500">{formatBytes(item.size)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={updateStorageInfo}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    更新
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* CSVエクスポート */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                CSVエクスポート
              </CardTitle>
              <CardDescription>
                個別のデータをCSV形式でエクスポートします（Excel対応）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">顧客データ</p>
                      <p className="text-sm text-gray-500">{customers.length}件</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCustomersCSV}
                    disabled={customers.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSVダウンロード
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Landmark className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">ローンデータ</p>
                      <p className="text-sm text-gray-500">{loans.length}件</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLoansCSV}
                    disabled={loans.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSVダウンロード
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* データ管理 */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                データ管理
              </CardTitle>
              <CardDescription>
                注意: この操作は取り消せません
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                すべてのデータを削除
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                削除前にバックアップを作成することをお勧めします
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 復元確認ダイアログ */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>データを復元しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBackupData && (
                <div className="space-y-2 mt-2">
                  <p>バックアップ日時: {format(new Date(pendingBackupData.exportedAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</p>
                  <p>バージョン: {pendingBackupData.version}</p>
                  <p className="text-red-600">
                    現在のデータは上書きされます。この操作は取り消せません。
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleRestore}
            >
              復元する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>すべてのデータを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="text-red-600 font-medium">
                この操作は取り消せません！
              </p>
              <p className="mt-2">
                すべての顧客データ、契約データ、ローンデータ、マスターデータが削除されます。
                削除前にバックアップを作成することを強くお勧めします。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleClearData}
            >
              すべて削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
