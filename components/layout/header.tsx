'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  FileEdit,
  ClipboardList,
  ChevronDown,
  Search,
  Command,
  Menu,
  X,
  MapPin,
  TrendingUp,
  RefreshCw,
  FlaskConical,
  Target,
  HelpCircle,
  CalendarDays,
} from 'lucide-react'
import { GlobalSearch, useGlobalSearch } from '@/components/search/global-search'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useNotificationStore } from '@/store'
import { useDemoModeStore } from '@/store/demo-store'
import { cn } from '@/lib/utils'
import { updateAppBadge } from '@/components/providers/pwa-provider'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home },
]

const customerNavigation = [
  { name: '限定会員前', href: '/pre-members', icon: Users, description: '資料請求・イベント参加' },
  { name: '契約前お客様', href: '/customers', icon: Users, description: '限定会員〜内定' },
  { name: '契約後お客様', href: '/post-contract', icon: Users, description: '変更契約前・後' },
  { name: 'オーナー', href: '/owners', icon: Users, description: '引渡済み' },
]

const documentNavigation = [
  { name: '資金計画書', href: '/fund-plans', icon: FileText, description: '資金計画作成' },
  { name: 'プラン依頼', href: '/plan-requests', icon: ClipboardList, description: '設計部への依頼' },
  { name: '契約依頼', href: '/contract-requests', icon: FileEdit, description: '契約依頼・承認・引継' },
]

const infoNavigation = [
  { name: 'イベント管理', href: '/events', icon: CalendarDays, description: '見学会・予約管理' },
  { name: '土地情報アラート', href: '/property-alerts', icon: MapPin, description: '物件通知・アラート設定' },
  { name: '住宅ローン金利', href: '/loan-rates', icon: TrendingUp, description: '銀行別金利一覧' },
  { name: '営業ツール', href: '/sales-tools', icon: Target, description: '競合対策・トークスクリプト' },
  { name: 'クロール設定', href: '/crawl-settings', icon: RefreshCw, description: '自動取得の管理' },
]

const adminNavigation = [
  { name: '管理', href: '/admin', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { unreadCount: localUnreadCount } = useNotificationStore()
  const { isDemoMode, toggleDemoMode } = useDemoModeStore()
  const { isOpen: isSearchOpen, setIsOpen: setSearchOpen } = useGlobalSearch()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [propertyUnreadCount, setPropertyUnreadCount] = useState(0)

  // 物件マッチング通知の未読数を取得
  useEffect(() => {
    const fetchPropertyNotifications = async () => {
      try {
        const res = await fetch('/api/property-notifications')
        if (res.ok) {
          const data = await res.json()
          setPropertyUnreadCount(data.unread || 0)
        }
      } catch {
        // エラーは無視
      }
    }
    fetchPropertyNotifications()
    // 1分ごとに更新
    const interval = setInterval(fetchPropertyNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // 総未読数
  const totalUnreadCount = localUnreadCount + propertyUnreadCount

  // PWAバッジ更新
  useEffect(() => {
    updateAppBadge(totalUnreadCount)
  }, [totalUnreadCount])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Show admin navigation for admin role only
  const showAdminNav = user?.role === 'admin'

  // Check if any customer page is active
  const isCustomerActive = customerNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Check if any document page is active
  const isDocumentActive = documentNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Check if any info page is active
  const isInfoActive = infoNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Get role display name
  const getRoleDisplay = (role: string | undefined) => {
    switch (role) {
      case 'admin': return '本部'
      case 'sales': return '営業'
      case 'sales_leader': return '営業リーダー'
      case 'sales_office': return '営業事務'
      case 'design_manager': return '設計部門長'
      case 'construction_manager': return '工事部門長'
      case 'design': return '設計'
      case 'cad': return 'CAD'
      case 'ic': return 'IC'
      case 'supervisor': return '現場監督'
      case 'exterior': return '外構'
      default: return ''
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center px-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="mr-6 flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src="/logo.jpg"
                alt="G House"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="hidden sm:block text-xl font-bold text-orange-500">
                G-force
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 items-center space-x-1">
          {/* Main Navigation */}
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}

          {/* Customer Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isCustomerActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <Users className="h-4 w-4" />
                <span>お客様管理</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {customerNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'flex items-start space-x-3 py-3 cursor-pointer',
                      isActive && 'bg-orange-50'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 mt-0.5',
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    )} />
                    <div>
                      <p className={cn(
                        'font-medium',
                        isActive ? 'text-orange-600' : 'text-gray-900'
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Document Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isDocumentActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <FileText className="h-4 w-4" />
                <span>書類作成</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {documentNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'flex items-start space-x-3 py-3 cursor-pointer',
                      isActive && 'bg-orange-50'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 mt-0.5',
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    )} />
                    <div>
                      <p className={cn(
                        'font-medium',
                        isActive ? 'text-orange-600' : 'text-gray-900'
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Info Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isInfoActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <MapPin className="h-4 w-4" />
                <span>情報収集</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {infoNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'flex items-start space-x-3 py-3 cursor-pointer',
                      isActive && 'bg-orange-50'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 mt-0.5',
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    )} />
                    <div>
                      <p className={cn(
                        'font-medium',
                        isActive ? 'text-orange-600' : 'text-gray-900'
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Navigation */}
          {showAdminNav && adminNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Desktop Global Search */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-900 h-9 px-3"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">検索...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded border bg-gray-100">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
          <GlobalSearch open={isSearchOpen} onOpenChange={setSearchOpen} />

          {/* Demo Mode Toggle */}
          <Button
            variant={isDemoMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleDemoMode}
            className={cn(
              'hidden sm:flex items-center gap-1.5 h-9 px-3 transition-all',
              isDemoMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'text-gray-500 hover:text-purple-600 hover:border-purple-300'
            )}
          >
            <FlaskConical className="h-4 w-4" />
            <span className="text-xs font-medium">
              {isDemoMode ? 'デモ中' : 'デモ'}
            </span>
          </Button>

          {/* Help - ガイドを再表示 */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-orange-50"
            onClick={() => {
              localStorage.removeItem('gforce-onboarding-completed')
              router.push('/dashboard')
              window.location.reload()
            }}
            title="使い方ガイドを表示"
          >
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Notifications */}
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="hover:bg-orange-50">
              <Bell className="h-5 w-5 text-gray-600" />
              {totalUnreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-red-500 text-[10px]">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User Info - Desktop only */}
          <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.department && `${user.department} · `}
                {getRoleDisplay(user?.role)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Navigation Drawer */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.jpg"
                alt="G House"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-orange-500">
                G-force
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b bg-gray-50">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">
              {user?.department && `${user.department} · `}
              {getRoleDisplay(user?.role)}
            </p>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            <div className="pt-3 mt-3 border-t">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                お客様管理
              </p>
              {customerNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <div className="pt-3 mt-3 border-t">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                書類作成
              </p>
              {documentNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <div className="pt-3 mt-3 border-t">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                情報収集
              </p>
              {infoNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {showAdminNav && (
              <div className="pt-3 mt-3 border-t">
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                        isActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
