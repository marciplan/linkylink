// Shared bits for the Year Review format: how categories look and the one-tap
// starter categories. Categories keep storing a short icon name (so nothing in
// the database changes); it is drawn as a Fluent emoji.

export const ICON_EMOJI: Record<string, string> = {
  Star: "⭐", Heart: "❤️", Award: "🏅", Trophy: "🏆", Medal: "🥇", Crown: "👑", Gem: "💎", Sparkles: "✨",
  Globe: "🌍", Monitor: "🖥️", Laptop: "💻", Smartphone: "📱", Tablet: "📲", Cpu: "🧠", Code: "👨‍💻", Terminal: "⌨️",
  Film: "🎬", Music: "🎵", Headphones: "🎧", Camera: "📷", Video: "📹", Mic: "🎙️", Radio: "📻", Tv: "📺",
  Coffee: "☕", Pizza: "🍕", Utensils: "🍽️", Wine: "🍷", Beer: "🍺", Cake: "🍰", Cookie: "🍪", IceCream: "🍦",
  Plane: "✈️", Car: "🚗", Train: "🚆", Ship: "🚢", MapPin: "📍", Mountain: "🏔️", Palmtree: "🌴", Tent: "⛺",
  ShoppingBag: "🛍️", ShoppingCart: "🛒", Store: "🏪", CreditCard: "💳", Wallet: "👛", DollarSign: "💰", Briefcase: "💼", Building: "🏢",
  Dumbbell: "🏋️", Activity: "🏃", Apple: "🍎", Salad: "🥗", Pill: "💊", Stethoscope: "🩺",
  Gamepad: "🎮", Dice1: "🎲", Puzzle: "🧩", Joystick: "🕹️", Clapperboard: "🎬", Popcorn: "🍿", Drama: "🎭",
  Book: "📕", BookOpen: "📖", GraduationCap: "🎓", Library: "📚", Notebook: "📓", PenTool: "✒️", Lightbulb: "💡",
  Users: "👥", User: "🙂", Baby: "👶", Dog: "🐶", Cat: "🐱", Bird: "🐦", MessageCircle: "💬", Share2: "🔗",
  Sun: "☀️", Moon: "🌙", Cloud: "☁️", Snowflake: "❄️", Leaf: "🍃", Flower: "🌸", TreeDeciduous: "🌳",
  Wrench: "🔧", Hammer: "🔨", Scissors: "✂️", Paintbrush: "🖌️", Palette: "🎨", Brush: "🖌️",
  Bike: "🚴", Target: "🎯", Flag: "🚩", Timer: "⏱️",
  Gift: "🎁", Package: "📦", Box: "📦", Archive: "🗄️", Folder: "📁", Clock: "🕒", Calendar: "📅", Zap: "⚡",
  ThumbsUp: "👍", ThumbsDown: "👎",
}

export const categoryEmoji = (icon: string) => ICON_EMOJI[icon] ?? "⭐"

/** The emoji shown in the category picker, in a friendly order. */
export const PICKER_ICONS = [
  "Music", "Film", "Tv", "Book", "Headphones", "Mic", "Gamepad", "Popcorn",
  "Utensils", "Coffee", "Pizza", "Wine", "Cake", "IceCream", "Salad", "Apple",
  "Plane", "MapPin", "Mountain", "Palmtree", "Tent", "Car", "Ship", "Train",
  "Smartphone", "Laptop", "Code", "Camera", "Palette", "Lightbulb", "Zap", "Gem",
  "ShoppingBag", "Gift", "Dumbbell", "Bike", "Dog", "Cat", "Heart", "Star",
  "Trophy", "Crown", "Sparkles", "ThumbsDown",
] as const

export interface CategoryPreset {
  name: string
  icon: string
  categoryType: "BEST" | "WORST"
  rankLimit: number
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { name: "Albums", icon: "Music", categoryType: "BEST", rankLimit: 5 },
  { name: "Films", icon: "Film", categoryType: "BEST", rankLimit: 5 },
  { name: "Series", icon: "Tv", categoryType: "BEST", rankLimit: 5 },
  { name: "Books", icon: "Book", categoryType: "BEST", rankLimit: 5 },
  { name: "Places", icon: "MapPin", categoryType: "BEST", rankLimit: 5 },
  { name: "Food", icon: "Utensils", categoryType: "BEST", rankLimit: 5 },
  { name: "Games", icon: "Gamepad", categoryType: "BEST", rankLimit: 5 },
  { name: "Podcasts", icon: "Mic", categoryType: "BEST", rankLimit: 5 },
  { name: "Apps", icon: "Smartphone", categoryType: "BEST", rankLimit: 5 },
  { name: "Worst buy", icon: "ShoppingBag", categoryType: "WORST", rankLimit: 3 },
]

/** Hue for a category's card, spread around the review's own hue so cards differ but belong together. */
export const categoryHue = (reviewHue: number, index: number) => (reviewHue + index * 47) % 360

export const RANK_EMOJI = ["🥇", "🥈", "🥉"] as const
export const WORST_EMOJI = ["💩", "🤢", "😬"] as const

/** "Top 5" / "Worst 3": the size of the list the owner chose, not how many picks exist so far. */
export function categoryLabel(c: { categoryType: "BEST" | "WORST"; rankLimit: number }) {
  return c.categoryType === "BEST" ? `Top ${c.rankLimit}` : `Worst ${c.rankLimit}`
}

/** Top-bar title: "2026 Title", unless the title already says the year. */
export function reviewBarTitle(title: string, year: number | null) {
  return year && !title.includes(String(year)) ? `${year} ${title}` : title
}
