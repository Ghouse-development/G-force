'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // エラーログを記録
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 本番環境では外部エラー追跡サービスに送信可能
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry等へのエラー送信
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-foreground">
              エラーが発生しました
            </h2>

            <p className="mb-6 text-muted-foreground">
              申し訳ございません。予期しないエラーが発生しました。
              ページを再読み込みするか、ホームに戻ってください。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-lg bg-muted p-4 text-left">
                <p className="mb-2 font-mono text-sm text-destructive">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="max-h-40 overflow-auto text-xs text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={this.handleReload} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                ページを再読み込み
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                ホームに戻る
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
