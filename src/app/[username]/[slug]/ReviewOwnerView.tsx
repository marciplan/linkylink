"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Reorder, useDragControls } from "framer-motion"
import { toast } from "sonner"
import { ChevronLeft, Eye, GripVertical, Link2, MoreHorizontal, Paintbrush, Plus, Settings2, Share, Trash2 } from "lucide-react"
import { TopBar } from "@/components/bundel/TopBar"
import { topBarButton } from "@/components/bundel/styles"
import { InlineText } from "@/components/bundel/InlineText"
import { AddLinkSheet, type NewLink } from "@/components/bundel/AddLinkSheet"
import { EditLinkSheet } from "@/components/bundel/EditLinkSheet"
import { AppearanceSheet } from "@/components/bundel/AppearanceSheet"
import { Favicon } from "@/components/bundel/Favicon"
import { FluentEmoji } from "@/components/FluentEmoji"
import { YearHero } from "@/components/yearreview/YearHero"
import { RankMark } from "@/components/yearreview/RankMark"
import { CategorySheet, type CategoryDraft } from "@/components/yearreview/CategorySheet"
import { cardBackground, glassPanel, glassRow } from "@/components/yearreview/card-styles"
import { Sheet, ListGroup, ListAction } from "@/components/ui/sheet"
import { Button, buttonStyles } from "@/components/ui/button"
import {
  addCategory, addCategoryItem, deleteCategory, deleteCategoryItem, deleteLinkylink,
  updateCategory, updateCategoryItem, updateCategoryOrder, updateItemRank, updateLinkylink,
} from "@/lib/actions"
import { bundelIcon } from "@/lib/bundel-icon"
import { domainOf } from "@/lib/links"
import { copyText, shareOrCopy } from "@/lib/share"
import { bundelHue } from "@/lib/theme"
import { CATEGORY_PRESETS, categoryEmoji, categoryHue, categoryLabel, reviewBarTitle } from "@/lib/year-review"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  rank: number
  likes: number
}

interface Category {
  id: string
  name: string
  icon: string
  categoryType: "BEST" | "WORST"
  rankLimit: number
  items: Item[]
}

interface ReviewOwnerViewProps {
  review: {
    id: string
    slug: string
    title: string
    subtitle: string | null
    avatar: string | null
    headerImage: string | null
    headerImages: string[]
    year: number | null
    views: number
    user: { username: string; image: string | null }
    categories: Category[]
  }
}

