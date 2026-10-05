"use client"

import { LinkRowBody, type BundelLink } from "@/components/bundel/LinkRow"
import { LinkMoreButton } from "@/components/bundel/LinkMoreButton"
import { cn } from "@/lib/utils"
import type { VoteSummary } from "@/lib/sharing"
import { AskProvider, type AskSettings } from "./AskProvider"
import { AskCard } from "./AskCard"
import { VoteBar } from "./VoteBar"

interface AskVisitorListProps {
  bundelId: string
  bundelPath: string
  ask: AskSettings
  summary: VoteSummary
  links: BundelLink[]
  commentCounts: Record<string, number>
  owner: { username: string; avatar: string | null }
  currentUser: { username: string; image: string | null } | null
  loginHref: string
  focusLinkId?: string
  readOnly?: boolean
}

/** Visitor list for a Bundel in Ask mode: the question, then each link with its vote bar. */
export default function AskVisitorList(props: AskVisitorListProps) {
  const { links, commentCounts, owner, currentUser, loginHref, focusLinkId } = props
  const titles = Object.fromEntries(links.map((l) => [l.id, l.title]))

  return (
    <AskProvider
      bundelId={props.bundelId}
      ask={props.ask}
      initialSummary={props.summary}
      ownerName={owner.username}
      signedInAs={currentUser?.username ?? null}
      readOnly={props.readOnly}
    >
      <div className="space-y-3">
        <AskCard titles={titles} />
        <ol className="space-y-2.5">
          {links.map((link, i) => (
            <li
              key={link.id}
              id={`l-${link.id}`}
              className={cn(
                "stagger relative scroll-mt-24 rounded-3xl bg-surface shadow-card ring-1 ring-line/50",
                focusLinkId === link.id && "ring-2 ring-tint"
              )}
              style={{ "--i": i } as React.CSSProperties}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                ping={`/api/links/${link.id}/click`}
                className="pressable block rounded-3xl p-4 pb-3"
              >
                <LinkRowBody link={link} commentCount={commentCounts[link.id] ?? 0} />
              </a>
              <VoteBar linkId={link.id} title={link.title} />
              <LinkMoreButton
                link={link}
                owner={owner}
                currentUser={currentUser}
                commentCount={commentCounts[link.id] ?? 0}
                loginHref={loginHref}
                shareUrl={`${props.bundelPath}?l=${link.id}`}
              />
            </li>
          ))}
        </ol>
      </div>
    </AskProvider>
  )
}
