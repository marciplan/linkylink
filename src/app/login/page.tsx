"use client"

import { Suspense, useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { AuthShell, safeCallback } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/field"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = safeCallback(params.get("callbackUrl"), "/dashboard")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Client-side validation
    const errors: { email?: string; password?: string } = {}
    if (!email || !email.includes("@")) {
      errors.email = "Enter a valid email address"
    }
    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("That email and password don't match.")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Bundels."
      footer={
        <>
          New here?{" "}
          <Link href={`/register${params.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" disabled={isLoading} autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" error={fieldErrors.password}>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" disabled={isLoading} />
        </Field>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-[15px] font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="!mt-6">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
