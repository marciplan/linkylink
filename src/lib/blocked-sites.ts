// "Sites to skip": domains a user never wants in AI activity results.

/** "https://www.Amazon.com/deals" → "amazon.com". Null when it isn't a domain. */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (!value) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = `https://${value}`
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").replace(/\.$/, "")
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || host.length > 253) return null
    return host
  } catch {
    return null
  }
}

/** Matches the domain itself and every subdomain: amazon.com blocks smile.amazon.com. */
export function blockedBy(url: string, domains: string[]): string | null {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase().replace(/\.$/, "")
  } catch {
    return null
  }
  return domains.find((d) => host === d || host.endsWith(`.${d}`)) ?? null
}
