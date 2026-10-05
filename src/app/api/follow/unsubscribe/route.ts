import { prisma } from "@/lib/prisma"

// RFC 8058 one-click unsubscribe: mail apps POST here directly.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  if (token) await prisma.emailFollow.deleteMany({ where: { token } })
  return new Response(null, { status: 204 })
}
