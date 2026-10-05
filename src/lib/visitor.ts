// A visitor's lightweight identity for voting and suggesting without an
// account: a random key and the name they typed, kept on their device only.

const KEY = "bundel-visitor"

export interface Visitor {
  key: string
  name: string | null
}

export function getVisitor(): Visitor {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null") as Visitor | null
    if (stored?.key) return stored
  } catch {}
  const visitor = { key: crypto.randomUUID().replace(/-/g, ""), name: null }
  saveVisitor(visitor)
  return visitor
}

export function saveVisitor(visitor: Visitor) {
  try {
    localStorage.setItem(KEY, JSON.stringify(visitor))
  } catch {}
}
