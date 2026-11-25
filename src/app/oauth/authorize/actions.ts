"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { buildRedirect, checkAuthorizeRequest, type AuthorizeParams } from "@/lib/mcp/authorize"
import { issueAuthCode } from "@/lib/mcp/oauth"
import { originFromHeaders } from "@/lib/mcp/urls"

/** The user answered the consent screen. Everything is checked again here. */
export async function answerConsent(params: AuthorizeParams, allow: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Sign in first")
  const origin = originFromHeaders(await headers())
  const check = await checkAuthorizeRequest(params, origin, session.user.id)

  if (check.kind === "fatal") throw new Error(check.message)
  if (check.kind === "redirect-error") {
    redirect(buildRedirect(check.redirectUri, { error: check.error, error_description: check.description, state: check.state, iss: origin }))
  }
  if (!allow) {
    redirect(buildRedirect(check.redirectUri, { error: "access_denied", error_description: "The user said no.", state: check.state, iss: origin }))
  }

  const code = await issueAuthCode({
    userId: session.user.id,
    bundelId: check.bundel?.id ?? null,
    client: check.client,
    redirectUri: check.redirectUri,
    codeChallenge: check.codeChallenge,
    resource: check.resource,
    scopes: check.scopes,
  })
  redirect(buildRedirect(check.redirectUri, { code, state: check.state, iss: origin }))
}
