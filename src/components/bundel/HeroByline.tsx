import Link from "next/link"
import { Avatar } from "@/components/Avatar"
import { timeAgo } from "@/lib/time-ago"

/** Who made this Bundel and when it last grew, at the start of the hero's meta line. */
export function HeroByline({ username, image, updatedAt }: { username: string; image: string | null; updatedAt?: Date | string | null }) {
  return (
    <>
      <Link href={`/${username}`} className="inline-flex items-center gap-2 hover:text-white">
        <Avatar src={image} username={username} size={24} className="ring-2 ring-white/30" />
        <span>@{username}</span>
      </Link>
      {updatedAt && (
        <>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>Updated {timeAgo(updatedAt)}</span>
        </>
      )}
    </>
  )
}
