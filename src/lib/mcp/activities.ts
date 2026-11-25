// Activities an AI app can run on a link. Bundel never does the research: it
// hands the AI these instructions, the AI searches the web on the user's own
// plan, and saves what it found with save_results as a sub-Bundel under the
// link. See docs/mcp-plan.md, "Activities".

export interface Activity {
  key: string
  /** Shown in the app on the chip, e.g. "5 deals found". */
  noun: { one: string; many: string }
  title: string
  /** One line for list_activities and prompts. */
  summary: string
  /** Title of the sub-Bundel; {{title}} is the source link's title. */
  bundelTitle: string
  maxResults: number
  /** The brief for the AI. {{link}} and {{title}} are filled in. */
  instructions: string
}

export const ACTIVITIES: Activity[] = [
  {
    key: "find_deals",
    noun: { one: "deal found", many: "deals found" },
    title: "Find deals",
    summary: "Find the best current prices for this product at trustworthy shops.",
    bundelTitle: "Deals: {{title}}",
    maxResults: 8,
    instructions: `Find where to buy the exact product at {{link}} ("{{title}}") for the best price right now.

- Search shops that sell to the user's country. If you don't know the country, use the shop and currency of the original link as the hint.
- Match the exact model and variant (size, colour, storage). Leave out used, refurbished and marketplace resellers unless they are clearly cheaper and you label them.
- For each result, open the product page and check the price is current. Do not guess prices from search snippets.
- Note per result, one line: shop, price with currency, and the one thing that matters (free shipping, delivery time, coupon, price match). Example: "Coolblue, € 349, free next-day delivery".
- Order cheapest first. Return at most {{max}} results, fewer if fewer are any good.`,
  },
  {
    key: "find_alternatives",
    noun: { one: "alternative", many: "alternatives" },
    title: "Find alternatives",
    summary: "Find similar products, places or services worth comparing.",
    bundelTitle: "Alternatives to {{title}}",
    maxResults: 6,
    instructions: `Find good alternatives to {{link}} ("{{title}}").

- Work out what it is and what someone choosing it cares about (price range, use, size, style, location).
- Look for options that compete on those points: cheaper, better reviewed, or better for a specific need.
- Link each result to its own page (the product, place or service), not to a review roundup.
- Note per result, one line: why it is an alternative and how it differs. Example: "Same noise cancelling, € 80 cheaper, shorter battery".
- Return at most {{max}} results.`,
  },
  {
    key: "find_stays_nearby",
    noun: { one: "place to stay", many: "places to stay" },
    title: "Find places to stay nearby",
    summary: "Find hotels and rentals near this place or event.",
    bundelTitle: "Stays near {{title}}",
    maxResults: 8,
    instructions: `Find places to stay near {{link}} ("{{title}}").

- Work out where it is. If it is an event or venue, use its address; if it is a city or area, use its centre.
- Mix types when they exist: hotels, guesthouses, apartments. Prefer places with good recent reviews.
- Link to the place's own page or a booking page for that exact place, not a search results page.
- Note per result, one line: distance or walking time, price per night if you can see it (say for which dates), and the review score. Example: "8 min walk, about € 140 a night in March, 8.9 on Booking".
- Return at most {{max}} results.`,
  },
  {
    key: "compare",
    noun: { one: "comparison", many: "comparisons" },
    title: "Compare these",
    summary: "Compare the links in this Bundel side by side and pick a winner.",
    bundelTitle: "Comparing {{title}}",
    maxResults: 10,
    instructions: `Compare the links in the Bundel "{{title}}" ({{link}}). Call get_bundel first to read them.

- Work out what they have in common and what someone choosing between them cares about.
- Check each link's page for the facts that decide it (price, specs, location, reviews).
- Save each original link again as a result, with a one-line note on how it scores. Put your pick first and start its note with "Pick:".
- You may add up to two better options you found that were not in the list.
- Return at most {{max}} results.`,
  },
]

export function findActivity(key: string) {
  return ACTIVITIES.find((a) => a.key === key)
}

/** Activities that run on a single link (compare runs on a whole Bundel). */
export const LINK_ACTIVITIES = ACTIVITIES.filter((a) => a.key !== "compare")

export function fill(template: string, values: { link: string; title: string; max?: number }) {
  // Function replacers, so a "$" in a title is never read as a replacement pattern.
  return template
    .replaceAll("{{link}}", () => values.link)
    .replaceAll("{{title}}", () => values.title)
    .replaceAll("{{max}}", () => String(values.max ?? ""))
}

/** The sentence a user pastes into their AI app, e.g. from the chip in Bundel. */
export function activityPrompt(activity: Activity, linkTitle: string, bundelTitle: string) {
  switch (activity.key) {
    case "find_deals":
      return `Find deals for "${linkTitle}" in my Bundel "${bundelTitle}"`
    case "find_alternatives":
      return `Find alternatives to "${linkTitle}" in my Bundel "${bundelTitle}"`
    case "find_stays_nearby":
      return `Find places to stay near "${linkTitle}" in my Bundel "${bundelTitle}"`
    default:
      return `Compare the links in my Bundel "${bundelTitle}"`
  }
}
