"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCount } from "@/lib/home";
import { buttonClasses } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { LABELS } from "@/lib/data/schema";
import type { TownEntry } from "@/lib/data/schema";
import {
  DEFAULT_DIR,
  DEFAULT_FILTER,
  filterRanked,
  labelStatus,
  matchesQuery,
  nextSort,
  ratioPct,
  signed4,
  sortRanked,
  SORT_LABELS,
} from "@/lib/towns";
import type { RankedEntry, SortDir, SortKey, TownFilter } from "@/lib/towns";

const FIELD =
  "focus-ring min-h-12 w-full rounded-control border border-ink-600 bg-white px-3 text-base text-ink-800";
const TOWN_LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";
const RANKED_LABELS = LABELS.filter((l) => l !== "Not enough sales");
const SORT_KEYS: SortKey[] = ["prb", "prd", "cod", "median", "n_sales", "name"];
/** Phone and iPad cards show this many towns until "Show all" (Prompt 10B). A search or label filter shows every match. */
const CARDS_FIRST = 12;

/** Data quality in a few words: limited data and outlier sensitivity (T6, C8). */
function qualityNotes(t: RankedEntry): string[] {
  const notes: string[] = [];
  if (t.data_quality === "limited data") notes.push("Limited data");
  if (t.stats.label_sensitive_to_outliers) notes.push("Label sensitive to outliers");
  return notes.length ? notes : ["Normal"];
}

/** A column header that sorts. aria-sort tells screen readers the current order. */
function SortHeader({
  k,
  sort,
  onSort,
  align = "left",
}: {
  k: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const on = sort.key === k;
  const Icon = on ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={align === "right" ? "num" : ""}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`focus-ring inline-flex min-h-10 items-center gap-1 rounded-control font-semibold text-navy-900 hover:text-blue-600 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {SORT_LABELS[k]}
        <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${on ? "text-blue-600" : "text-ink-600"}`} strokeWidth={2} />
      </button>
    </th>
  );
}

/**
 * The rankings table with its controls: search, label filter, limited-data
 * toggle, and sorting (PRB by default, methodology 5.4). Phones get one card
 * per town instead of the wide table. Towns without enough sales are listed
 * after the table, never hidden (the search box filters them too).
 */
