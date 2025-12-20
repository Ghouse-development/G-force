'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store'
import { initialSync, startAutoSync, subscribeToStoreChanges, getSyncState } from '@/lib/db/sync-service'
import { toast } from 'sonner'

interface SyncProviderProps {
  children: React.ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated } = useAuthStore()
  const cleanupRef = useRef<(() => void) | null>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // 認証済みの場合のみ同期を開始
    if (!isAuthenticated || hasInitialized.current) return

    hasInitialized.current = true

    const initSync = async () => {
      try {
        // 初回同期
        await initialSync()

        const state = getSyncState()
        if (state.lastSyncAt) {
          console.log('Initial sync completed:', state.lastSyncAt)
        }
      } catch (error) {
        console.error('Initial sync failed:', error)
        // エラーがあってもローカルデータで動作を継続
      }
    }

    initSync()

    // 自動同期を開始（30秒間隔）
    const stopAutoSync = startAutoSync(30000)

    // ストア変更の監視を開始
    const unsubscribe = subscribeToStoreChanges()

    cleanupRef.current = () => {
      stopAutoSync()
      unsubscribe()
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [isAuthenticated])

  // オンライン/オフライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      toast.success('オンラインに戻りました。データを同期中...')
      initialSync().catch(console.error)
    }

    const handleOffline = () => {
      toast.warning('オフラインです。変更は自動的に保存されます')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return <>{children}</>
}
