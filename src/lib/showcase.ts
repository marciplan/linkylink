// Example Bundels for /showcase: what people make with Bundel, shown as the
// real phone view. Made-up content, not real users' Bundels.

export interface ShowcaseBundel {
  slug: string
  group: "Plan" | "Wish" | "Share" | "With AI"
  emoji: string
  title: string
  user: string
  meta: string
  links: { title: string; domain: string; note?: string; votes?: number; deals?: boolean }[]
}

export const SHOWCASE_GROUPS: { name: ShowcaseBundel["group"]; line: string }[] = [
  { name: "Plan", line: "Trips, dinners and house hunts, decided together." },
  { name: "Wish", line: "Lists you send to the family group chat." },
  { name: "Share", line: "Your favourites, on one good-looking page." },
  { name: "With AI", line: "Your AI app researched these and saved what it found." },
]

export const SHOWCASE: ShowcaseBundel[] = [
  {
    slug: "lisbon", group: "Plan", emoji: "✈️", title: "Where do we stay in Lisbon?", user: "sanne", meta: "@sanne asks · 7 votes",
    links: [
      { title: "Casa in Alfama", domain: "airbnb.com", votes: 4 },
      { title: "Beach house in Cascais", domain: "booking.com", votes: 2 },
      { title: "Loft near Time Out Market", domain: "airbnb.com", votes: 1 },
    ],
  },
  {
    slug: "dinner", group: "Plan", emoji: "🍽️", title: "Anniversary dinner", user: "daan", meta: "@daan · 4 links",
    links: [
      { title: "Rooftop Italian", domain: "thefork.com", note: "City views, book a week ahead" },
      { title: "Omakase bar", domain: "resy.com" },
      { title: "Farm-to-table outside town", domain: "michelin.com", note: "If we take the car" },
    ],
  },
  {
    slug: "house", group: "Plan", emoji: "🏡", title: "Places to see", user: "fleur", meta: "@fleur · 4 links",
    links: [
      { title: "3-room flat with balcony", domain: "funda.nl", note: "Viewing Thursday 18:00" },
      { title: "Corner house near the park", domain: "funda.nl" },
      { title: "Loft in the old factory", domain: "pararius.nl" },
    ],
  },
  {
    slug: "gifts", group: "Wish", emoji: "🎁", title: "Gift ideas for Dad", user: "lotte", meta: "@lotte · 4 links",
    links: [
      { title: "Vintage record player", domain: "bol.com", note: "The wooden one" },
      { title: "Whiskey tasting for two", domain: "smartbox.com" },
      { title: "Golf lesson voucher", domain: "golf.nl" },
    ],
  },
  {
    slug: "sint", group: "Wish", emoji: "🎅", title: "Sinterklaas list", user: "mo", meta: "@mo · 5 links",
    links: [
      { title: "LEGO Botanicals bonsai", domain: "lego.com" },
      { title: "Moomin mug, winter edition", domain: "moomin.com", note: "Any colour" },
      { title: "Tony's Chocolonely letter", domain: "tonyschocolonely.com" },
    ],
  },
  {
    slug: "birthday", group: "Wish", emoji: "🎂", title: "Turning 30", user: "noor", meta: "@noor · 6 links",
    links: [
      { title: "Weekend in Copenhagen", domain: "booking.com", note: "Chip in with the others?" },
      { title: "Hasselblad print", domain: "etsy.com" },
      { title: "Pottery course", domain: "klei.studio" },
    ],
  },
  {
    slug: "pasta", group: "Share", emoji: "🍝", title: "Pasta nights", user: "lotte", meta: "@lotte · 6 recipes",
    links: [
      { title: "Cacio e pepe", domain: "bonappetit.com", note: "Use the pasta water" },
      { title: "Carbonara the Roman way", domain: "seriouseats.com" },
      { title: "Lemon ricotta pasta", domain: "nytimes.com" },
    ],
  },
  {
    slug: "songs", group: "Share", emoji: "🎧", title: "Songs for the drive", user: "joris", meta: "@joris · 9 links",
    links: [
      { title: "Fred again.. Boiler Room", domain: "youtube.com", note: "The best 60 minutes online" },
      { title: "Bon Iver at AIR Studios", domain: "youtube.com" },
      { title: "Four Tet, Essential Mix", domain: "soundcloud.com" },
    ],
  },
  {
    slug: "reads", group: "Share", emoji: "📚", title: "Books that stuck", user: "bas", meta: "@bas · 5 links",
    links: [
      { title: "Tomorrow, and Tomorrow, and Tomorrow", domain: "bol.com" },
      { title: "The Overstory", domain: "goodreads.com", note: "Slow start, worth it" },
      { title: "Piranesi", domain: "goodreads.com" },
    ],
  },
  {
    slug: "deals", group: "With AI", emoji: "🛍️", title: "Black Friday", user: "marciano", meta: "@marciano · 4 links",
    links: [
      { title: "Sony WH-1000XM6", domain: "sony.com", deals: true },
      { title: "Dyson Airwrap", domain: "dyson.com", note: "Only if under € 450" },
      { title: "LEGO Millennium Falcon", domain: "lego.com" },
    ],
  },
  {
    slug: "stays", group: "With AI", emoji: "💍", title: "Our wedding", user: "eva", meta: "@eva · 6 links",
    links: [
      { title: "Orangery at the estate", domain: "weddingvenues.nl", note: "8 stays found nearby" },
      { title: "Florist: wild meadow style", domain: "instagram.com" },
      { title: "First dance playlist", domain: "spotify.com" },
    ],
  },
  {
    slug: "ghent", group: "With AI", emoji: "🧳", title: "Weekend in Ghent", user: "bas", meta: "@bas · 5 links",
    links: [
      { title: "Gravensteen", domain: "visitgent.be", note: "6 stays found nearby" },
      { title: "Boat tour on the Leie", domain: "tripadvisor.com" },
      { title: "Frites at Frituur No. 1", domain: "google.com" },
    ],
  },
]
