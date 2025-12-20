'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="パンくずリスト"
      className={cn('flex items-center text-sm mb-4', className)}
    >
      <ol className="flex items-center space-x-1">
        {/* ホームアイコン */}
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-gray-500 hover:text-orange-600 transition-colors p-1 rounded hover:bg-orange-50"
            aria-label="ダッシュボードに戻る"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-orange-600 transition-colors px-1 py-0.5 rounded hover:bg-orange-50"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium px-1" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
