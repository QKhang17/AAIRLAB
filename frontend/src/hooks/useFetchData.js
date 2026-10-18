import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Fetch data without ever rendering a stale/demo value during a request.
 * `fetcher` should be a stable async function, usually created with useCallback.
 */
export function useFetchData(fetcher, { initialData = null, enabled = true } = {}) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current
    setIsLoading(true)
    setError(null)
    setData(initialData)

    try {
      const nextData = await fetcher()
      if (currentRequest === requestId.current) setData(nextData ?? initialData)
      return nextData
    } catch (reason) {
      if (currentRequest === requestId.current) {
        setData(initialData)
        setError(reason instanceof Error ? reason : new Error('Unable to load data.'))
      }
      throw reason
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [fetcher, initialData])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return undefined
    }

    refetch().catch(() => {})
    return () => { requestId.current += 1 }
  }, [enabled, refetch])

  return { data, isLoading, error, refetch }
}
