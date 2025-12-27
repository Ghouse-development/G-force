// G-force Service Worker
const CACHE_NAME = 'gforce-v1'
// Reserved for future offline support
// const OFFLINE_URL = '/offline.html'

// キャッシュするファイル
const STATIC_CACHE = [
  '/logo.jpg',
  '/manifest.json',
]

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE)
    })
  )
  self.skipWaiting()
})

// アクティベート時（古いキャッシュを削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// フェッチ時（ネットワーク優先、失敗時はキャッシュ）
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // 以下のリクエストはスキップ（キャッシュしない）
  // - APIリクエスト
  // - chrome-extension://スキーム
  // - Supabase APIリクエスト
  // - 非HTTPSスキーム
  if (
    url.includes('/api/') ||
    url.startsWith('chrome-extension://') ||
    url.includes('supabase.co') ||
    !url.startsWith('http')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュに保存（HTTPSのみ）
        if (response.status === 200 && url.startsWith('https://')) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // オフライン時はキャッシュから
        return caches.match(event.request)
      })
  )
})

// プッシュ通知受信時
self.addEventListener('push', (event) => {
  let data = { title: 'G-force', body: '新しい通知があります' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: '開く' },
      { action: 'close', title: '閉じる' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 通知クリック時
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既存のウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// バッジ更新（通知件数）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_BADGE') {
    const count = event.data.count || 0
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count)
      } else {
        navigator.clearAppBadge()
      }
    }
  }
})
