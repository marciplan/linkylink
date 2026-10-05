"use client"

import dynamic from "next/dynamic"

// Client-side split points. The server only references these wrappers when it
// renders them, so visitors never download either editor.
export const OwnerView = dynamic(() => import("./BundelOwnerView"))
export const ReviewOwner = dynamic(() => import("./ReviewOwnerView"))
