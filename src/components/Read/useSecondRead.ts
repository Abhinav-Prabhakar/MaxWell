'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ClinicalRead, ReadInput } from './types'

type Status = 'loading' | 'ready' | 'error'

interface Answer {
  status: Status
  read: ClinicalRead | null
  /** Why the assistant did not answer: busy, offline, timeout, unreadable. */
  reason: string | null
  /** When the answer failed, so the rulebook slip carries a real time. */
  at: string | null
}

interface State extends Answer {
  /** The file this state belongs to. */
  key: string
}

/** One read per identical file, kept for the session so stepping back is free. */
const cache = new Map<string, ClinicalRead>()

const LOADING: Answer = { status: 'loading', read: null, reason: null, at: null }

export function useSecondRead(input: ReadInput) {
  const key = JSON.stringify(input)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<State>(() => {
    const hit = cache.get(key)
    return hit
      ? { key, status: 'ready', read: hit, reason: null, at: hit.at }
      : { key, ...LOADING }
  })

  /* Stepping back onto a file we already read is free: the answer is read
     during render, not fetched again in an effect. */
  const cached = state.key === key ? null : cache.get(key)
  const view: Answer =
    state.key === key
      ? state
      : cached
        ? { status: 'ready', read: cached, reason: null, at: cached.at }
        : LOADING

  useEffect(() => {
    if (cache.has(key)) return

    const controller = new AbortController()
    let live = true

    fetch('/api/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: key,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? 'unreadable')
        }
        return (await response.json()) as ClinicalRead
      })
      .then((read) => {
        if (!live) return
        cache.set(key, read)
        setState({ key, status: 'ready', read, reason: null, at: read.at })
      })
      .catch((error: unknown) => {
        if (!live) return
        const reason =
          error instanceof Error && error.name === 'AbortError' ? 'timeout' : errorMessage(error)
        setState({ key, status: 'error', read: null, reason, at: new Date().toISOString() })
      })

    return () => {
      live = false
      controller.abort()
    }
  }, [key, attempt])

  const again = useCallback(() => {
    cache.delete(key)
    setState({ key, ...LOADING })
    setAttempt((n) => n + 1)
  }, [key])

  return { ...view, again }
}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const known = ['busy', 'offline', 'timeout', 'unreadable', 'upstream', 'bad_request']
    if (known.includes(error.message)) return error.message
  }
  return 'offline'
}
