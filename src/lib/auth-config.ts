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
      const isOnProtected = ['/dashboard', '/create', '/edit', '/account', '/recommendations', '/share'].some(path =>
        nextUrl.pathname.startsWith(path)
      )

      if (isOnProtected && !isLoggedIn) {
        return false
      }

      // Already signed in: "Get started" links go through /register, so send
      // them straight on to where they were headed.
      if (isLoggedIn && (nextUrl.pathname === '/register' || nextUrl.pathname === '/login')) {
        const callback = nextUrl.searchParams.get('callbackUrl')
        const to = callback && callback.startsWith('/') && !callback.startsWith('//') ? callback : '/dashboard'
        return Response.redirect(new URL(to, nextUrl))
      }

      return true
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig