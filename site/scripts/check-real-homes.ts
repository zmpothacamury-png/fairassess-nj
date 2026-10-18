// npm run check-real-homes: run every home in private/test-homes.csv through the
// website's own checker engine (lib/checker, the same code homeowners use) and
// write private/real-home-results.md. Both files stay in private/ and are never
// pushed. The 2 homes with an estimate and the fewest comps get every step of the math written
// out, so the result can be checked with a calculator.
//
// CSV columns (header row needed, order does not matter):
//   town            town name or slug, e.g. "Old Tappan" or "old-tappan"
//   assessed_value  whole dollars
//   own_estimate    optional: the owner's own market value estimate
//   note            optional: a short label (never an address or owner name)
//
// Optional arguments: [csv path] [output path], relative to the site/ folder.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  CHAPTER123_TAX_YEAR,
  DAYS_PER_MONTH,
  HALF_LIFE_MONTHS,
  VALUATION_DATE,
} from "../lib/checker/config";
import {
  estimateMarketValue,
  runChecker,
  scoreComps,
  selectComps,
  timeAdjust,
  validateInputs,
  type CheckerResult,
  type ScoredComp,
} from "../lib/checker";
import { PriceIndexSchema, TownFileSchema, TownsSchema, type TownFile } from "../lib/data/schema";

const ROOT = process.cwd();
const csvPath = path.resolve(ROOT, process.argv[2] ?? "../private/test-homes.csv");
const outPath = path.resolve(ROOT, process.argv[3] ?? "../private/real-home-results.md");
const DATA = path.join(ROOT, "public", "data");
const HAND_MATH_HOMES = 2;

// ---------------------------------------------------------------- input

type Home = { row: number; town: string; assessed: string; own: string; note: string };

/** Split one CSV line into fields. Handles "quoted, fields" and "" inside quotes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Read the homes CSV. Finds each column by a word in its header, so small header changes still work. */
function readHomes(file: string): Home[] {
  const lines = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  // Match whole words at their start ("own_estimate" has the word "own"; "town" does not).
  const col = (...words: string[]) =>
    header.findIndex((h) => h.split(/[^a-z]+/).some((word) => words.some((w) => word.startsWith(w))));
  const town = col("town", "municipality");
  const assessed = col("assess");
  const own = col("own", "estimate", "market");
  const note = col("note", "label", "id");
  if (town < 0 || assessed < 0) {
    throw new Error(`${file}: the header needs a "town" column and an "assessed_value" column. Found: ${lines[0]}`);
  }
  return lines.slice(1).map((line, i) => {
    const f = splitCsvLine(line);
    return { row: i + 2, town: f[town] ?? "", assessed: f[assessed] ?? "", own: own >= 0 ? f[own] ?? "" : "", note: note >= 0 ? f[note] ?? "" : "" };
  });
}

const towns = TownsSchema.parse(JSON.parse(readFileSync(path.join(DATA, "towns.json"), "utf8")));
const priceIndex = PriceIndexSchema.parse(JSON.parse(readFileSync(path.join(DATA, "price-index.json"), "utf8")));
const slugs = towns.map((t) => t.slug);
const townCache = new Map<string, TownFile>();

/** "Old Tappan", "old tappan", or "old-tappan" -> "old-tappan". Unknown names pass through so validateInputs reports them. */
function toSlug(town: string): string {
  const key = town.trim().toLowerCase();
  const hit = towns.find((t) => t.slug === key || t.name.toLowerCase() === key);
  return hit ? hit.slug : key;
}

function loadTown(slug: string): TownFile {
  if (!townCache.has(slug)) {
    townCache.set(slug, TownFileSchema.parse(JSON.parse(readFileSync(path.join(DATA, "towns", `${slug}.json`), "utf8"))));
  }
  return townCache.get(slug)!;
}

// ---------------------------------------------------------------- formatting

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const r4 = (n: number) => n.toFixed(4);
const r6 = (n: number) => n.toFixed(6);
const pct2 = (n: number) => `${n.toFixed(2)}%`;
const VERDICT_WORDS: Record<CheckerResult["verdict"], string> = {
  "may-have-grounds": "May have grounds to appeal",
  "within-range": "Within the normal range",
  "possibly-under-assessed": "May be lower than typical",
  "not-enough-data": "Not enough data",
  "revaluation-no-test": "No Chapter 123 test in 2027 (revaluation town)",
};

