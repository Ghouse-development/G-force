'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Shield,
  Key,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  LogIn,
  LogOut,
  Edit,
  Plus,
  Activity,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { useSecurityStore, AccessLog, RolePermission } from '@/store/security-store'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function SecurityPage() {
  const router = useRouter()
  const {
    accessLogs,
    rolePermissions,
    settings,
    updateRolePermission,
    updateSettings,
    clearOldLogs,
  } = useSecurityStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<AccessLog['action'] | 'all'>('all')
  const [selectedRole, setSelectedRole] = useState<RolePermission['role']>('staff')

  // ログのフィルタリング
  const filteredLogs = accessLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  // アクションのラベルとアイコン
  const getActionInfo = (action: AccessLog['action']) => {
    switch (action) {
      case 'login':
        return { label: 'ログイン', icon: LogIn, color: 'text-green-600 bg-green-100' }
      case 'logout':
        return { label: 'ログアウト', icon: LogOut, color: 'text-gray-600 bg-gray-100' }
      case 'view':
        return { label: '閲覧', icon: Eye, color: 'text-blue-600 bg-blue-100' }
      case 'create':
        return { label: '作成', icon: Plus, color: 'text-emerald-600 bg-emerald-100' }
      case 'update':
        return { label: '更新', icon: Edit, color: 'text-yellow-600 bg-yellow-100' }
      case 'delete':
        return { label: '削除', icon: Trash2, color: 'text-red-600 bg-red-100' }
      case 'export':
        return { label: 'エクスポート', icon: Download, color: 'text-purple-600 bg-purple-100' }
      case 'failed_login':
        return { label: 'ログイン失敗', icon: AlertTriangle, color: 'text-red-600 bg-red-100' }
      default:
        return { label: action, icon: Activity, color: 'text-gray-600 bg-gray-100' }
    }
  }

  const currentRolePermissions = rolePermissions.find((rp) => rp.role === selectedRole)

  const handlePermissionChange = (
    category: keyof RolePermission['permissions'],
    permission: string,
    value: boolean
  ) => {
    updateRolePermission(selectedRole, {
      [category]: { [permission]: value },
    })
    toast.success('権限を更新しました')
  }

  const handleSettingsChange = (
    section: 'passwordPolicy' | 'sessionPolicy' | 'loginPolicy',
    key: string,
    value: number | boolean
  ) => {
    updateSettings({
      [section]: { [key]: value },
    })
    toast.success('設定を更新しました')
  }

  const handleClearLogs = (days: number) => {
    clearOldLogs(days)
    toast.success(`${days}日以上前のログを削除しました`)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者'
      case 'manager': return '部門長'
      case 'staff': return '営業'
      default: return role
    }
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
          <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">セキュリティ設定</h1>
            <p className="text-gray-500">アクセス権限とセキュリティポリシーを管理</p>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="permissions" className="gap-2">
              <Users className="h-4 w-4" />
              ロール権限
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <Key className="h-4 w-4" />
              セキュリティポリシー
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              アクセスログ
            </TabsTrigger>
          </TabsList>

          {/* ロール権限タブ */}
          <TabsContent value="permissions">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ロール選択 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">ロール選択</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {(['admin', 'manager', 'staff'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 text-left transition-colors',
                          selectedRole === role
                            ? 'bg-red-50 border-l-4 border-red-500'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <Users
                          className={cn(
                            'h-5 w-5',
                            selectedRole === role ? 'text-red-500' : 'text-gray-400'
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              'font-medium',
                              selectedRole === role ? 'text-red-700' : 'text-gray-700'
                            )}
                          >
                            {getRoleLabel(role)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 権限設定 */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>{getRoleLabel(selectedRole)}の権限</CardTitle>
                  <CardDescription>
                    各機能へのアクセス権限を設定します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentRolePermissions && (
                    <div className="space-y-6">
                      {/* 顧客管理 */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">顧客管理</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(['view', 'create', 'edit', 'delete'] as const).map((perm) => (
                            <div key={perm} className="flex items-center gap-2">
                              <Switch
                                checked={currentRolePermissions.permissions.customers[perm]}
                                onCheckedChange={(v) =>
                                  handlePermissionChange('customers', perm, v)
                                }
                                disabled={selectedRole === 'admin'}
                              />
                              <Label>
                                {perm === 'view' && '閲覧'}
                                {perm === 'create' && '作成'}
                                {perm === 'edit' && '編集'}
                                {perm === 'delete' && '削除'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 契約管理 */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">契約管理</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {(['view', 'create', 'edit', 'delete', 'approve'] as const).map((perm) => (
                            <div key={perm} className="flex items-center gap-2">
                              <Switch
                                checked={currentRolePermissions.permissions.contracts[perm]}
                                onCheckedChange={(v) =>
                                  handlePermissionChange('contracts', perm, v)
                                }
                                disabled={selectedRole === 'admin'}
                              />
                              <Label>
                                {perm === 'view' && '閲覧'}
                                {perm === 'create' && '作成'}
                                {perm === 'edit' && '編集'}
                                {perm === 'delete' && '削除'}
                                {perm === 'approve' && '承認'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 管理機能 */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">管理機能</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(['view', 'manageUsers', 'manageMasterData', 'viewLogs'] as const).map(
                            (perm) => (
                              <div key={perm} className="flex items-center gap-2">
                                <Switch
                                  checked={currentRolePermissions.permissions.admin[perm]}
                                  onCheckedChange={(v) =>
                                    handlePermissionChange('admin', perm, v)
                                  }
                                  disabled={selectedRole === 'admin'}
                                />
                                <Label>
                                  {perm === 'view' && '画面表示'}
                                  {perm === 'manageUsers' && 'ユーザー管理'}
                                  {perm === 'manageMasterData' && 'マスター管理'}
                                  {perm === 'viewLogs' && 'ログ閲覧'}
                                </Label>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* エクスポート */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">エクスポート</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {(['customers', 'contracts', 'reports'] as const).map((perm) => (
                            <div key={perm} className="flex items-center gap-2">
                              <Switch
                                checked={currentRolePermissions.permissions.export[perm]}
                                onCheckedChange={(v) =>
                                  handlePermissionChange('export', perm, v)
                                }
                                disabled={selectedRole === 'admin'}
                              />
                              <Label>
                                {perm === 'customers' && '顧客データ'}
                                {perm === 'contracts' && '契約データ'}
                                {perm === 'reports' && 'レポート'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedRole === 'admin' && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          管理者の権限は変更できません
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* セキュリティポリシータブ */}
          <TabsContent value="policies">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* パスワードポリシー */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-red-500" />
                    パスワードポリシー
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>最小文字数: {settings.passwordPolicy.minLength}</Label>
                    <Slider
                      value={[settings.passwordPolicy.minLength]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('passwordPolicy', 'minLength', v)
                      }
                      min={6}
                      max={16}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>大文字を含む</Label>
                      <Switch
                        checked={settings.passwordPolicy.requireUppercase}
                        onCheckedChange={(v) =>
                          handleSettingsChange('passwordPolicy', 'requireUppercase', v)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>小文字を含む</Label>
                      <Switch
                        checked={settings.passwordPolicy.requireLowercase}
                        onCheckedChange={(v) =>
                          handleSettingsChange('passwordPolicy', 'requireLowercase', v)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>数字を含む</Label>
                      <Switch
                        checked={settings.passwordPolicy.requireNumbers}
                        onCheckedChange={(v) =>
                          handleSettingsChange('passwordPolicy', 'requireNumbers', v)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>特殊文字を含む</Label>
                      <Switch
                        checked={settings.passwordPolicy.requireSpecialChars}
                        onCheckedChange={(v) =>
                          handleSettingsChange('passwordPolicy', 'requireSpecialChars', v)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>パスワード有効期限（日）: {settings.passwordPolicy.expiryDays}</Label>
                    <Slider
                      value={[settings.passwordPolicy.expiryDays]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('passwordPolicy', 'expiryDays', v)
                      }
                      min={30}
                      max={365}
                      step={30}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* セッションポリシー */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    セッションポリシー
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      セッションタイムアウト（分）: {settings.sessionPolicy.timeoutMinutes}
                    </Label>
                    <Slider
                      value={[settings.sessionPolicy.timeoutMinutes]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('sessionPolicy', 'timeoutMinutes', v)
                      }
                      min={15}
                      max={480}
                      step={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>最大同時セッション数: {settings.sessionPolicy.maxSessions}</Label>
                    <Slider
                      value={[settings.sessionPolicy.maxSessions]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('sessionPolicy', 'maxSessions', v)
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      ログイン維持期間（日）: {settings.sessionPolicy.rememberMeDays}
                    </Label>
                    <Slider
                      value={[settings.sessionPolicy.rememberMeDays]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('sessionPolicy', 'rememberMeDays', v)
                      }
                      min={1}
                      max={90}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ログインポリシー */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    ログインポリシー
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      ロックまでの失敗回数: {settings.loginPolicy.maxFailedAttempts}
                    </Label>
                    <Slider
                      value={[settings.loginPolicy.maxFailedAttempts]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('loginPolicy', 'maxFailedAttempts', v)
                      }
                      min={3}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ロック解除までの時間（分）: {settings.loginPolicy.lockoutMinutes}</Label>
                    <Slider
                      value={[settings.loginPolicy.lockoutMinutes]}
                      onValueChange={([v]: number[]) =>
                        handleSettingsChange('loginPolicy', 'lockoutMinutes', v)
                      }
                      min={5}
                      max={120}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>二要素認証を必須にする</Label>
                    <Switch
                      checked={settings.loginPolicy.requireTwoFactor}
                      onCheckedChange={(v) =>
                        handleSettingsChange('loginPolicy', 'requireTwoFactor', v)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* アクセスログタブ */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>アクセスログ</CardTitle>
                    <CardDescription>
                      ユーザーの操作履歴を確認できます（{accessLogs.length}件）
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={actionFilter}
                      onValueChange={(v) => setActionFilter(v as typeof actionFilter)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="アクション" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="login">ログイン</SelectItem>
                        <SelectItem value="logout">ログアウト</SelectItem>
                        <SelectItem value="view">閲覧</SelectItem>
                        <SelectItem value="create">作成</SelectItem>
                        <SelectItem value="update">更新</SelectItem>
                        <SelectItem value="delete">削除</SelectItem>
                        <SelectItem value="export">エクスポート</SelectItem>
                        <SelectItem value="failed_login">ログイン失敗</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-[200px]"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearLogs(30)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      30日前を削除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    ログがありません
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日時</TableHead>
                          <TableHead>ユーザー</TableHead>
                          <TableHead>アクション</TableHead>
                          <TableHead>リソース</TableHead>
                          <TableHead>詳細</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.slice(0, 100).map((log) => {
                          const actionInfo = getActionInfo(log.action)
                          const ActionIcon = actionInfo.icon
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm text-gray-500">
                                {format(new Date(log.timestamp), 'MM/dd HH:mm', { locale: ja })}
                              </TableCell>
                              <TableCell className="font-medium">{log.userName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={cn('gap-1', actionInfo.color)}
                                >
                                  <ActionIcon className="h-3 w-3" />
                                  {actionInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell>{log.resource}</TableCell>
                              <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                                {log.details || '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {filteredLogs.length > 100 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    最新100件を表示しています
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
