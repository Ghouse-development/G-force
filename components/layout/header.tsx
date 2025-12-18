'use client'

import { useState } from 'react'
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
  FileSignature,
  ClipboardList,
  ChevronDown,
  Search,
  Command,
  Menu,
  X,
} from 'lucide-react'
import { GlobalSearch, useGlobalSearch } from '@/components/search/global-search'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useNotificationStore } from '@/store'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home },
  { name: '顧客管理', href: '/customers', icon: Users },
]

const documentNavigation = [
  { name: 'プラン依頼', href: '/plan-requests', icon: FileEdit, description: '設計部への依頼' },
  { name: '契約書', href: '/contracts', icon: FileSignature, description: '請負契約書管理' },
  { name: '引継書', href: '/handovers', icon: ClipboardList, description: '工事部への引継' },
  { name: '資金計画書', href: '/fund-plans', icon: FileText, description: '資金計画作成' },
]

const adminNavigation = [
  { name: '管理', href: '/admin', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { isOpen: isSearchOpen, setIsOpen: setSearchOpen } = useGlobalSearch()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Show admin navigation for admin and manager roles
  const showAdminNav = user?.role === 'admin' || user?.role === 'manager'

  // Check if any document page is active
  const isDocumentActive = documentNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Get role display name
  const getRoleDisplay = (role: string | undefined) => {
    switch (role) {
      case 'admin': return '管理者'
      case 'manager': return '部門長'
      case 'staff': return '営業'
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
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
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
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}

          {/* Document Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isDocumentActive
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
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

          {/* Admin Navigation */}
          {showAdminNav && adminNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
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

          {/* Notifications */}
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="hover:bg-orange-50">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {unreadCount}
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
              <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
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
                    'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

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
