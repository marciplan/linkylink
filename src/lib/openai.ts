export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export function getOpenAIKey(): string | null {
  return process.env.OPENAI_API_KEY || process.env.NEXT_OPENAI_API_KEY || null
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[]
}

export async function chatCompletion({
  messages,
  model = 'gpt-4o-mini',
  max_tokens = 200,
  temperature = 0.3,
}: {
  messages: ChatMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const apiKey = getOpenAIKey()
  if (!apiKey) return { ok: false, error: 'Missing OpenAI API key' }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `OpenAI error ${res.status}: ${text}` }
    }

    const data = (await res.json()) as unknown as ChatCompletionResponse
    const content = data?.choices?.[0]?.message?.content ?? ''
    return { ok: true, content }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'OpenAI request failed'
    return { ok: false, error: msg }
  }
}

export function parseJsonFromModel<T = unknown>(text: string): T {
  const stripped = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(stripped) as T } catch {}
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = stripped.slice(start, end + 1)
    return JSON.parse(candidate) as T
  }
  throw new Error('Unable to parse JSON from model output')
}
