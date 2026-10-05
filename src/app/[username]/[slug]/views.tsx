"use client"

import dynamic from "next/dynamic"

// Client-side split points. The server only references these wrappers when it
// renders them, so visitors never download the editor or the year-review UI
// (which pulls in the category icon set).
export const OwnerView = dynamic(() => import("./BundelOwnerView"))
export const YearReview = dynamic(() => import("./YearReviewView"))