export function RankingsExplorer({
  ranked,
  unranked,
  thinRevalCount,
}: {
  ranked: RankedEntry[];
  unranked: TownEntry[];
  /** Towns hidden because of a 2026 revaluation (county.json towns_by_data_quality). */
  thinRevalCount: number;
}) {
  const [filter, setFilter] = useState<TownFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "prb", dir: DEFAULT_DIR.prb });
  const ids = { search: useId(), label: useId(), limited: useId(), sortKey: useId(), sortDir: useId() };

  const rows = useMemo(() => sortRanked(filterRanked(ranked, filter), sort.key, sort.dir), [ranked, filter, sort]);
  const thin = unranked.filter(
    (t) => matchesQuery(t.name, filter.query) && (filter.label === "all" || filter.label === t.label),
  );
  const onSort = (k: SortKey) => setSort(nextSort(sort, k));

  // Cards: the first 12 until "Show all", unless the list is already narrowed or only a few more would be hidden.
  const [showAllCards, setShowAllCards] = useState(false);
  const narrowed = filter.query.trim() !== "" || filter.label !== "all";
  const cardsLimited = !showAllCards && !narrowed && rows.length > CARDS_FIRST + 4;
  const cards = cardsLimited ? rows.slice(0, CARDS_FIRST) : rows;
  // After "Show all", keyboard focus moves to the first newly shown town (the button itself disappears).
  const cardLinks = useRef<(HTMLAnchorElement | null)[]>([]);
  const focusCard = useRef<number | null>(null);
  useEffect(() => {
    if (!showAllCards || focusCard.current === null) return;
    cardLinks.current[focusCard.current]?.focus();
    focusCard.current = null;
  }, [showAllCards]);

  return (
    <div>
      {/* Controls: one row above everything they change. */}
      <div className="grid gap-4 rounded-card border border-outline-200 bg-mist-50 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_3fr]">
        <div>
          <label htmlFor={ids.search} className="text-sm font-semibold text-navy-900">
            Search by town name
          </label>
          <input
            id={ids.search}
            type="search"
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            placeholder="For example, Teaneck"
            autoComplete="off"
            className={`${FIELD} mt-1`}
          />
        </div>
        <div>
          <label htmlFor={ids.label} className="text-sm font-semibold text-navy-900">
            Pattern
          </label>
          <select
            id={ids.label}
            value={filter.label}
            onChange={(e) => setFilter({ ...filter, label: e.target.value as TownFilter["label"] })}
            className={`${FIELD} mt-1`}
          >
            <option value="all">All patterns</option>
            {RANKED_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
            <option value="Not enough sales">Not enough sales</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <label htmlFor={ids.limited} className="flex min-h-12 cursor-pointer items-center gap-3 text-base text-ink-800">
            <input
              id={ids.limited}
              type="checkbox"
              checked={filter.includeLimited}
              onChange={(e) => setFilter({ ...filter, includeLimited: e.target.checked })}
              className="focus-ring h-5 w-5 shrink-0 accent-blue-600"
            />
            Include towns with limited data (20 to 39 sales)
          </label>
        </div>
        {/* Sorting for the phone and iPad cards (the table sorts from its column headers). */}
        <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:hidden">
          <div>
            <label htmlFor={ids.sortKey} className="text-sm font-semibold text-navy-900">
              Sort by
            </label>
            <select
              id={ids.sortKey}
              value={sort.key}
              onChange={(e) => {
                const key = e.target.value as SortKey;
                setSort({ key, dir: DEFAULT_DIR[key] });
              }}
              className={`${FIELD} mt-1`}
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ids.sortDir} className="text-sm font-semibold text-navy-900">
              Order
            </label>
            <select
              id={ids.sortDir}
              value={sort.dir}
              onChange={(e) => setSort({ ...sort, dir: e.target.value as SortDir })}
              className={`${FIELD} mt-1`}
            >
              <option value="asc">{sort.key === "name" ? "A to Z" : "Low to high"}</option>
              <option value="desc">{sort.key === "name" ? "Z to A" : "High to low"}</option>
            </select>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-base text-ink-600">
        Showing <span className="tabular-nums">{filter.label === "Not enough sales" ? 0 : rows.length}</span> of{" "}
        <span className="tabular-nums">{ranked.length}</span> ranked towns
        {thin.length > 0 && (
          <>
            {" "}
            and <span className="tabular-nums">{thin.length}</span> without enough sales
          </>
        )}
        . Sorted by {SORT_LABELS[sort.key]}, {sort.dir === "asc" ? "lowest first" : "highest first"}.
      </p>

      {filter.label !== "Not enough sales" && rows.length > 0 && (
        <>
          {/* Laptops and iPads in landscape: the full table. Below 1024px its 9 columns scrolled sideways. */}
          <div className="mt-4 hidden lg:block">
            <DataTable label="Town rankings table" caption="Bergen County towns ranked by PRB, with PRD, COD, median ratio, and sales" maxHeight="max-h-[44rem]">
              <thead>
                <tr>
                  <th scope="col" className="num">Rank</th>
                  <SortHeader k="name" sort={sort} onSort={onSort} />
                  <th scope="col">Pattern</th>
                  <SortHeader k="prb" sort={sort} onSort={onSort} align="right" />
                  <SortHeader k="prd" sort={sort} onSort={onSort} align="right" />
                  <SortHeader k="cod" sort={sort} onSort={onSort} align="right" />
                  <SortHeader k="median" sort={sort} onSort={onSort} align="right" />
                  <SortHeader k="n_sales" sort={sort} onSort={onSort} align="right" />
                  <th scope="col">Data quality</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.slug}>
                    <td className="num">{t.rank}</td>
                    <td className="min-w-40">
                      <Link href={`/towns/${t.slug}`} className={TOWN_LINK}>
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      <StatusPill status={labelStatus(t.label)}>{t.label}</StatusPill>
                    </td>
                    <td className="num whitespace-nowrap">
                      {signed4(t.stats.prb)}
                      <span className="block text-ink-600">
                        {signed4(t.stats.prb_ci_low)} to {signed4(t.stats.prb_ci_high)}
                      </span>
                    </td>
                    <td className="num">{t.stats.prd.toFixed(4)}</td>
                    <td className="num">{t.stats.cod.toFixed(2)}</td>
                    <td className="num">{ratioPct(t.stats.median_ratio)}</td>
                    <td className="num">{formatCount(t.n_sales)}</td>
                    <td className="text-ink-600">{qualityNotes(t).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <p className="mt-2 text-sm text-ink-600">
              The PRB column shows the value and, below it, its 95% range. Rank is the town&rsquo;s place by PRB
              among all ranked towns, most negative first.
            </p>
          </div>

          {/* Phones and iPads: one compact card per town (Prompt 10B). Rank, label, PRB and any data-quality
              note stay in view; PRD, COD, median ratio, and sales sit behind "More numbers". Two columns on iPads. */}
          <ul aria-label="Town cards" className="mt-4 grid gap-3 sm:grid-cols-2 lg:hidden">
            {cards.map((t, i) => {
              const notes = qualityNotes(t).filter((n) => n !== "Normal");
              return (
                <li key={t.slug} className="flex flex-col rounded-card border border-outline-200 bg-white p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <Link
                      href={`/towns/${t.slug}`}
                      ref={(el) => {
                        cardLinks.current[i] = el;
                      }}
                      className={`${TOWN_LINK} min-w-0 text-lg`}
                    >
                      {t.name}
                    </Link>
                    <span className="shrink-0 text-sm text-ink-600">
                      Rank <span className="font-semibold tabular-nums text-navy-900">{t.rank}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <StatusPill status={labelStatus(t.label)}>{t.label}</StatusPill>
                    <p className="text-sm text-ink-600">
                      PRB{" "}
                      <span className="font-semibold tabular-nums text-navy-900">{signed4(t.stats.prb)}</span>{" "}
                      <span className="whitespace-nowrap tabular-nums">
                        ({signed4(t.stats.prb_ci_low)} to {signed4(t.stats.prb_ci_high)})
                      </span>
                    </p>
                  </div>
                  {notes.length > 0 && <p className="mt-2 text-sm text-gold-700">{notes.join(" · ")}</p>}
                  <details className="group mt-2">
                    <summary className="focus-ring inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-control text-sm font-semibold text-blue-600 hover:text-navy-700 [&::-webkit-details-marker]:hidden">
                      <ChevronDown
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-[var(--duration-pop)] ease-[var(--ease-out)] group-open:rotate-180 motion-reduce:transition-none"
                        strokeWidth={2}
                      />
                      More numbers<span className="sr-only"> for {t.name}</span>
                    </summary>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-outline-200 pt-3 text-sm">
                      <div>
                        <dt className="text-ink-600">PRD</dt>
                        <dd className="font-semibold tabular-nums text-navy-900">{t.stats.prd.toFixed(4)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-600">COD</dt>
                        <dd className="font-semibold tabular-nums text-navy-900">{t.stats.cod.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-600">Median ratio</dt>
                        <dd className="font-semibold tabular-nums text-navy-900">{ratioPct(t.stats.median_ratio)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-600">Sales analyzed</dt>
                        <dd className="font-semibold tabular-nums text-navy-900">{formatCount(t.n_sales)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-ink-600">Data quality</dt>
                        <dd className="text-navy-900">{qualityNotes(t).join(", ")}</dd>
                      </div>
                    </dl>
                  </details>
                </li>
              );
            })}
          </ul>
          {cardsLimited && (
            <div className="mt-4 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  focusCard.current = CARDS_FIRST;
                  setShowAllCards(true);
                }}
                className={`${buttonClasses("secondary", "lg")} w-full sm:w-auto`}
              >
                {/* One span, so the button's flex gap doesn't space out the words. */}
                <span>
                  Show all <span className="tabular-nums">{rows.length}</span> towns{" "}
                  <span className="font-normal">
                    (<span className="tabular-nums">{rows.length - CARDS_FIRST}</span> more)
                  </span>
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {filter.label !== "Not enough sales" && rows.length === 0 && (
        <p className="mt-4 rounded-card bg-gray-100 p-4 text-base text-ink-800">
          No ranked town matches. Try a different spelling, pick &ldquo;All patterns&rdquo;, or turn on limited data.
        </p>
      )}

      <section aria-labelledby="thin-towns" className="mt-16">
        <h3 id="thin-towns" className="font-heading text-xl font-bold text-navy-900">
          Towns without enough sales (<span className="tabular-nums">{unranked.length}</span>)
        </h3>
        <p className="mt-2 max-w-prose text-base text-ink-800">
          We need at least 20 usable sales to measure how evenly a town assesses homes. These towns had fewer, so they
          get no statistics or rank. <span className="tabular-nums">{thinRevalCount}</span> of the{" "}
          <span className="tabular-nums">{unranked.length}</span> put new assessments into effect for 2026. The state
          does not use sales recorded in the months just before new assessments take effect, so these towns have very
          few usable sales this year. Each town still has a page with the state&rsquo;s ratio, and the appeal checker still works
          there.
        </p>
        {thin.length > 0 ? (
          // Two across on phones (name over its count), side by side from sm (Prompt 10B: shorter phone page).
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-3">
            {thin.map((t) => (
              <li
                key={t.slug}
                className="flex min-h-12 min-w-0 flex-col justify-center gap-x-4 border-b border-outline-200 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/towns/${t.slug}`} className={`${TOWN_LINK} self-start sm:self-auto`}>
                  {t.name}
                </Link>
                <span className="text-sm text-ink-600 sm:text-right">
                  <span className="tabular-nums">{formatCount(t.n_sales)}</span> {t.n_sales === 1 ? "sale" : "sales"}
                  {t.data_quality === "recent revaluation" && (
                    <>
                      {" "}
                      <span className="whitespace-nowrap">· 2026 revaluation</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-base text-ink-600">No town in this list matches your search.</p>
        )}
      </section>
    </div>
  );
}
