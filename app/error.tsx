'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログサービスに送信（本番環境）
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry等のエラー監視サービスに送信
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>

          <p className="text-gray-500 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            <br />
            再度お試しいただくか、ホームに戻ってください。
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="w-4 h-4 mr-2" />
              ホームへ
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
