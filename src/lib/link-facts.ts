// Pulls the numbers people scan for (a price, what it was, a rating) out of a
// link's title and note, so the card can show them as chips.

export interface LinkFacts {
  price?: string
  was?: string
  /** Whole percent off, from the two prices or a "15% korting" in the text. */
  off?: number
  rating?: string
}

const SYMBOL = "(?:€|\\$|£)"
const NUMBER = "\\d{1,3}(?:[.,\\s]\\d{3})*(?:[.,]\\d{1,2})?(?:,-)?|\\d+(?:[.,]\\d{1,2})?(?:,-)?"
// Symbol first ("€859") wins. A trailing sign ("859 €") only counts when the number stands alone
// and no other amount follows, so "iPhone 15 €999" is €999, not €15.
const AMOUNT = `(?:${SYMBOL}\\s?(?:${NUMBER})|(?<![\\w.,€$£-])(?:${NUMBER})\\s?(?:€(?!\\s?\\d)|EUR\\b|euro\\b))`
const amountRe = () => new RegExp(AMOUNT, "gi")

/** "€1.299,95" → 1299.95, "$1,299" → 1299, "€859" → 859. */
function valueOf(amount: string): number {
  let n = amount.replace(/[^\d.,]/g, "").replace(/,$/, "")
  const lastDot = n.lastIndexOf(".")
  const lastComma = n.lastIndexOf(",")
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? "." : ","
    n = n.split(decimal === "." ? "," : ".").join("").replace(",", ".")
  } else {
    const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : null
    if (sep) {
      const tail = n.slice(n.lastIndexOf(sep) + 1)
      n = tail.length === 3 ? n.split(sep).join("") : n.replace(sep, ".")
    }
  }
  return Number(n)
}

/** Tidy for display: one currency sign in front, no ",-", no space. */
function display(amount: string): string {
  const symbol = amount.match(/[€$£]/)?.[0] ?? (/(EUR|euro)/i.test(amount) ? "€" : "")
  const number = amount.replace(/[€$£]|euro|EUR|,-/gi, "").trim()
  return `${symbol}${number}`
}

function firstAmount(text: string): string | null {
  return text.match(amountRe())?.[0] ?? null
}

/** A "was → now" pair stated in the text: "van €899 naar €859", "€419 (was €449)", "from $99 to $79". */
function wasNow(text: string): { was: string; now: string } | null {
  const a = AMOUNT
  const patterns: [RegExp, "was-now" | "now-was"][] = [
    [new RegExp(`(?:van|from|was)\\s+(${a})\\s+(?:naar|to|nu|now|voor)\\s+(${a})`, "i"), "was-now"],
    [new RegExp(`(${a})\\s*(?:→|->|➜)\\s*(${a})`, "i"), "was-now"],
    [new RegExp(`(${a})\\s+(?:nu|now)\\s+(${a})`, "i"), "was-now"],
    [new RegExp(`(${a})\\s*[(,]\\s*(?:was|van|i\\.p\\.v\\.|ipv|instead of)\\s+(${a})`, "i"), "now-was"],
  ]
  for (const [re, order] of patterns) {
    const m = text.match(re)
    if (!m) continue
    const [first, second] = [m[1], m[2]]
    const pair = order === "was-now" ? { was: first, now: second } : { was: second, now: first }
    if (valueOf(pair.was) > valueOf(pair.now)) return pair
  }
  return null
}

function percentOff(text: string): number | undefined {
  const m = text.match(/(\d{1,2})\s?%\s?(?:korting|off|discount|goedkoper|cheaper)|-\s?(\d{1,2})\s?%/i)
  const n = Number(m?.[1] ?? m?.[2])
  return n > 0 && n < 100 ? n : undefined
}

function ratingOf(text: string): string | undefined {
  // Explicit forms first ("4.8/5", "★ 4.5"), then "4.5 stars" — but not "5 Star Wars".
  const outOfFive =
    text.match(/(?:★|⭐)\s?(\d(?:[.,]\d)?)|(?<![\w.,])(\d(?:[.,]\d)?)\s?(?:\/\s?5\b|★|⭐)/) ??
    text.match(/(?<![\w.,])(\d(?:[.,]\d)?)\s?(?:[Ss]tars?|[Ss]terren)\b(?!\s+[A-Z])/)
  if (outOfFive) {
    const n = Number((outOfFive[1] ?? outOfFive[2]).replace(",", "."))
    if (n > 0 && n <= 5) return `${n}`
  }
  const outOfTen = text.match(/\b(\d{1,2}(?:[.,]\d)?)\s?\/\s?10\b/)
  if (outOfTen) {
    const n = Number(outOfTen[1].replace(",", "."))
    if (n > 0 && n <= 10) return `${n}/10`
  }
  return undefined
}

export function linkFacts(title: string, context?: string | null): LinkFacts {
  const note = context ?? ""
  const all = `${title} ${note}`
  const facts: LinkFacts = {}

  // The title names the price; a note alone only counts when it states a clear was → now.
  const titlePrice = firstAmount(title)
  const pair = wasNow(all)
  if (titlePrice) {
    facts.price = display(titlePrice)
    if (pair && valueOf(pair.now) === valueOf(titlePrice)) facts.was = display(pair.was)
  } else if (pair) {
    facts.price = display(pair.now)
    facts.was = display(pair.was)
  }

  if (facts.price) {
    const now = valueOf(facts.price)
    const was = facts.was ? valueOf(facts.was) : 0
    const off = was > now && now > 0 ? Math.round((1 - now / was) * 100) : percentOff(all)
    if (off && off >= 1) facts.off = off
  }

  const rating = ratingOf(all)
  if (rating) facts.rating = rating
  return facts
}