/** Months between two YYYY-MM strings. */
function monthGap(fromYm: string, toYm: string): number {
  const [y1, m1] = fromYm.split("-").map(Number);
  const [y2, m2] = toYm.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

// ---------------------------------------------------------------- checks that flag a surprising result

/** Plain-English reasons a result might look wrong or surprising, with why it happened. */
function flags(r: CheckerResult, town: TownFile): string[] {
  const out: string[] = [];
  const pool = town.comps.filter((c) => c.deed_date >= town.comp_window.deed_date_from && c.deed_date <= town.comp_window.deed_date_to);
  const poolValues = pool.map((c) => c.assessed_value);
  if (r.verdict === "not-enough-data") {
    out.push(
      pool.length < 5
        ? `${town.name} has only ${pool.length} usable sales in the whole comp window, so no assessed value can reach 5 comps (rule K3).`
        : `Only ${r.comps.count} sales were assessed within ${r.comps.bandPercent}% of ${usd(r.assessedValue)}. ${town.name} has ${pool.length} usable sales in the window, assessed from ${usd(Math.min(...poolValues))} to ${usd(Math.max(...poolValues))}, so few are close to this home.`,
    );
  }
  if (poolValues.length > 0 && (r.assessedValue < Math.min(...poolValues) || r.assessedValue > Math.max(...poolValues))) {
    out.push(`The assessed value is outside the range of every sale in town (${usd(Math.min(...poolValues))} to ${usd(Math.max(...poolValues))}), so all comps sit on one side of it.`);
  }
  if (r.comps.widened && r.verdict !== "not-enough-data") {
    out.push(`Only ${r.comps.countAtFirstBand} comps within 15%, so the search widened to 25% (rule K2). The comps are less similar than usual.`);
  }
  if (r.estimate) {
    const spread = r.estimate.marketValueHigh / r.estimate.marketValueLow;
    if (spread > 1.3) {
      out.push(`The value range is wide: the high end is ${Math.round((spread - 1) * 100)}% above the low end. The comps' ratios vary a lot, so the middle estimate is less certain.`);
    }
    if (r.chapter123) {
      const toUpper = r.chapter123.upperTrigger - r.chapter123.homeownerRatio;
      if (r.verdict === "within-range" && toUpper < 2) {
        out.push(`The ratio is within ${toUpper.toFixed(2)} points of the upper limit. A small change in the estimate could flip it to "may have grounds".`);
      }
    }
  }
  if (r.verdict === "may-have-grounds") {
    out.push("The comps found grounds. That is rare with real data (methodology Section 7: 7 of 3,894 tested values, all in Alpine and Old Tappan), so double-check this one.");
  }
  if (r.ownEstimate?.differenceShare != null && r.ownEstimate.differenceShare > 0.2) {
    out.push(`The owner's estimate is ${Math.round(r.ownEstimate.differenceShare * 100)}% away from ours (rule K9 warns above 20%). Our estimate knows nothing about size, condition, or updates.`);
  }
  if (r.ownEstimate?.test && r.chapter123 && r.ownEstimate.test.position !== r.chapter123.position) {
    out.push(`The owner's estimate and ours give different answers (${r.ownEstimate.test.position} vs ${r.chapter123.position} the range).`);
  }
  const months = r.comps.used.map((c) => monthGap(c.saleMonth, VALUATION_DATE.slice(0, 7)));
  if (months.length > 0) {
    const sorted = [...months].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > 18) out.push(`Most comps are old (the typical one sold ${median} months before October 1, 2026), so the time adjustment matters a lot.`);
  }
  return out;
}

// ---------------------------------------------------------------- the full math for one home