function ItemRow({ item, type, onOpen, onDragEnd }: { item: Item; type: "BEST" | "WORST"; onOpen: () => void; onDragEnd: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="relative list-none" whileDrag={{ scale: 1.02, zIndex: 10 }}>
      <div className={cn("flex items-center gap-2 rounded-2xl p-2", glassRow)}>
        <button type="button" onClick={onOpen} aria-label={`Edit ${item.title}`} className="pressable flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left">
          <RankMark rank={item.rank} type={type} size={34} />
          <Favicon url={item.url} favicon={item.favicon} size={40} className="rounded-[14px] bg-white/20" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block text-[16px] font-semibold leading-snug">{item.title}</span>
            <span className="block truncate text-[13px] text-white/65">{item.context || domainOf(item.url)}</span>
          </span>
        </button>
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Drag to reorder"
          className="grid h-11 w-10 shrink-0 cursor-grab touch-none place-items-center rounded-full text-white/60 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function ReviewOwnerView({ review }: ReviewOwnerViewProps) {
  const router = useRouter()
  const [title, setTitle] = useState(review.title)
  const [subtitle, setSubtitle] = useState(review.subtitle ?? "")
  const [avatar, setAvatar] = useState(review.avatar)
  const [headerImage, setHeaderImage] = useState(review.headerImage)
  const [categories, setCategories] = useState(review.categories)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: Item } | null>(null)
  const [categorySheet, setCategorySheet] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [menuOpen, setMenuOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [startingPreset, setStartingPreset] = useState<string | null>(null)
  const categoriesRef = useRef(categories)
  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  const hue = bundelHue(review.slug)
  const icon = bundelIcon(avatar, review.user.image, title)
  const path = `/${review.user.username}/${review.slug}`
  const editingCategory = categories.find((c) => c.id === categorySheet.id) ?? null
  const addingCategory = categories.find((c) => c.id === addingTo) ?? null
  const picks = categories.reduce((n, c) => n + c.items.length, 0)

  const saveReview = async (data: Parameters<typeof updateLinkylink>[1]) => {
    try {
      await updateLinkylink(review.id, data)
    } catch {
      toast.error("Couldn't save that change")
    }
  }

  const createCategory = async (draft: CategoryDraft) => {
    try {
      const created = await addCategory({ linkylinkId: review.id, ...draft, icon: draft.icon as Parameters<typeof addCategory>[0]["icon"] })
      const category: Category = { ...created, categoryType: created.categoryType, items: [] }
      setCategories((list) => [...list, category])
      setAddingTo(category.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add that category")
      throw error
    }
  }

  const startPreset = async (name: string) => {
    const preset = CATEGORY_PRESETS.find((p) => p.name === name)!
    setStartingPreset(name)
    try {
      await createCategory(preset)
    } catch {
      // toast already shown
    } finally {
      setStartingPreset(null)
    }
  }

  const patchCategory = (id: string, changes: Partial<Category>) =>
    setCategories((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)))

  const updateCat = async (id: string, changes: Partial<CategoryDraft>) => {
    const before = categoriesRef.current
    patchCategory(id, changes)
    try {
      await updateCategory(id, changes)
    } catch {
      setCategories(before)
      toast.error("Couldn't save that change")
    }
  }

  const moveCategory = async (id: string, direction: -1 | 1) => {
    const before = categoriesRef.current
    const from = before.findIndex((c) => c.id === id)
    const to = from + direction
    if (from < 0 || to < 0 || to >= before.length) return
    const next = [...before]
    ;[next[from], next[to]] = [next[to], next[from]]
    setCategories(next)
    try {
      await updateCategoryOrder(review.id, next.map((c) => c.id))
    } catch {
      setCategories(before)
      toast.error("Couldn't reorder")
    }
  }

  const removeCategory = async (id: string) => {
    const before = categoriesRef.current
    setCategories((list) => list.filter((c) => c.id !== id))
    setCategorySheet({ open: false, id: null })
    try {
      await deleteCategory(id)
      toast("Category deleted")
    } catch {
      setCategories(before)
      toast.error("Couldn't delete that category")
    }
  }

  const addItem = async ({ title: itemTitle, url, context }: NewLink) => {
    if (!addingTo) return
    try {
      const created = await addCategoryItem({ categoryId: addingTo, title: itemTitle, url, context })
      setCategories((list) => list.map((c) => (c.id === addingTo ? { ...c, items: [...c.items, { ...created, likes: created.likes ?? 0 }] } : c)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add that")
      throw error
    }
  }

  const editItem = async (itemId: string, changes: { title?: string; url?: string; context?: string | null }) => {
    const before = categoriesRef.current
    setCategories((list) => list.map((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)) })))
    try {
      const updated = await updateCategoryItem(itemId, changes)
      setCategories((list) => list.map((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, favicon: updated.favicon } : i)) })))
    } catch {
      setCategories(before)
      toast.error("Couldn't save that pick")
    }
  }

  const removeItem = async (itemId: string) => {
    const before = categoriesRef.current
    setCategories((list) =>
      list.map((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId).map((i, idx) => ({ ...i, rank: idx + 1 })) }))
    )
    try {
      await deleteCategoryItem(itemId)
    } catch {
      setCategories(before)
      toast.error("Couldn't remove that pick")
    }
  }

  const reorderItems = (categoryId: string, items: Item[]) =>
    patchCategory(categoryId, { items: items.map((i, idx) => ({ ...i, rank: idx + 1 })) })

  const persistOrder = (categoryId: string) => {
    const category = categoriesRef.current.find((c) => c.id === categoryId)
    if (category) updateItemRank(categoryId, category.items.map((i) => i.id)).catch(() => toast.error("Couldn't save the new order"))
  }

  const shareReview = () => shareOrCopy({ title, text: `My ${review.year ?? ""} in review`.trim(), url: window.location.origin + path })

  return (
    <div data-tint style={{ "--tint-h": hue } as React.CSSProperties} className="min-h-dvh bg-bg">
      <style>{`:root{--tint-h:${hue}}`}</style>
      <TopBar
        title={reviewBarTitle(title, review.year)}
        leading={
          <Link href="/dashboard" className={topBarButton} aria-label="Back to your Bundels">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        }
        trailing={
          <>
            <Link href={`${path}?view=public`} className={topBarButton} aria-label="Preview as a visitor">
              <Eye className="h-[18px] w-[18px]" />
            </Link>
            <button onClick={() => setMenuOpen(true)} className={topBarButton} aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </>
        }
      />

      <YearHero
        hue={hue}
        year={review.year}
        headerImage={headerImage}
        title={<InlineText key={title} label="Review title" value={title} maxLength={100} placeholder="Name your review" onCommit={(v) => { if (!v) return; setTitle(v); saveReview({ title: v }) }} />}
        subtitle={<InlineText key={subtitle} label="Review description" value={subtitle} maxLength={200} placeholder="Add a line about your year" onCommit={(v) => { setSubtitle(v); saveReview({ subtitle: v }) }} />}
        meta={
          <>
            <span>@{review.user.username}</span>
            <span aria-hidden>·</span>
            <span>{categories.length} {categories.length === 1 ? "category" : "categories"}</span>
            <span aria-hidden>·</span>
            <span>{picks} {picks === 1 ? "pick" : "picks"}</span>
          </>
        }
      />
      <div id="hero-end" aria-hidden />

      <main className="relative -mt-7 rounded-t-4xl bg-bg pb-40 pt-5">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          {categories.length === 0 && (
            <section className="animate-rise rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line/50">
              <h2 className="text-title">Start your {review.year}</h2>
              <p className="mt-1 text-[15px] text-ink-2 text-pretty">Pick a category, then add your #1. Takes ten seconds each.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORY_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    disabled={!!startingPreset}
                    onClick={() => startPreset(p.name)}
                    className="pressable inline-flex h-12 items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-5 text-[16px] font-semibold disabled:opacity-50"
                  >
                    <FluentEmoji emoji={categoryEmoji(p.icon)} size={24} />
                    {p.name}
                  </button>
                ))}
                <button
                  onClick={() => setCategorySheet({ open: true, id: null })}
                  className="pressable inline-flex h-12 items-center gap-2 rounded-full border-2 border-dashed border-line px-5 text-[16px] font-semibold text-ink-2"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Your own
                </button>
              </div>
            </section>
          )}

          {categories.map((category, ci) => {
            const best = category.categoryType === "BEST"
            const full = category.items.length >= category.rankLimit
            return (
              <section
                key={category.id}
                aria-label={category.name}
                className="grain relative overflow-hidden rounded-[32px] p-4 text-white shadow-float"
                style={{ background: cardBackground(categoryHue(hue, ci), category.categoryType) }}
              >
                <header className="flex items-center gap-3 pl-1">
                  <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[20px]", glassPanel)}>
                    <FluentEmoji emoji={categoryEmoji(category.icon)} size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">{categoryLabel(category)}</p>
                    <h2 className="truncate text-[22px] font-extrabold leading-tight tracking-tight">{category.name}</h2>
                  </div>
                  <button
                    onClick={() => setCategorySheet({ open: true, id: category.id })}
                    aria-label={`Edit ${category.name}`}
                    className={cn("pressable grid h-11 w-11 shrink-0 place-items-center rounded-full", glassPanel)}
                  >
                    <Settings2 className="h-[18px] w-[18px]" />
                  </button>
                </header>

                <div className="mt-4 space-y-2">
                  <Reorder.Group axis="y" values={category.items} onReorder={(items) => reorderItems(category.id, items)} className="space-y-2">
                    {category.items.map((item) => (
                      <ItemRow key={item.id} item={item} type={category.categoryType} onOpen={() => setEditingItem({ categoryId: category.id, item })} onDragEnd={() => persistOrder(category.id)} />
                    ))}
                  </Reorder.Group>
                  {!full && (
                    <button
                      onClick={() => setAddingTo(category.id)}
                      className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/35 text-[16px] font-semibold text-white/90"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                      {category.items.length === 0 ? (best ? "Add your #1" : "Add the worst") : `Add #${category.items.length + 1}`}
                    </button>
                  )}
                </div>
              </section>
            )
          })}

          {categories.length > 0 && (
            <button
              onClick={() => setCategorySheet({ open: true, id: null })}
              className="pressable flex h-16 w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line text-[16px] font-semibold text-ink-2"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              Add a category
            </button>
          )}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe">
        <div className="glass pointer-events-auto mb-1 flex w-full max-w-sm items-center gap-2 rounded-full border border-line/60 p-1.5 shadow-float">
          <Button variant="primary" size="md" className="flex-1" onClick={() => setCategorySheet({ open: true, id: null })}>
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            Category
          </Button>
          <Button variant="secondary" size="icon" onClick={shareReview} aria-label="Share">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <AddLinkSheet
        open={!!addingTo}
        onOpenChange={(open) => !open && setAddingTo(null)}
        onAdd={addItem}
        heading={addingCategory ? `${addingCategory.name} · ${addingCategory.categoryType === "BEST" ? "#" : "worst #"}${addingCategory.items.length + 1}` : "Add a pick"}
        submitLabel="Add pick"
      />

      <EditLinkSheet
        link={editingItem ? { ...editingItem.item, likes: editingItem.item.likes } : null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={editItem}
        onDelete={removeItem}
      />

      <CategorySheet
        open={categorySheet.open}
        onOpenChange={(open) => setCategorySheet((s) => ({ ...s, open }))}
        editing={
          editingCategory
            ? {
                id: editingCategory.id,
                name: editingCategory.name,
                icon: editingCategory.icon,
                categoryType: editingCategory.categoryType,
                rankLimit: editingCategory.rankLimit,
                itemCount: editingCategory.items.length,
                canMoveUp: categories[0]?.id !== editingCategory.id,
                canMoveDown: categories[categories.length - 1]?.id !== editingCategory.id,
              }
            : null
        }
        usedNames={categories.map((c) => c.name)}
        onCreate={createCategory}
        onUpdate={(changes) => editingCategory && updateCat(editingCategory.id, changes)}
        onMove={(direction) => editingCategory && moveCategory(editingCategory.id, direction)}
        onDelete={() => editingCategory && removeCategory(editingCategory.id)}
      />

      <AppearanceSheet
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        bundel={{ id: review.id, title, subtitle, headerImages: review.headerImages }}
        hue={hue}
        icon={icon.kind === "emoji" ? icon.value : ""}
        headerImage={headerImage}
        onIconChange={(emoji) => {
          setAvatar(emoji)
          saveReview({ avatar: emoji })
        }}
        onHeaderChange={(image) => {
          setHeaderImage(image)
          saveReview({ headerImage: image })
        }}
      />

      <Sheet
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open)
          if (!open) setConfirmDelete(false)
        }}
        title={reviewBarTitle(title, review.year)}
        description={`bundel.link${path}`}
      >
        {confirmDelete ? (
          <div className="space-y-3 pt-2">
            <p className="text-[15px] text-ink-2 text-pretty">
              This permanently deletes “{title}” with its {categories.length} {categories.length === 1 ? "category" : "categories"} and {picks} {picks === 1 ? "pick" : "picks"}.
            </p>
            <Button
              variant="danger"
              size="lg"
              onClick={async () => {
                await deleteLinkylink(review.id)
                toast("Review deleted")
                router.push("/dashboard")
              }}
            >
              <Trash2 className="h-5 w-5" />
              Delete review
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <ListGroup>
              <ListAction icon={<Share className="h-5 w-5" />} label="Share" onClick={shareReview} />
              <ListAction icon={<Link2 className="h-5 w-5" />} label="Copy link" onClick={() => copyText(window.location.origin + path)} />
              <ListAction
                icon={<Paintbrush className="h-5 w-5" />}
                label="Appearance"
                onClick={() => {
                  setMenuOpen(false)
                  setAppearanceOpen(true)
                }}
              />
            </ListGroup>
            <Link href={`${path}?view=public`} className={buttonStyles({ variant: "secondary", size: "lg" })}>
              <Eye className="h-5 w-5" />
              Preview as a visitor
            </Link>
            <ListGroup>
              <ListAction tone="danger" icon={<Trash2 className="h-5 w-5" />} label="Delete review" onClick={() => setConfirmDelete(true)} />
            </ListGroup>
          </div>
        )}
      </Sheet>
    </div>
  )
}
