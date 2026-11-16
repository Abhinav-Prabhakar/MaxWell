import { NextResponse } from 'next/server'
import {
  coerce,
  coerceInput,
  hasKey,
  messagesOf,
  modelOf,
  toRead,
} from '@/src/components/Read/server'

/* One question to the second reader. The key lives in the deployment's
   environment, never in the client and never in the repo. */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  })

export async function POST(request: Request) {
  if (!hasKey()) return json({ error: 'offline' }, 503)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  const input = coerceInput(body)
  if (!input) return json({ error: 'bad_request' }, 400)

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelOf(),
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: messagesOf(input),
      }),
      signal: AbortSignal.timeout(11_000),
      cache: 'no-store',
    })

    if (response.status === 429) return json({ error: 'busy' }, 429)
    if (!response.ok) return json({ error: 'upstream' }, 502)

    const payload = (await response.json()) as {
      model?: string
      choices?: { message?: { content?: string } }[]
    }
    const text = payload.choices?.[0]?.message?.content
    let raw: unknown = null
    try {
      raw = typeof text === 'string' ? JSON.parse(text) : null
    } catch {
      raw = null
    }

    const model = coerce(raw)
    if (!model) return json({ error: 'unreadable' }, 502)

    return json(toRead(model, input, payload.model ?? modelOf(), new Date()))
  } catch (error) {
    const timeout =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return json({ error: timeout ? 'timeout' : 'upstream' }, timeout ? 504 : 502)
  }
}
