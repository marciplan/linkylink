// Seasonal and life moments Bundel is great for. Each gets a card on the
// homepage and its own page at /moments/<slug> that starts a ready-made Bundel.

export interface Moment {
  slug: string
  emoji: string
  /** Card and page title. */
  title: string
  /** Page headline around the tile: [before, after]. */
  headline: [string, string]
  /** One line under the title. */
  line: string
  /** What people search for; the page's <title>. */
  seoTitle: string
  description: string
  /** The Bundel it starts. */
  bundel: { title: string; subtitle: string }
  /** What a finished one could look like. */
  example: { title: string; domain: string; note?: string }[]
  /** Sites this kind of Bundel collects from, for the card's rotating icons. */
  sites: string[]
  /** The sentence to give a connected AI app. */
  aiPrompt: string
  /** Why Bundel beats a chat full of links for this. */
  points: string[]
}

export const MOMENTS: Moment[] = [
  {
    slug: "black-friday",
    emoji: "🛍️",
    title: "Black Friday list",
    headline: ["Black Friday", "without twenty open tabs."],
    line: "Park what you want, let your AI hunt the deals.",
    seoTitle: "Black Friday wishlist and deal tracker",
    description: "Collect the things you're waiting to buy in one list, then ask Claude or ChatGPT to find the best deals for each. Results land right under the product.",
    bundel: { title: "Black Friday", subtitle: "Waiting for these to drop in price" },
    example: [
      { title: "Sony WH-1000XM6", domain: "sony.com", note: "5 deals found" },
      { title: "Dyson Airwrap", domain: "dyson.com", note: "Only if under € 450" },
      { title: "LEGO Millennium Falcon", domain: "lego.com" },
      { title: "Kindle Paperwhite", domain: "amazon.com", note: "For Mum" },
    ],
    sites: ["coolblue.nl", "bol.com", "zalando.com", "apple.com", "mediamarkt.nl", "sony.com", "dyson.com", "lego.com"],
    aiPrompt: "Find deals for everything in my Black Friday Bundel",
    points: [
      "One list instead of twenty open tabs.",
      "Ask your AI to find deals; they appear under each product as \"5 deals found\".",
      "Skip shops you never buy from: results from those sites are never saved.",
    ],
  },
  {
    slug: "gift-list",
    emoji: "🎁",
    title: "Gift list",
    headline: ["Gift lists", "the whole family can see."],
    line: "For Sinterklaas, Christmas or a birthday. Everyone sees the same list.",
    seoTitle: "Shareable gift list for Sinterklaas, Christmas and birthdays",
    description: "Make one gift list and send the link to the family group chat. No account needed to open it, and everyone can suggest ideas.",
    bundel: { title: "Gift ideas", subtitle: "Pick something, tell nobody" },
    example: [
      { title: "Vintage record player", domain: "bol.com", note: "The wooden one" },
      { title: "Cooking class for two", domain: "smartbox.com" },
      { title: "Moomin mug, Winter edition", domain: "moomin.com" },
      { title: "Book: Tomorrow, and Tomorrow, and Tomorrow", domain: "bol.com" },
    ],
    sites: ["etsy.com", "bol.com", "rituals.com", "lego.com", "smartbox.com", "moomin.com", "ikea.com", "hema.nl"],
    aiPrompt: "Find alternatives for the record player in my Gift ideas Bundel",
    points: [
      "One link for the family group chat.",
      "Family can suggest ideas without making an account.",
      "Ask your AI for alternatives when something's sold out.",
    ],
  },
  {
    slug: "trip-planning",
    emoji: "✈️",
    title: "Trip planning",
    headline: ["Trips", "the whole group can vote on."],
    line: "Stays, food and plans in one place. Let the group vote.",
    seoTitle: "Plan a trip with friends: one page for stays, food and plans",
    description: "Put the places, restaurants and ideas for your trip in one Bundel, let your travel buddies vote, and ask your AI to find stays nearby.",
    bundel: { title: "Our trip", subtitle: "Where we stay, eat and go" },
    example: [
      { title: "Casa in Alfama", domain: "airbnb.com", note: "4 votes" },
      { title: "Time Out Market", domain: "timeoutmarket.com", note: "Lunch on day one" },
      { title: "Sintra day trip", domain: "visitportugal.com" },
      { title: "Surf lesson in Ericeira", domain: "surfcamp.pt", note: "If the waves are good" },
    ],
    sites: ["airbnb.com", "booking.com", "tripadvisor.com", "klm.com", "google.com", "getyourguide.com", "ns.nl", "thefork.com"],
    aiPrompt: "Find places to stay near Time Out Market in my trip Bundel",
    points: [
      "Everyone votes on the place to stay, no account needed.",
      "Ask your AI to find stays near a venue or restaurant.",
      "Open it on the trip: it's fast on any phone.",
    ],
  },
  {
    slug: "house-hunting",
    emoji: "🏡",
    title: "House hunting",
    headline: ["House hunting", "with every note in one place."],
    line: "Every listing you're considering, with your notes, in one place.",
    seoTitle: "Track house and apartment listings with notes",
    description: "Save the listings you like with a note on each, share the page with your partner, and compare them side by side with your AI.",
    bundel: { title: "Places to see", subtitle: "Listings we're considering" },
    example: [
      { title: "3-room flat with balcony", domain: "funda.nl", note: "Viewing Thursday 18:00" },
      { title: "Corner house near the park", domain: "funda.nl", note: "Over budget, but…" },
      { title: "Loft in the old factory", domain: "pararius.nl" },
      { title: "Ground floor with garden", domain: "funda.nl", note: "Ask about the parking" },
    ],
    sites: ["funda.nl", "pararius.com", "ikea.com", "marktplaats.nl", "google.com", "jaap.nl", "huispedia.nl", "kadaster.nl"],
    aiPrompt: "Compare the listings in my Places to see Bundel",
    points: [
      "Your notes stay next to each listing.",
      "Share one link with your partner or parents.",
      "Ask your AI to compare them and pick a favourite.",
    ],
  },
  {
    slug: "wedding",
    emoji: "💍",
    title: "Wedding ideas",
    headline: ["Wedding plans", "all in one link."],
    line: "Venues, dresses, music and stays for guests, sorted.",
    seoTitle: "Wedding planning board: venues, ideas and guest info in one link",
    description: "Collect venues and ideas while you plan, then send guests one page with the venue, stays nearby and the playlist.",
    bundel: { title: "Our wedding", subtitle: "Ideas, venues and guest info" },
    example: [
      { title: "Orangery at the estate", domain: "weddingvenues.nl", note: "Our favourite" },
      { title: "Florist: wild meadow style", domain: "instagram.com" },
      { title: "First dance playlist", domain: "spotify.com" },
      { title: "Hotels near the venue", domain: "booking.com", note: "For the guests" },
    ],
    sites: ["pinterest.com", "instagram.com", "spotify.com", "booking.com", "etsy.com", "zola.com", "theknot.com", "canva.com"],
    aiPrompt: "Find places to stay near the venue in my wedding Bundel",
    points: [
      "Plan in one Bundel, share another with guests.",
      "Let your partner vote between venues.",
      "Ask your AI to find hotels near the venue for guests.",
    ],
  },
]

export function findMoment(slug: string) {
  return MOMENTS.find((m) => m.slug === slug)
}
