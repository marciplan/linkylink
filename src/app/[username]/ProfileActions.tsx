"use client"

import { useState } from "react"
import { Bell, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FollowSheet } from "@/components/FollowSheet"
import { shareOrCopy } from "@/lib/share"

export function ProfileActions({ username, displayName, emailEnabled }: { username: string; displayName: string; emailEnabled: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-5 flex gap-2">
      <Button variant="primary" className="flex-1" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" />
        Follow
      </Button>
      <Button
        variant="secondary"
        className="flex-1"
        onClick={() => shareOrCopy({ title: `${displayName} on Bundel`, url: window.location.href })}
      >
        <Share className="h-4 w-4" />
        Share
      </Button>
      <FollowSheet open={open} onOpenChange={setOpen} username={username} displayName={displayName} emailEnabled={emailEnabled} />
    </div>
  )
}
