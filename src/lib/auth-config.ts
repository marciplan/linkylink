import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtected = ['/dashboard', '/create', '/edit'].some(path =>
        nextUrl.pathname.startsWith(path)
      )

      if (isOnProtected && !isLoggedIn) {
        return false
      }

      return true
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig