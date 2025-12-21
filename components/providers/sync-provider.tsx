'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store'
import { initialSync, startAutoSync, subscribeToStoreChanges, getSyncState } from '@/lib/db/sync-service'
import { toast } from 'sonner'

interface SyncProviderProps {
  children: React.ReactNode
}

// 同期が有効かどうか（本番環境でのみ有効、開発時は無効も可）
const SYNC_ENABLED = process.env.NEXT_PUBLIC_SYNC_ENABLED !== 'false'

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated, user } = useAuthStore()
  const cleanupRef = useRef<(() => void) | null>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // 同期が無効な場合はスキップ
    if (!SYNC_ENABLED) {
      console.log('[Sync] Database sync is disabled')
      return
    }

    // 認証済みの場合のみ同期を開始
    if (!isAuthenticated || hasInitialized.current) {
      console.log('[Sync] Skipping sync:', { isAuthenticated, hasInitialized: hasInitialized.current })
      return
    }

    hasInitialized.current = true
    console.log('[Sync] Starting sync for user:', user?.name)

    const initSync = async () => {
      try {
        // 初回同期
        console.log('[Sync] Running initial sync...')
        await initialSync()

        const state = getSyncState()
        if (state.lastSyncAt) {
          console.log('[Sync] Initial sync completed:', state.lastSyncAt)
        }
        if (state.syncError) {
          console.warn('[Sync] Sync completed with error:', state.syncError)
        }
      } catch (error) {
        console.error('[Sync] Initial sync failed:', error)
        // エラーがあってもローカルデータで動作を継続
      }
    }

    initSync()

    // 自動同期を開始（60秒間隔 - 本番では負荷軽減のため長めに）
    const stopAutoSync = startAutoSync(60000)
    console.log('[Sync] Auto-sync started (60s interval)')

    // ストア変更の監視を開始
    const unsubscribe = subscribeToStoreChanges()
    console.log('[Sync] Store subscription started')

    cleanupRef.current = () => {
      stopAutoSync()
      unsubscribe()
      console.log('[Sync] Sync stopped')
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [isAuthenticated, user])

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
