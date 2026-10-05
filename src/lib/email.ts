// Minimal transactional email via Resend's HTTP API. Email features stay
// hidden unless RESEND_API_KEY and EMAIL_FROM are configured, or
// EMAIL_DRY_RUN=1 (local development: emails are printed, not sent).

const dryRun = () => process.env.EMAIL_DRY_RUN === "1"

export function emailEnabled() {
  return dryRun() || (!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM)
}

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  return base.replace(/\/$/, "") + path
}

export async function sendEmail({
  to, subject, html, text, unsubscribeUrl,
}: { to: string; subject: string; html: string; text: string; unsubscribeUrl?: string }) {
  if (!emailEnabled()) return false
  if (dryRun()) {
    console.log(`[email dry run] to=${to} subject=${subject}\n${text}`)
    return true
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
        // Lets mail apps show their own one-tap unsubscribe.
        ...(unsubscribeUrl && {
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        }),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.error("Email send failed", res.status, await res.text().catch(() => ""))
    return res.ok
  } catch (error) {
    console.error("Email send failed", error)
    return false
  }
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}
