"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowUpRight, Heart, Link2, Send, Share, Trash2 } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { buttonStyles } from "@/components/ui/button"
import { Avatar } from "@/components/Avatar"
import { addComment, deleteComment, getComments, incrementLikes } from "@/lib/actions"
import { domainOf } from "@/lib/links"
import { cn } from "@/lib/utils"
import { copyText, shareOrCopy } from "@/lib/share"
import { Favicon } from "./Favicon"
import type { BundelLink } from "./LinkRow"

interface CommentData {
  id: string
  content: string
  createdAt: Date
  user: { username: string; image: string | null }
}

export interface LinkSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: BundelLink
  owner: { username: string; avatar: string | null }
  currentUser?: { username: string; image: string | null } | null
  commentCount?: number
  /** Login URL that returns to this page. */
  loginHref: string
  /** Path to this link inside the Bundel, shared so the note and context come along. */
  shareUrl?: string
}

const likedKey = (id: string) => `bundel-liked:${id}`

export function LinkSheet({ open, onOpenChange, link, owner, currentUser, commentCount = 0, loginHref, shareUrl }: LinkSheetProps) {
  const [likes, setLikes] = useState(link.likes ?? 0)
  const [liked, setLiked] = useState(() => {
    try {
      return localStorage.getItem(likedKey(link.id)) === "1"
    } catch {
      return false
    }
  })
  const [comments, setComments] = useState<CommentData[] | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open || comments !== null || commentCount === 0) return
    getComments(link.id).then(setComments).catch(() => setComments([]))
  }, [open, comments, commentCount, link.id])

  const like = async () => {
    if (liked) return
    setLiked(true)
    setLikes((n) => n + 1)
    if (navigator.vibrate) navigator.vibrate(8)
    try {
      localStorage.setItem(likedKey(link.id), "1")
    } catch {}
    incrementLikes(link.id).catch(() => {})
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const comment = await addComment({ linkId: link.id, content })
      setComments((c) => [...(c ?? []), comment])
      setDraft("")
    } catch {
      toast.error("Couldn't post your comment")
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    const previous = comments
    setComments((c) => c?.filter((x) => x.id !== id) ?? null)
    try {
      await deleteComment(id)
    } catch {
      setComments(previous)
      toast.error("Couldn't delete that comment")
    }
  }

  const canDelete = (c: CommentData) =>
    !!currentUser && (currentUser.username === c.user.username || currentUser.username === owner.username)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={link.title}
      description={domainOf(link.url)}
      footer={
        currentUser ? (
          <form onSubmit={submit} className="flex items-center gap-2">
            <Avatar src={currentUser.image} username={currentUser.username} size={32} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              enterKeyHint="send"
              className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-[16px] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-tint/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Post comment"
              className={buttonStyles({ variant: "tint", size: "icon" })}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <Link href={loginHref} className={buttonStyles({ variant: "secondary", size: "md", className: "w-full" })}>
            Sign in to comment
          </Link>
        )
      }
    >
      <div className="space-y-5 pt-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          ping={`/api/links/${link.id}/click`}
          className={buttonStyles({ variant: "primary", size: "lg" })}
        >
          <Favicon url={link.url} favicon={link.favicon} size={28} className="rounded-lg bg-bg/15" />
          Open link
          <ArrowUpRight className="h-5 w-5" />
        </a>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={like}
            aria-pressed={liked}
            aria-label={`Like (${likes})`}
            className={cn(
              "pressable flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[13px] font-semibold",
              liked ? "bg-tint-soft text-tint-ink" : "bg-surface-2 text-ink"
            )}
          >
            <Heart className={cn("h-5 w-5 transition-transform", liked && "scale-110 fill-current")} />
            {likes > 0 ? likes : "Like"}
          </button>
          <button
            onClick={() => copyText(link.url)}
            className="pressable flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-surface-2 text-[13px] font-semibold"
          >
            <Link2 className="h-5 w-5" />
            Copy
          </button>
          <button
            onClick={() =>
              shareOrCopy({
                title: link.title,
                text: link.context ? `“${link.context}” — @${owner.username}` : undefined,
                url: shareUrl ? window.location.origin + shareUrl : link.url,
              })
            }
            className="pressable flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-surface-2 text-[13px] font-semibold"
          >
            <Share className="h-5 w-5" />
            Share
          </button>
        </div>

        <section aria-label="Comments" className="space-y-1">
          {link.context && (
            <div className="flex gap-3 rounded-2xl bg-tint-soft/60 p-3">
              <Avatar src={owner.avatar} username={owner.username} size={32} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">
                  @{owner.username} <span className="ml-1 rounded-full bg-tint/15 px-1.5 py-0.5 text-[11px] text-tint-ink">curator</span>
                </p>
                <p className="mt-0.5 text-[15px] leading-snug text-pretty">{link.context}</p>
              </div>
            </div>
          )}
          {commentCount > 0 && comments === null && (
            <p className="py-6 text-center text-sm text-ink-3">Loading comments…</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="group flex gap-3 p-3">
              <Avatar src={c.user.image} username={c.user.username} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">
                  @{c.user.username}
                  <span className="ml-2 font-normal text-ink-3">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </p>
                <p className="mt-0.5 break-words text-[15px] leading-snug">{c.content}</p>
              </div>
              {canDelete(c) && (
                <button
                  onClick={() => remove(c.id)}
                  aria-label="Delete comment"
                  className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {!link.context && commentCount === 0 && (comments?.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-ink-3">No comments yet. Start the conversation.</p>
          )}
        </section>
      </div>
    </Sheet>
  )
}
