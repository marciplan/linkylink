type Window = { count: number; resetAt: number }

declare global {
  var __rateLimitStore: Map<string, Window> | undefined
}

const store: Map<string, Window> = globalThis.__rateLimitStore || new Map()
globalThis.__rateLimitStore = store

export function getClientIp(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for') || ''
  if (xfwd) return xfwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip') || ''
  if (real) return real
  return '127.0.0.1'
}

export function checkRateLimit(key: string, limit: number, intervalMs: number) {
  const now = Date.now()
  const existing = store.get(key)
  if (!existing || now > existing.resetAt) {
    const resetAt = now + intervalMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (existing.count < limit) {
    existing.count += 1
    store.set(key, existing)
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
  }
  return { allowed: false, remaining: 0, resetAt: existing.resetAt }
}

export function rateLimitHeaders(
  req: Request,
  bucket: string,
  limit: number,
  intervalMs: number
):
  | { allowed: true; headers: Record<string, string> }
  | { allowed: false; headers: Record<string, string>; status: 429; body: { error: string } } {
  const ip = getClientIp(req)
  const res = checkRateLimit(`${bucket}:${ip}`, limit, intervalMs)
  const baseHeaders = {
    'X-RateLimit-Remaining': String(res.remaining),
    'X-RateLimit-Reset': String(res.resetAt),
  }
  if (!res.allowed) {
    const retryAfter = Math.max(1, Math.ceil((res.resetAt - Date.now()) / 1000))
    return {
      allowed: false,
      status: 429,
      body: { error: 'Rate limit exceeded' },
      headers: { ...baseHeaders, 'Retry-After': String(retryAfter) },
    }
  }
  return { allowed: true, headers: baseHeaders }
}
