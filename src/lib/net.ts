import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns"
import https from "node:https"
import { BlockList, isIP } from "node:net"

// Guards for server-side fetches of URLs that came from users or AI apps, so
// they cannot be used to reach our own network.

const PRIVATE_NAME = /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i

const blocked = new BlockList()
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(net, prefix, "ipv4")
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["::", 96], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blocked.addSubnet(net, prefix, "ipv6")

/** True for loopback, private, link-local, reserved and IPv4-mapped forms of those. Non-IPs count as private. */
export function isPrivateAddress(input: string): boolean {
  const ip = input.replace(/^\[|\]$/g, "")
  const version = isIP(ip)
  if (version === 4) return blocked.check(ip, "ipv4")
  if (version !== 6) return true
  const dotted = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (dotted) return blocked.check(dotted[1], "ipv4")
  const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return blocked.check(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`, "ipv4")
  }
  return blocked.check(ip, "ipv6")
}

/** A hostname that is obviously ours: a local name or a private IP literal. Names are checked again at connect time. */
export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "")
  if (isIP(host)) return isPrivateAddress(host)
  return PRIVATE_NAME.test(host)
}

/** DNS lookup that refuses private answers, so a name cannot resolve one way when checked and another when connecting. */
function publicLookup(
  hostname: string,
  options: LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void
) {
  dnsLookup(hostname, options, (err, address, family) => {
    if (err) return callback(err, address as string, family)
    const all = Array.isArray(address) ? address : [{ address: address as string, family: family ?? 4 }]
    if (all.length === 0 || all.some((a) => isPrivateAddress(a.address))) {
      const error: NodeJS.ErrnoException = new Error(`Refusing to connect to a private address for ${hostname}`)
      error.code = "EPRIVATE"
      return callback(error, address as string, family)
    }
    callback(null, address as string | LookupAddress[], family)
  })
}

/**
 * GET an https URL on the public internet. No redirects, a time limit and a
 * size limit. Null on any failure, a non-2xx answer, or a private address.
 */
export function fetchPublicText(url: URL, { timeoutMs = 5000, maxBytes = 64 * 1024, accept = "application/json" } = {}): Promise<string | null> {
  if (url.protocol !== "https:" || isPrivateHostname(url.hostname)) return Promise.resolve(null)
  return new Promise((resolve) => {
    const req = https.get(url, { lookup: publicLookup, headers: { Accept: accept, "User-Agent": "Bundel/1.0 (+https://www.bundel.link)" }, timeout: timeoutMs }, (res) => {
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume()
        return resolve(null)
      }
      let size = 0
      const chunks: Buffer[] = []
      res.on("data", (chunk: Buffer) => {
        size += chunk.length
        if (size > maxBytes) {
          req.destroy()
          return resolve(null)
        }
        chunks.push(chunk)
      })
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
      res.on("error", () => resolve(null))
    })
    req.on("timeout", () => req.destroy())
    req.on("error", () => resolve(null))
  })
}

/**
 * GET an https page on the public internet and return the start of its HTML,
 * up to and including </head>. Follows a few redirects, checking every hop.
 */
export async function fetchPublicHead(start: URL, { timeoutMs = 5000, maxBytes = 512 * 1024, maxRedirects = 3 } = {}): Promise<{ html: string; url: URL } | null> {
  // Links saved as http:// are tried over https; redirects must stay on https.
  let url = new URL(start)
  if (url.protocol === "http:") url.protocol = "https:"
  // `timeout` below only catches an idle socket; this caps the whole lookup, redirects included.
  const deadline = Date.now() + timeoutMs
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (url.protocol !== "https:" || isPrivateHostname(url.hostname)) return null
    const left = deadline - Date.now()
    if (left <= 0) return null
    const result = await new Promise<{ html: string } | { redirect: string } | null>((settle) => {
      // Callbacks below only fire after `timer` is set, at the end of this block.
      const resolve = (value: { html: string } | { redirect: string } | null) => {
        clearTimeout(timer)
        settle(value)
      }
      const req = https.get(
        url,
        {
          lookup: publicLookup,
          timeout: timeoutMs,
          headers: {
            Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
            "User-Agent": "Mozilla/5.0 (compatible; BundelBot/1.0; +https://bundel.link)",
          },
        },
        (res) => {
          const status = res.statusCode ?? 0
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume()
            return resolve({ redirect: res.headers.location })
          }
          if (status < 200 || status >= 300 || !String(res.headers["content-type"] ?? "").includes("html")) {
            res.resume()
            return resolve(null)
          }
          let html = ""
          let size = 0
          const done = () => {
            req.destroy()
            resolve({ html })
          }
          res.setEncoding("utf8")
          res.on("data", (chunk: string) => {
            html += chunk
            size += Buffer.byteLength(chunk)
            if (size >= maxBytes || /<\/head>/i.test(html)) done()
          })
          res.on("end", () => resolve({ html }))
          res.on("error", () => resolve(html ? { html } : null))
          // Destroyed by the deadline: keep what arrived, it may hold the meta tags.
          res.on("close", () => resolve(html ? { html } : null))
        }
      )
      const timer = setTimeout(() => req.destroy(), left)
      req.on("timeout", () => req.destroy())
      req.on("error", () => resolve(null))
    })
    if (!result) return null
    if ("html" in result) return { html: result.html, url }
    try {
      url = new URL(result.redirect, url)
    } catch {
      return null
    }
  }
  return null
}
