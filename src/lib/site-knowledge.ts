// What Bundel is, in one place. The FAQ on the homepage and the "Ask a
// question" assistant both read from here, so the AI can only say what the
// site says. Keep it true to the product: update it when features change.

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Bundel free?",
    a: "Yes. Making Bundels, sharing them, voting, following and connecting your AI app are all free. There are no ads on your Bundels.",
  },
  {
    q: "Do my friends need an account?",
    a: "No. Anyone with the link can open your Bundel, vote on it and suggest a link. Only you need an account to make and edit Bundels.",
  },
  {
    q: "Who can see my Bundels?",
    a: "Bundels are public: anyone with the link can open them, and they show on your profile. So keep sensitive things out. Research your AI does for you is the exception: it is saved as a private sub-Bundel that only you can see.",
  },
  {
    q: "How does the AI part work?",
    a: "Connect Claude or ChatGPT to Bundel once. Then ask it to add links or to find deals, alternatives or places to stay for a link. It searches the web itself and saves what it finds under that link. It can add things but never edit or delete them.",
  },
  {
    q: "Can I bring my links from Pocket?",
    a: "Yes. Export your saves from Pocket and import the file. Every link lands in a new Bundel.",
  },
  {
    q: "How do I add a link from my phone?",
    a: "On Android, install Bundel from your browser and it appears in the share sheet. On any phone you can paste a link in the app, and on a computer you can paste or drop a link anywhere on a Bundel.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Delete a link or a whole Bundel at any time, and disconnect AI apps from your account page whenever you like.",
  },
]

/** Everything the assistant may use. Plain facts, no marketing claims. */
export const KNOWLEDGE = `
Bundel (bundel.link) is a free web app for collecting links and sharing them as one good-looking page, called a Bundel. Tagline: "All your links, one page."

Making a Bundel
- Sign up, give the Bundel a name, paste links. The title and icon of each link fill themselves in.
- Every Bundel gets its own colours and an emoji automatically; you can change the emoji and background.
- You can add a short note under each link, reorder links by dragging, and edit or remove them.
- Links can be added by pasting, by dropping a link on the page, from the Android share sheet (after installing Bundel from the browser), by importing a Pocket export, or by asking a connected AI app.

Sharing
- Each Bundel has its own link (bundel.link/username/name) that opens fast on any phone.
- Shared links show a rich preview in WhatsApp, iMessage and social apps, with the Bundel's title, colours and first links.
- You can share a single link from a Bundel too.
- Every user has a public profile page listing their Bundels, which works as a link in bio.
- Bundels are public: anyone with the link can see them. There is no password or private mode, except that AI research results are saved privately for the owner.

Deciding together
- "Ask" mode turns a Bundel into a vote: pick one or pick several. Friends vote without an account and can suggest links, which the owner accepts or declines.
- Visitors can like and comment on links, and "Save a copy" of someone's Bundel to start their own.
- Year in review: rank your favourite albums, films, places and more by category, and share each category as an Instagram Story image.

Following
- Every profile and Bundel has an RSS feed. People can also follow a curator by email and get a daily digest of new links (double opt-in).
- There is a simple e-reader view for Kobo devices.

AI connector (works with Claude and ChatGPT, using the Model Context Protocol, MCP)
- Connect your AI app once, either to one Bundel or to your whole account, by adding the Bundel connector URL (https://www.bundel.link/mcp, or the per-Bundel URL from the Bundel's menu under "Connect AI") and approving it on Bundel.
- Then ask things like "add this to my Black Friday list", "make a Bundel for our Lisbon trip with these links", or "find deals for the Sony headphones".
- Activities: find deals, find alternatives, find places to stay nearby, compare the links in a Bundel. The AI does the web research itself and saves results as a private sub-Bundel under the link, shown as a chip like "5 deals found".
- You can remove any result and choose "Never show this site". In your account you keep a list of sites to skip (for example amazon.com); results from those sites are never saved.
- The AI can only add, never edit or delete. Disconnect any AI app from the account page at any time.

Tidy up
- Bundel suggests links that might fit better in another Bundel; move them one by one or all at once, or ignore them.

Price and privacy
- Bundel is free. No ads on Bundels.
- Bundel collects only what it needs (email, username, the links you add, basic usage analytics), does not sell data, does not track you across other websites, and sends no marketing email unless you opt in. Users can delete links, Bundels and AI connections at any time. More on the privacy page at bundel.link/privacy.

Not available (say so if asked)
- No paid plans, no private or password-protected Bundels, no shared editing of one Bundel by several people, no native iPhone or Android app (it works in the browser and can be installed to the home screen), no custom domains.
`.trim()
