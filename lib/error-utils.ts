/**
 * Error Utilities
 * エラーハンドリングのための共通ユーティリティ
 */

import { toast } from 'sonner'

// ============================================
// エラータイプ定義
// ============================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AppError extends Error {
  code?: string
  severity?: ErrorSeverity
  context?: Record<string, unknown>
  userMessage?: string
}

// ============================================
// エラー作成ヘルパー
// ============================================

export function createAppError(
  message: string,
  options?: {
    code?: string
    severity?: ErrorSeverity
    context?: Record<string, unknown>
    userMessage?: string
    cause?: Error
  }
): AppError {
  const error = new Error(message) as AppError
  error.code = options?.code
  error.severity = options?.severity || 'error'
  error.context = options?.context
  error.userMessage = options?.userMessage || message
  if (options?.cause) {
    error.cause = options.cause
  }
  return error
}

// ============================================
// エラーメッセージ変換
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'ネットワークに接続できません。接続を確認してください。',
  'NetworkError': 'ネットワークエラーが発生しました。',
  'ECONNREFUSED': 'サーバーに接続できません。',

  // Auth errors
  'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません。',
  'Email not confirmed': 'メールアドレスの確認が完了していません。',
  'User not found': 'ユーザーが見つかりません。',

  // Supabase errors
  'PGRST116': 'データが見つかりません。',
  'PGRST301': 'アクセス権限がありません。',
  '23505': 'データが重複しています。',
  '23503': '関連するデータが存在しません。',

  // Validation errors
  'Required': '必須項目が入力されていません。',
  'Invalid format': '入力形式が正しくありません。',

  // File errors
  'File too large': 'ファイルサイズが大きすぎます。',
  'Invalid file type': 'サポートされていないファイル形式です。',

  // Generic
  'Unknown error': '予期しないエラーが発生しました。',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for known error messages
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(key)) {
        return message
      }
    }

    // Check for AppError with user message
    if ((error as AppError).userMessage) {
      return (error as AppError).userMessage!
    }

    // Return original message in development
    if (process.env.NODE_ENV === 'development') {
      return error.message
    }

    return ERROR_MESSAGES['Unknown error']
  }

  if (typeof error === 'string') {
    return error
  }

  return ERROR_MESSAGES['Unknown error']
}

// ============================================
// エラー通知
// ============================================

export function notifyError(error: unknown, options?: { title?: string }): void {
  const message = getErrorMessage(error)
  const title = options?.title || 'エラー'

  toast.error(title, {
    description: message,
    duration: 5000,
  })

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error)
  }
}

export function notifySuccess(message: string, options?: { title?: string }): void {
  toast.success(options?.title || '成功', {
    description: message,
    duration: 3000,
  })
}

export function notifyWarning(message: string, options?: { title?: string }): void {
  toast.warning(options?.title || '注意', {
    description: message,
    duration: 4000,
  })
}

// ============================================
// 安全な非同期処理
// ============================================

export async function tryCatch<T>(
  fn: () => Promise<T>,
  options?: {
    errorMessage?: string
    showToast?: boolean
    onError?: (error: unknown) => void
  }
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    if (options?.showToast !== false) {
      notifyError(error, { title: options?.errorMessage })
    }

    if (options?.onError) {
      options.onError(error)
    }

    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

// ============================================
// バリデーションエラー
// ============================================

export interface ValidationError {
  field: string
  message: string
}

export function createValidationError(
  errors: ValidationError[]
): AppError {
  const message = errors.map(e => `${e.field}: ${e.message}`).join(', ')
  return createAppError(message, {
    code: 'VALIDATION_ERROR',
    severity: 'warning',
    userMessage: errors[0]?.message || '入力内容を確認してください。',
    context: { errors },
  })
}

// ============================================
// API エラーハンドリング
// ============================================

export function handleApiError(response: Response): never {
  const error = createAppError(`API Error: ${response.status}`, {
    code: `HTTP_${response.status}`,
    severity: response.status >= 500 ? 'critical' : 'error',
    context: {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    },
    userMessage: getHttpErrorMessage(response.status),
  })
  throw error
}

function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'リクエストが不正です。'
    case 401:
      return 'ログインが必要です。'
    case 403:
      return 'アクセス権限がありません。'
    case 404:
      return 'データが見つかりません。'
    case 409:
      return 'データが競合しています。'
    case 422:
      return '入力内容を確認してください。'
    case 429:
      return 'リクエストが多すぎます。しばらくお待ちください。'
    case 500:
      return 'サーバーエラーが発生しました。'
    case 502:
    case 503:
    case 504:
      return 'サーバーが一時的に利用できません。'
    default:
      return '通信エラーが発生しました。'
  }
}

// ============================================
// リトライ機能
// ============================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    retryOn?: (error: unknown) => boolean
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const delay = options?.delay ?? 1000
  const backoff = options?.backoff ?? true

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (options?.retryOn && !options.retryOn(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, waitTime))

      console.log(`Retrying (attempt ${attempt + 2}/${maxRetries + 1})...`)
    }
  }

  throw lastError
}
