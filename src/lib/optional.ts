import { Prisma } from "@prisma/client"

let warned = false

/**
 * Reads from the sharing tables (Ask, Vote, Activity…) go through this so a
 * deploy that hasn't run `prisma db push` yet degrades to "feature off"
 * instead of breaking the page.
 */
export async function optional<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query
  } catch (error) {
    // P2021: table does not exist. P2022: column does not exist.
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      if (!warned) {
        warned = true
        console.warn("Sharing tables are missing; run `npx prisma db push`. Features are off until then.")
      }
      return fallback
    }
    throw error
  }
}
