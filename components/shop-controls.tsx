"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import { PRICE_BANDS, SORT_OPTIONS } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type Facets = { sizes: string[]; colors: string[] }

/**
 * Every control writes to the URL and lets the server re-query Postgres, so a
 * filtered view is shareable, back-button friendly and never ships the whole
 * catalogue to the browser to be narrowed down client-side.
 */
export function ShopControls({
  facets,
  categories,
  resultCount,
}: {
  facets: Facets
  categories: { slug: string; name: string }[]
  resultCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [panelOpen, setPanelOpen] = useState(false)
  const [term, setTerm] = useState(params.get("q") ?? "")

  const q = params.get("q") ?? ""
  useEffect(() => setTerm(q), [q])

  function commit(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString())
    mutate(next)
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  /** Selecting the value that's already active clears it — tap to toggle. */
  function setParam(key: string, value: string | null) {
    commit((next) => {
      if (!value || next.get(key) === value) next.delete(key)
      else next.set(key, value)
    })
  }

  // Debounce typing so each keystroke doesn't push a history entry.
  useEffect(() => {
    if (term === q) return
    const timer = setTimeout(() => {
      commit((next) => (term.trim() ? next.set("q", term.trim()) : next.delete("q")))
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const active = ["category", "price", "size", "color", "inStock", "onSale"].filter((key) => params.get(key))
  const activeCount = active.length + (q ? 1 : 0)
  const sort = params.get("sort") ?? "featured"

  return (
    <div className={cn("transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <input
            id="shop-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search sarees, silk, lehenga…"
            className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none transition-colors focus-visible:border-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs tracking-[0.14em] uppercase transition-colors hover:border-primary hover:text-primary"
        >
          <SlidersHorizontal width={14} height={14} strokeWidth={1.6} />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>

        <div className="flex h-10 items-center gap-2 rounded-md border px-3">
          <label htmlFor="shop-sort" className="text-xs tracking-[0.14em] uppercase text-muted-foreground">
            Sort
          </label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(event) => setParam("sort", event.target.value === "featured" ? null : event.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p aria-live="polite" className="ml-auto text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {activeCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {q ? <Chip label={`“${q}”`} onClear={() => setTerm("")} /> : null}
          {active.map((key) => (
            <Chip
              key={key}
              label={chipLabel(key, params.get(key)!, categories)}
              onClear={() => setParam(key, null)}
            />
          ))}
          <button
            type="button"
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            className="text-xs tracking-[0.12em] uppercase text-primary underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-500 ease-silk",
          panelOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="grid gap-6 rounded-lg border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Group title="Category">
              {categories.map((category) => (
                <Option
                  key={category.slug}
                  active={params.get("category") === category.slug}
                  onClick={() => setParam("category", category.slug)}
                >
                  {category.name}
                </Option>
              ))}
            </Group>

            <Group title="Price">
              {PRICE_BANDS.map((band) => (
                <Option
                  key={band.value}
                  active={params.get("price") === band.value}
                  onClick={() => setParam("price", band.value)}
                >
                  {band.label}
                </Option>
              ))}
            </Group>

            <Group title="Size">
              {facets.sizes.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : null}
              {facets.sizes.map((size) => (
                <Option key={size} active={params.get("size") === size} onClick={() => setParam("size", size)}>
                  {size}
                </Option>
              ))}
            </Group>

            <div className="space-y-5">
              <Group title="Colour">
                {facets.colors.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : null}
                {facets.colors.map((color) => (
                  <Option key={color} active={params.get("color") === color} onClick={() => setParam("color", color)}>
                    {color}
                  </Option>
                ))}
              </Group>

              <Group title="Availability">
                <Option active={params.get("inStock") === "1"} onClick={() => setParam("inStock", "1")}>
                  In stock only
                </Option>
                <Option active={params.get("onSale") === "1"} onClick={() => setParam("onSale", "1")}>
                  On sale
                </Option>
              </Group>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-eyebrow text-muted-foreground">{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs">
      {label}
      <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X width={12} height={12} strokeWidth={2} />
        <span className="sr-only">Remove {label} filter</span>
      </button>
    </span>
  )
}

function chipLabel(key: string, value: string, categories: { slug: string; name: string }[]): string {
  if (key === "category") return categories.find((category) => category.slug === value)?.name ?? value
  if (key === "price") return PRICE_BANDS.find((band) => band.value === value)?.label ?? value
  if (key === "inStock") return "In stock"
  if (key === "onSale") return "On sale"
  return value
}