/** Every step of methodology K2 to K12 for one home, with the numbers filled in. */
function handMath(r: CheckerResult, town: TownFile): string[] {
  const A = r.assessedValue;
  const sel = selectComps(town, A);
  const scored: ScoredComp[] = scoreComps(timeAdjust(sel.comps, priceIndex), A, sel.bandPercent);
  const est = estimateMarketValue(scored, A);
  const L: string[] = [];
  L.push(`**Step 1. Pick comps (K2).** Sales in ${town.name} with a deed date from ${town.comp_window.deed_date_from} to ${town.comp_window.deed_date_to}.`);
  L.push(`- 15% band: ${usd(A)} x 0.85 to ${usd(A)} x 1.15 = ${usd(A * 0.85)} to ${usd(A * 1.15)}. Comps found: ${sel.countAtFirstBand}.`);
  if (sel.widened) L.push(`- Fewer than 8, so widen to 25%: ${usd(A * 0.75)} to ${usd(A * 1.25)}. Comps found: ${sel.comps.length}.`);
  L.push(`- Band used: ${sel.bandPercent}%. ${sel.comps.length} comps (5 or more needed, K3).`);
  L.push("");
  L.push(`**Step 2. Time-adjust each price (K4, K5).** Price index base month ${priceIndex.base_month} = I(base). Adjusted price = price x I(base) / I(sale month). Adjusted ratio = assessed / adjusted price.`);
  L.push(`**Step 3. Weight each comp (K6).** d = |comp assessed - ${A}| / ${A}; size weight = 1 - 0.5 x d / ${sel.bandPercent / 100}; months t = days from deed date to ${VALUATION_DATE} / ${DAYS_PER_MONTH}; time weight = 0.5 ^ (t / ${HALF_LIFE_MONTHS}); weight = size weight x time weight.`);
  L.push("");
  L.push("| # | Deed date | Price | I(sale) | I(base) | Adjusted price | Assessed | Adjusted ratio | d | Size wt | t (months) | Time wt | Weight |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  scored.forEach((c, i) =>
    L.push(
      `| ${i + 1} | ${c.deed_date} | ${usd(c.sale_price)} | ${r6(c.indexAtSale)} | ${r6(c.indexAtValuation)} | ${c.adjustedPrice.toFixed(2)} | ${usd(c.assessed_value)} | ${r6(c.adjustedRatio)} | ${r6(c.distance)} | ${r6(c.sizeWeight)} | ${c.monthsBeforeValuation.toFixed(4)} | ${r6(c.timeWeight)} | ${r6(c.weight)} |`,
    ),
  );
  const total = scored.reduce((s, c) => s + c.weight, 0);
  L.push("");
  L.push(`**Step 4. Weighted percentiles (K7).** Sort by adjusted ratio and add up the weights. Total weight = ${r6(total)}. 25% of it = ${r6(total * 0.25)}, 50% = ${r6(total * 0.5)}, 75% = ${r6(total * 0.75)}. Each percentile is the first ratio where the running total reaches its target.`);
  L.push("");
  L.push("| Order | Adjusted ratio | Weight | Running total | Reaches |");
  L.push("|---|---|---|---|---|");
  let running = 0;
  const marks = [
    { p: 0.25, name: "25th" },
    { p: 0.5, name: "50th" },
    { p: 0.75, name: "75th" },
  ];
  const done = new Set<string>();
  [...scored].sort((a, b) => a.adjustedRatio - b.adjustedRatio).forEach((c, i) => {
    running += c.weight;
    const reached = marks.filter((m) => !done.has(m.name) && running >= m.p * total * (1 - 1e-9)).map((m) => m.name);
    reached.forEach((n) => done.add(n));
    L.push(`| ${i + 1} | ${r6(c.adjustedRatio)} | ${r6(c.weight)} | ${r6(running)} | ${reached.join(", ")} |`);
  });
  L.push("");
  L.push(`So 25th = ${r6(est.ratioP25)}, 50th = ${r6(est.ratioP50)}, 75th = ${r6(est.ratioP75)}.`);
  L.push("");
  L.push(`**Step 5. Market value (K8).** Middle = ${A} / ${r6(est.ratioP50)} = ${usd(est.exact.mid)}. Low = ${A} / ${r6(est.ratioP75)} = ${usd(est.exact.low)}. High = ${A} / ${r6(est.ratioP25)} = ${usd(est.exact.high)}.`);
  if (r.chapter123) {
    const c = r.chapter123;
    L.push("");
    L.push(`**Step 6. Chapter 123 test (K10, K11).** Town's 2027 average ratio ${c.averageRatio}, printed limits ${c.lowerLimit} to ${c.upperLimit}. Capped at 100: AR* = ${c.averageRatioUsed}, L* = ${c.lowerTrigger}, U* = ${c.upperTrigger}.`);
    L.push(`- Homeowner ratio h = ${A} / ${est.exact.mid.toFixed(2)} x 100 = ${c.homeownerRatio.toFixed(4)}.`);
    L.push(`- At the high value: ${A} / ${est.exact.high.toFixed(2)} x 100 = ${c.ratioAtHighValue.toFixed(4)}.`);
    L.push(`- ${c.homeownerRatio.toFixed(4)} is ${c.position === "above" ? `above U* (${c.upperTrigger})` : c.position === "below" ? `below L* (${c.lowerTrigger})` : `from L* (${c.lowerTrigger}) to U* (${c.upperTrigger})`}, so the result is "${VERDICT_WORDS[r.verdict]}"${r.strength ? ` (${r.strength})` : ""}.`);
  } else if (r.verdict === "revaluation-no-test") {
    L.push("");
    L.push(`**Step 6.** ${town.name} is on the ${CHAPTER123_TAX_YEAR} revaluation list, so there is no Chapter 123 test (K14).`);
  }
  if (r.savings) {
    const s = r.savings;
    L.push("");
    L.push(`**Step 7. Savings (K12).** Corrected assessment = ${est.exact.mid.toFixed(2)} x ${r.chapter123!.averageRatioUsed} / 100 = ${usd(s.correctedAssessment)}. Savings = (${A} - ${s.correctedAssessment}) x ${s.generalTaxRate} / 100 = ${usd(s.yearlySavings)} a year (${s.taxRateYear} tax rate).`);
  }
  return L;
}

