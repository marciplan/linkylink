"use client"

import { Suspense, useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { AuthShell, safeCallback } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/field"

type FieldErrors = {
  name?: string
  username?: string
  email?: string
  password?: string
}

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  // New accounts go straight to making their first Bundel unless they came from somewhere.
  const callbackUrl = safeCallback(params.get("callbackUrl"), "/create")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [username, setUsername] = useState("")

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Client-side validation
    const errors: FieldErrors = {}
    if (!name || name.length < 1) {
      errors.name = "Name is required"
    }
    if (!username || username.length < 3) {
      errors.username = "At least 3 characters"
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.username = "Letters, numbers, - and _ only"
    }
    if (!email || !email.includes("@")) {
      errors.email = "Enter a valid email address"
    }
    if (!password || password.length < 6) {
      errors.password = "At least 6 characters"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Something went wrong")
        return
      }

      // Sign straight in rather than bouncing through the login form.
      const login = await signIn("credentials", { email, password, redirect: false })
      if (login?.error) {
        router.push("/login")
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
      title="Make your Bundel"
      subtitle="One page for all the links you share."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login${params.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Your name" disabled={isLoading} autoFocus />
        </Field>
        <Field
          label="Username"
          htmlFor="username"
          error={fieldErrors.username}
          hint={username ? `bundel.link/${username}/…` : "Shown on your Bundels"}
        >
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            placeholder="yourname"
            disabled={isLoading}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" disabled={isLoading} />
        </Field>
        <Field label="Password" htmlFor="password" error={fieldErrors.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" disabled={isLoading} />
        </Field>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-[15px] font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="!mt-6">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
