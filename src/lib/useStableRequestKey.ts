import { useRef } from 'react'

/**
 * Keeps one request identity per distinct payload attempt so a retry of the
 * same user intent (same fields, same expectedVersion) replays safely instead
 * of minting a fresh key that would defeat server-side idempotency. A payload
 * that actually changed (user edited a field, or the version advanced after a
 * refresh) is a new intent and gets a new key.
 */
export function useStableRequestKey(scope: string) {
  const pendingRef = useRef<{ payloadHash: string; key: string } | null>(null)

  function getKey(payload: unknown): string {
    const payloadHash = JSON.stringify(payload)
    if (pendingRef.current && pendingRef.current.payloadHash === payloadHash) {
      return pendingRef.current.key
    }
    const key = `${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    pendingRef.current = { payloadHash, key }
    return key
  }

  function reset(): void {
    pendingRef.current = null
  }

  return { getKey, reset }
}
