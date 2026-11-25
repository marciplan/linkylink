import { PrismaClient } from "@prisma/client"

// The profile photo bytes are only read by /api/photo/[id] (which selects them
// explicitly). Everywhere else, `user: true` must not drag them along.
const createClient = () => new PrismaClient({ omit: { user: { photo: true } } })

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
