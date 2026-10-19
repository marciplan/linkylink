"use client"

import { Sheet } from "@/components/ui/sheet"

/** Desktop-only "see it as a visitor does": the public page in a phone-shaped frame, reloaded each time it opens. */
export function PreviewDrawer({ open, onOpenChange, src, version }: { open: boolean; onOpenChange: (open: boolean) => void; src: string; version: number }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Preview" description="This is what visitors see on their phone.">
      <div className="mx-auto mt-2 w-[330px] rounded-[44px] bg-black p-2.5 shadow-float">
        {open && <iframe key={version} src={src} title="Visitor preview" className="block h-[620px] w-full rounded-[34px] bg-bg" />}
      </div>
    </Sheet>
  )
}
