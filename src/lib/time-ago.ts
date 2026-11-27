/** "just now", "5m ago", "2h ago", "3d ago", then a short date. */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const then = new Date(date)
  const seconds = Math.max(0, (now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`
  const sameYear = then.getFullYear() === now.getFullYear()
  return `on ${then.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) })}`
}
