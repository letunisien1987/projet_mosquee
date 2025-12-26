'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFetchOptions<T> {
  /** URL to fetch from */
  url: string
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Request body for POST/PATCH/PUT */
  body?: unknown
  /** Request headers */
  headers?: HeadersInit
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Whether to fetch immediately on mount (default: true for GET) */
  immediate?: boolean
  /** Transform the response data */
  transform?: (data: unknown) => T
  /** Dependencies that trigger a refetch */
  deps?: unknown[]
}

interface UseFetchResult<T> {
  data: T | null
  error: Error | null
  loading: boolean
  refetch: () => Promise<void>
  abort: () => void
}

const DEFAULT_TIMEOUT = 30000

export function useFetch<T = unknown>(options: UseFetchOptions<T>): UseFetchResult<T> {
  const {
    url,
    method = 'GET',
    body,
    headers,
    timeout = DEFAULT_TIMEOUT,
    immediate = method === 'GET',
    transform,
    deps = [],
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(immediate)

  const abortControllerRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const fetchData = useCallback(async () => {
    // Abort any pending request
    abort()

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    setLoading(true)
    setError(null)

    // Create timeout
    const timeoutId = setTimeout(() => {
      abort()
    }, timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const responseData = await response.json()
      const finalData = transform ? transform(responseData) : responseData

      setData(finalData as T)
      setError(null)
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(new Error('La requête a été annulée (timeout ou interruption)'))
        } else {
          setError(err)
        }
      } else {
        setError(new Error('Une erreur inconnue est survenue'))
      }
    } finally {
      setLoading(false)
    }
  }, [url, method, body, headers, timeout, transform, abort])

  // Initial fetch and refetch on deps change
  useEffect(() => {
    if (immediate) {
      fetchData()
    }

    return () => {
      abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps])

  return {
    data,
    error,
    loading,
    refetch: fetchData,
    abort,
  }
}

// Simpler hook for mutations (POST, PATCH, DELETE)
interface UseMutationOptions<T, TInput> {
  url: string
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  headers?: HeadersInit
  timeout?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  transform?: (data: unknown) => T
}

interface UseMutationResult<T, TInput> {
  mutate: (input?: TInput) => Promise<T | null>
  data: T | null
  error: Error | null
  loading: boolean
  reset: () => void
}

export function useMutation<T = unknown, TInput = unknown>(
  options: UseMutationOptions<T, TInput>
): UseMutationResult<T, TInput> {
  const {
    url,
    method = 'POST',
    headers,
    timeout = DEFAULT_TIMEOUT,
    onSuccess,
    onError,
    transform,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  const mutate = useCallback(async (input?: TInput): Promise<T | null> => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    setLoading(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
    }, timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: input ? JSON.stringify(input) : undefined,
        signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const responseData = await response.json()
      const finalData = transform ? transform(responseData) : responseData

      setData(finalData as T)
      onSuccess?.(finalData as T)

      return finalData as T
    } catch (err) {
      clearTimeout(timeoutId)

      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue')
      setError(error)
      onError?.(error)

      return null
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, timeout, onSuccess, onError, transform])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    data,
    error,
    loading,
    reset,
  }
}

export default useFetch
