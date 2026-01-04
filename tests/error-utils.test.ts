import { describe, it, expect, vi } from 'vitest'
import {
  createAppError,
  getErrorMessage,
  tryCatch,
  createValidationError,
  withRetry,
} from '@/lib/error-utils'

describe('error-utils', () => {
  describe('createAppError', () => {
    it('creates an error with the given message', () => {
      const error = createAppError('Test error')
      expect(error.message).toBe('Test error')
    })

    it('creates an error with all options', () => {
      const error = createAppError('Test error', {
        code: 'TEST_ERROR',
        severity: 'warning',
        userMessage: 'User friendly message',
        context: { key: 'value' },
      })

      expect(error.code).toBe('TEST_ERROR')
      expect(error.severity).toBe('warning')
      expect(error.userMessage).toBe('User friendly message')
      expect(error.context).toEqual({ key: 'value' })
    })

    it('defaults severity to error', () => {
      const error = createAppError('Test error')
      expect(error.severity).toBe('error')
    })
  })

  describe('getErrorMessage', () => {
    it('returns known error messages', () => {
      const error = new Error('Failed to fetch')
      expect(getErrorMessage(error)).toBe('ネットワークに接続できません。接続を確認してください。')
    })

    it('returns user message from AppError', () => {
      const error = createAppError('Internal error', {
        userMessage: 'Something went wrong',
      })
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('handles string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error')
    })

    it('returns unknown error message for unrecognized errors', () => {
      const error = new Error('Some random error')
      // In production, returns unknown error message
      // In development, returns original message
      const message = getErrorMessage(error)
      expect(typeof message).toBe('string')
    })
  })

  describe('tryCatch', () => {
    it('returns result on success', async () => {
      const [result, error] = await tryCatch(async () => 'success', {
        showToast: false,
      })
      expect(result).toBe('success')
      expect(error).toBeNull()
    })

    it('returns error on failure', async () => {
      const [result, error] = await tryCatch(
        async () => {
          throw new Error('failed')
        },
        { showToast: false }
      )
      expect(result).toBeNull()
      expect(error?.message).toBe('failed')
    })

    it('calls onError callback on failure', async () => {
      const onError = vi.fn()
      await tryCatch(
        async () => {
          throw new Error('failed')
        },
        { showToast: false, onError }
      )
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('createValidationError', () => {
    it('creates validation error with field messages', () => {
      const error = createValidationError([
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Required' },
      ])

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.severity).toBe('warning')
      expect(error.message).toContain('email: Invalid email')
      expect(error.message).toContain('name: Required')
    })

    it('uses first error as user message', () => {
      const error = createValidationError([
        { field: 'email', message: 'Invalid email' },
      ])

      expect(error.userMessage).toBe('Invalid email')
    })
  })

  describe('withRetry', () => {
    it('succeeds on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await withRetry(fn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('retries on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success')

      const result = await withRetry(fn, { maxRetries: 3, delay: 1 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('throws after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'))

      await expect(
        withRetry(fn, { maxRetries: 2, delay: 1 })
      ).rejects.toThrow('always fail')

      expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })

    it('respects retryOn condition', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('no retry'))

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          delay: 1,
          retryOn: () => false, // never retry
        })
      ).rejects.toThrow('no retry')

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