// ---------------------------------------------------------------- main

if (!existsSync(csvPath)) {
  console.error(`check-real-homes: ${csvPath} not found.\nMake it with a header row: town,assessed_value,own_estimate,note`);
  process.exit(1);
}

const homes = readHomes(csvPath);
const md: string[] = [
  "# Real home results (private)",
  "",
  `Made by \`site/scripts/check-real-homes.ts\` on ${new Date().toISOString().slice(0, 10)} from \`${path.basename(csvPath)}\` (${homes.length} homes), using the website's checker engine and the data in \`site/public/data/\` (price index base month ${priceIndex.base_month}). Never push this file.`,
  "",
  "## Summary",
  "",
  "| Row | Note | Town | Assessed | Own estimate | Verdict | Estimate (low / middle / high) | Ratio vs limits | Comps | Flags |",
  "|---|---|---|---|---|---|---|---|---|---|",
];
const details: string[] = [];
const withEstimate: { row: number; r: CheckerResult; town: TownFile }[] = [];
let flagged = 0;

for (const h of homes) {
  const check = validateInputs({ town: toSlug(h.town), assessedValue: h.assessed, ownEstimate: h.own }, slugs);
  if (!check.ok) {
    md.push(`| ${h.row} | ${h.note} | ${h.town} | ${h.assessed} | ${h.own} | **Input error** | | | | ${check.errors.map((e) => e.message).join(" ")} |`);
    flagged++;
    continue;
  }
  const town = loadTown(check.inputs.townSlug);
  const r = runChecker(check.inputs, town, priceIndex);
  const f = flags(r, town);
  if (f.length > 0) flagged++;
  const e = r.estimate;
  const ratio = r.chapter123
    ? `${pct2(r.chapter123.homeownerRatio)} (limits ${r.chapter123.lowerTrigger} to ${r.chapter123.upperTrigger})`
    : "";
  md.push(
    `| ${h.row} | ${h.note} | ${town.name} | ${usd(r.assessedValue)} | ${r.ownEstimate ? usd(r.ownEstimate.value) : ""} | ${VERDICT_WORDS[r.verdict]}${r.strength ? ` (${r.strength})` : ""} | ${e ? `${usd(e.marketValueLow)} / ${usd(e.marketValueMid)} / ${usd(e.marketValueHigh)}` : ""} | ${ratio} | ${r.comps.count} (${r.comps.bandPercent}%) | ${f.length || ""} |`,
  );

  details.push(`### Row ${h.row}${h.note ? ` (${h.note})` : ""}: ${town.name}, ${usd(r.assessedValue)}`, "");
  details.push(`- **Verdict:** ${VERDICT_WORDS[r.verdict]}${r.strength ? ` (${r.strength})` : ""}`);
  if (e) details.push(`- **Estimate:** ${usd(e.marketValueMid)} (range ${usd(e.marketValueLow)} to ${usd(e.marketValueHigh)})`);
  if (r.chapter123) details.push(`- **Ratio:** ${pct2(r.chapter123.homeownerRatio)}; at the high value ${pct2(r.chapter123.ratioAtHighValue)}; range used ${r.chapter123.lowerTrigger} to ${r.chapter123.upperTrigger}`);
  if (r.ownEstimate) {
    const t = r.ownEstimate.test;
    details.push(`- **Own estimate:** ${usd(r.ownEstimate.value)}${t ? `, ratio ${pct2(t.homeownerRatio)} (${t.position} the range)` : ""}${r.ownEstimate.differenceShare != null ? `, ${Math.round(r.ownEstimate.differenceShare * 100)}% from ours` : ""}`);
  }
  if (r.savings) details.push(`- **Savings estimate:** corrected assessment ${usd(r.savings.correctedAssessment)}, about ${usd(r.savings.yearlySavings)} a year (${r.savings.taxRateYear} tax rate)`);
  details.push(`- **Comps:** ${r.comps.count} in a ${r.comps.bandPercent}% band${r.comps.widened ? ` (widened; ${r.comps.countAtFirstBand} at 15%)` : ""}, deed dates ${r.comps.windowFrom} to ${r.comps.windowTo}`);
  details.push(`- **Deadline / fee:** ${r.appeal.deadline}; ${usd(r.appeal.filingFee)}`);
  details.push(`- **Warnings:** ${r.warnings.length ? r.warnings.map((w) => w.message).join(" | ") : "none"}`);
  if (f.length) {
    details.push("- **Looks surprising because:**");
    for (const x of f) details.push(`  - ${x}`);
  }
  if (r.comps.used.length) {
    details.push("", "| Sale month | Price | Adjusted price | Assessed | Adjusted ratio | Weight |", "|---|---|---|---|---|---|");
    for (const c of r.comps.used) details.push(`| ${c.saleMonth} | ${usd(c.salePrice)} | ${usd(c.adjustedPrice)} | ${usd(c.assessedValue)} | ${r4(c.adjustedRatio)} | ${r4(c.weight)} |`);
  }
  details.push("");

  if (e) withEstimate.push({ row: h.row, r, town });
}

md.push("", `${flagged} of ${homes.length} homes have at least one flag (see below).`, "");
md.push("## Each home", "", ...details);
// Full math for the homes with the fewest comps (short tables are easier to check by hand), preferring ones with a Chapter 123 test.
const picked = [...withEstimate]
  .sort((a, b) => Number(b.r.chapter123 !== null) - Number(a.r.chapter123 !== null) || a.r.comps.count - b.r.comps.count || a.row - b.row)
  .slice(0, HAND_MATH_HOMES)
  .sort((a, b) => a.row - b.row);
md.push(`## The full math for ${picked.length === 1 ? "1 home" : `${picked.length} homes`} (the ones with the fewest comps)`, "");
md.push("Every number below comes from the same functions the website runs. Small differences in the last decimal are rounding in this file only.", "");
for (const p of picked) md.push(`### Row ${p.row}: ${p.town.name}, ${usd(p.r.assessedValue)}`, "", ...handMath(p.r, p.town), "");

writeFileSync(outPath, md.join("\n"), "utf8");
console.log(`check-real-homes: ${homes.length} homes, ${flagged} flagged. Wrote ${outPath}`);
