"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { FluentEmoji } from "@/components/FluentEmoji"
import { CATEGORY_PRESETS, PICKER_ICONS, categoryEmoji, type CategoryPreset } from "@/lib/year-review"
import { cn } from "@/lib/utils"

export interface CategoryDraft {
  name: string
  icon: string
  categoryType: "BEST" | "WORST"
  rankLimit: number
}

interface CategorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent when creating a new category. */
  editing?: (CategoryDraft & { id: string; itemCount: number; canMoveUp: boolean; canMoveDown: boolean }) | null
  /** Names already used, so presets can hide once added. */
  usedNames: string[]
  onCreate: (draft: CategoryDraft) => Promise<void>
  onUpdate: (changes: Partial<CategoryDraft>) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("pressable h-11 rounded-xl text-sm font-semibold", value === o.value ? "bg-surface text-ink shadow-card" : "text-ink-2")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** One panel for making a category and for changing one. In edit mode each change saves as it is made. */
export function CategorySheet({ open, onOpenChange, editing, usedNames, onCreate, onUpdate, onMove, onDelete }: CategorySheetProps) {
  const [draft, setDraft] = useState<CategoryDraft>({ name: "", icon: "Star", categoryType: "BEST", rankLimit: 5 })
  const [saving, setSaving] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null | undefined>(undefined)

  // Reset the form whenever the sheet is pointed at a different category (or none).
  const targetId = open ? (editing?.id ?? null) : undefined
  if (targetId !== loadedId) {
    setLoadedId(targetId)
    setConfirmDelete(false)
    if (targetId !== undefined) {
      setDraft(editing ? { name: editing.name, icon: editing.icon, categoryType: editing.categoryType, rankLimit: editing.rankLimit } : { name: "", icon: "Star", categoryType: "BEST", rankLimit: 5 })
    }
  }

  const isEdit = !!editing
  const current = draft

  const change = (changes: Partial<CategoryDraft>) => {
    setDraft((d) => ({ ...d, ...changes }))
    if (isEdit) onUpdate(changes)
  }

  const create = async (d: CategoryDraft, key: string) => {
    setSaving(key)
    try {
      await onCreate(d)
      onOpenChange(false)
    } catch {
      // The caller already told the person what went wrong.
    } finally {
      setSaving(null)
    }
  }

  const presets = CATEGORY_PRESETS.filter((p) => !usedNames.some((n) => n.toLowerCase() === p.name.toLowerCase()))
  const limitMax = 10

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && isEdit && draft.name.trim() && draft.name.trim() !== editing!.name) onUpdate({ name: draft.name.trim() })
        onOpenChange(o)
      }}
      title={isEdit ? "Edit category" : "Add a category"}
      footer={
        isEdit ? (
          <Button variant="primary" size="lg" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        ) : (
          <Button variant="primary" size="lg" disabled={!draft.name.trim() || !!saving} onClick={() => create({ ...draft, name: draft.name.trim() }, "custom")}>
            {saving === "custom" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
            Add category
          </Button>
        )
      }
    >
      <div className="space-y-5 pt-2">
        {!isEdit && presets.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Quick start</h3>
            <div className="flex flex-wrap gap-2">
              {presets.map((p: CategoryPreset) => (
                <button
                  key={p.name}
                  disabled={!!saving}
                  onClick={() => create(p, p.name)}
                  className="pressable inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 pl-3 pr-4 text-[15px] font-semibold disabled:opacity-50"
                >
                  {saving === p.name ? <Loader2 className="h-5 w-5 animate-spin" /> : <FluentEmoji emoji={categoryEmoji(p.icon)} size={22} />}
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-4 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Or make your own</p>
          </section>
        )}

        <div className="space-y-1.5">
          <label htmlFor="category-name" className="block px-1 text-[13px] font-semibold text-ink-2">
            Name
          </label>
          <Input
            id="category-name"
            value={current.name}
            maxLength={100}
            enterKeyHint="done"
            placeholder="Podcasts, Restaurants, Gadgets…"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onBlur={() => isEdit && draft.name.trim() && draft.name.trim() !== editing!.name && onUpdate({ name: draft.name.trim() })}
          />
        </div>

        <section>
          <h3 className="mb-2 px-1 text-[13px] font-semibold text-ink-2">Icon</h3>
          <div className="grid grid-cols-6 gap-1.5">
            {PICKER_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => change({ icon })}
                aria-pressed={current.icon === icon}
                aria-label={icon}
                className={cn("pressable grid aspect-square place-items-center rounded-2xl", current.icon === icon ? "bg-tint-soft ring-2 ring-tint" : "bg-surface-2")}
              >
                <FluentEmoji emoji={categoryEmoji(icon)} size={30} />
              </button>
            ))}
          </div>
        </section>

        <Segmented
          label="Kind of list"
          value={current.categoryType}
          options={[
            { value: "BEST", label: "Best of" },
            { value: "WORST", label: "Worst of" },
          ]}
          onChange={(categoryType) => change({ categoryType, ...(categoryType === "WORST" && current.rankLimit > 3 ? { rankLimit: 3 } : {}) })}
        />

        <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-2.5">
          <span>
            <span className="block text-[15px] font-medium">How many places</span>
            <span className="block text-[13px] text-ink-3">{current.categoryType === "BEST" ? "Top" : "Worst"} {current.rankLimit}</span>
          </span>
          <span className="flex items-center gap-1">
            <button
              aria-label="Fewer places"
              disabled={current.rankLimit <= Math.max(1, editing?.itemCount ?? 1)}
              onClick={() => change({ rankLimit: current.rankLimit - 1 })}
              className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold tabular-nums">{current.rankLimit}</span>
            <button
              aria-label="More places"
              disabled={current.rankLimit >= limitMax}
              onClick={() => change({ rankLimit: current.rankLimit + 1 })}
              className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </span>
        </div>

        {isEdit && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" disabled={!editing!.canMoveUp} onClick={() => onMove(-1)}>
                <ArrowUp className="h-4 w-4" />
                Move up
              </Button>
              <Button variant="secondary" disabled={!editing!.canMoveDown} onClick={() => onMove(1)}>
                <ArrowDown className="h-4 w-4" />
                Move down
              </Button>
            </div>
            {confirmDelete ? (
              <div className="space-y-2 rounded-2xl bg-danger/10 p-3">
                <p className="text-[14px] text-danger">
                  Delete “{editing!.name}”{editing!.itemCount ? ` and its ${editing!.itemCount} ${editing!.itemCount === 1 ? "pick" : "picks"}` : ""}?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </Button>
                  <Button variant="danger" className="bg-danger/15" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Delete category
              </Button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
