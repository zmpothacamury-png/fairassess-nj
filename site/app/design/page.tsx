import { readFileSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CalendarDays, FileText, House, Info, Map, Scale, SearchCheck } from "lucide-react";
import { BalanceDivider } from "@/components/BalanceDivider";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { Term } from "@/components/Term";
import { APPROVED_PAIRS, contrastRatio, parseColorTokens } from "@/lib/contrast";

/** Style guide for reviewing the design system. Hidden from search engines and the nav. */
export const metadata: Metadata = {
  title: "Design system | Fair Assess NJ",
  robots: { index: false, follow: false },
};

const ROLES: Record<string, string> = {
  "navy-900": "Headings, page header, dark surfaces",
  "navy-700": "Wordmark, strong labels, button hover",
  "blue-600": "Primary buttons, links, eyebrows, “assessed value” in charts",
  "blue-100": "Blue tint: “possibly under-assessed”, hovers",
  "sky-400": "Secondary fills only (never text)",
  "green-600": "“Fair” and “market value” fills, chart marks",
  "green-700": "Green text and icons (green-600 fails as text)",
  "green-100": "Green tint: “within range”",
  "gold-400": "Accent: pivot dot, highlights, reference lines. Never text on light.",
  "gold-700": "Gold text and icons: “may have grounds”",
  "gold-100": "Gold tint: “may have grounds”",
  "outline-200": "Borders, dividers, NJ outline",
  "mist-50": "Page background",
  white: "Cards",
  "ink-800": "Body text",
  "ink-600": "Secondary text, form-control borders",
  "gray-100": "“Not enough data” background, skeletons",
};

const TYPE_SCALE = [
  { cls: "text-4xl", px: 55, use: "Home hero heading" },
  { cls: "text-3xl", px: 44, use: "Page heading, big stats" },
  { cls: "text-2xl", px: 35, use: "Section heading (h2)" },
  { cls: "text-xl", px: 28, use: "Sub-heading (h3)" },
  { cls: "text-lg", px: 22, use: "Lead paragraph, card title" },
  { cls: "text-base", px: 18, use: "Body text" },
  { cls: "text-sm", px: 14, use: "Captions, source lines, eyebrows" },
];

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-outline-200 py-12">
      <h2 className="font-heading text-xl font-bold text-navy-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  const tokens = parseColorTokens(readFileSync(join(process.cwd(), "app", "globals.css"), "utf8"));

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-content px-6 py-16">
        <SectionHeading
          as="h1"
          eyebrow="Internal review page"
          title="Fair Assess NJ design system"
          description="Every token, the type scale, and every component. Not linked in the nav and hidden from search engines. Full guide: docs/design-system.md."
        />

        <Block id="colors" title="1. Color tokens">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(tokens).map(([name, hex]) => (
              <li key={name} className="flex gap-4 rounded-card border border-outline-200 bg-white p-4">
                <span
                  aria-hidden="true"
                  className="h-16 w-16 shrink-0 rounded-control border border-outline-200"
                  style={{ background: `var(--color-${name})` }}
                />
                <span className="text-sm">
                  <span className="block font-semibold text-navy-900">{name}</span>
                  <span className="block tabular-nums text-ink-600">{hex.toUpperCase()}</span>
                  <span className="mt-1 block text-ink-600">{ROLES[name]}</span>
                </span>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="contrast" title="2. Contrast (WCAG 2.1 AA)">
          <p className="mb-4 max-w-prose text-base text-ink-600">
            Text needs 4.5:1. Large text, icons, borders, and chart marks need 3:1.
            The test file lib/contrast.test.ts fails if any pair below drops under its minimum.
          </p>
          <DataTable label="Contrast of approved color pairs" caption="Contrast of approved color pairs">
            <thead>
              <tr>
                <th scope="col">Sample</th>
                <th scope="col">Text / mark</th>
                <th scope="col">Background</th>
                <th scope="col">Used for</th>
                <th scope="col" className="num">Ratio</th>
                <th scope="col" className="num">Needs</th>
              </tr>
            </thead>
            <tbody>
              {APPROVED_PAIRS.map((pair) => (
                <tr key={`${pair.fg}-${pair.bg}-${pair.use}`}>
                  <td>
                    <span
                      className="inline-block rounded-control px-2 py-1 font-semibold"
                      style={{ color: `var(--color-${pair.fg})`, background: `var(--color-${pair.bg})` }}
                    >
                      Aa 123
                    </span>
                  </td>
                  <td>{pair.fg}</td>
                  <td>{pair.bg}</td>
                  <td>{pair.use}</td>
                  <td className="num">{contrastRatio(tokens[pair.fg], tokens[pair.bg]).toFixed(2)}</td>
                  <td className="num">{pair.min}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <Callout tone="caution" title="Never use gold-400 for text on a light background" className="mt-6">
            It is only 1.8:1 on white. Use gold-400 for fills, dots, lines, and highlights. Use gold-700 for gold text and icons.
          </Callout>
        </Block>

        <Block id="type" title="3. Typography">
          <p className="eyebrow text-blue-600">Eyebrow: Montserrat 700, uppercase, 0.08em spacing</p>
          <ul className="mt-6 flex flex-col gap-6">
            {TYPE_SCALE.map((step) => (
              <li key={step.cls} className="grid gap-2 border-b border-outline-200 pb-4 sm:grid-cols-[10rem_1fr] sm:items-baseline">
                <span className="text-sm tabular-nums text-ink-600">
                  {step.cls} &middot; {step.px}px
                  <br />
                  {step.use}
                </span>
                <span className={`${step.cls} ${step.px >= 28 ? "font-heading font-bold text-navy-900" : "text-ink-800"}`}>
                  Is my assessment fair?
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-base text-ink-800">
            Body text is Inter at 18px with a line length of about 65 characters (max-w-prose).
            All statistics and money use tabular numbers so columns line up:
          </p>
          <p className="mt-2 font-heading text-xl font-bold tabular-nums text-navy-900">
            $111,111 &nbsp; $888,888 &nbsp; 0.00 &nbsp; 11.1%
          </p>
        </Block>

        <Block id="shape" title="4. Spacing, corners, shadows, icons">
          <div className="flex flex-wrap items-end gap-4">
            {[2, 4, 6, 8, 12, 16].map((step) => (
              <div key={step} className="text-center text-sm tabular-nums text-ink-600">
                <div className="bg-blue-100" style={{ width: `${step * 4}px`, height: `${step * 4}px` }} />
                {step * 4}px
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex h-24 w-40 items-center justify-center rounded-control border border-outline-200 bg-white text-sm text-ink-600">
              8px: controls
            </div>
            <div className="flex h-24 w-40 items-center justify-center rounded-card border border-outline-200 bg-white text-sm text-ink-600 shadow-soft">
              12px + shadow-soft
            </div>
            <div className="flex h-24 w-40 items-center justify-center rounded-card bg-white text-sm text-ink-600 shadow-raised">
              shadow-raised
            </div>
          </div>
          <p className="mt-8 text-sm text-ink-600">Icons: lucide-react, 2px stroke.</p>
          <div className="mt-2 flex gap-6 text-blue-600">
            {[House, Scale, Map, SearchCheck, FileText, CalendarDays, Info].map((Icon, i) => (
              <Icon key={i} aria-hidden="true" className="h-7 w-7" strokeWidth={2} />
            ))}
          </div>
        </Block>

        <Block id="motifs" title="5. Motifs">
          <p className="text-base font-semibold text-navy-900">A. Balance divider</p>
          <BalanceDivider className="my-6 px-0" />
          <p className="mt-8 text-base font-semibold text-navy-900">B. NJ watermark (behind the home hero)</p>
          <div className="relative mt-4 h-64 overflow-hidden rounded-card border border-outline-200 bg-mist-50">
            <Image src="/nj-outline.png" alt="" aria-hidden="true" width={1179} height={2091} className="absolute right-6 top-4 h-[130%] w-auto opacity-50" />
            <p className="relative p-6 font-heading text-2xl font-bold text-navy-900">Hero text sits on top.</p>
          </div>
          <p className="mt-8 text-base font-semibold text-navy-900">C. Split accent</p>
          <Card accent className="mt-4 max-w-md">
            <p className="text-base text-ink-800">A key card with the 4px blue | green top stripe.</p>
          </Card>
          <p className="mt-8 text-base font-semibold text-navy-900">Chart palette</p>
          <ul className="mt-4 grid gap-4 text-sm text-ink-800 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-4 w-4 bg-blue-600" /> Assessed value: blue-600, square markers
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-4 w-4 rounded-full bg-green-600" /> Sale / market value: green-600, round markers
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="w-8 border-t-2 border-dashed border-gold-400" /> Reference lines (1.0 line, town average, Chapter 123 range): gold-400, dashed
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-4 w-4 rounded-full bg-outline-200" /> Context data: outline-200 marks, ink-600 labels
            </li>
          </ul>
          <p className="mt-4 max-w-prose text-sm text-ink-600">
            Blue and green can look alike to some color-blind readers, so charts also use different
            marker shapes and direct labels. Never color alone.
          </p>
        </Block>

        <Block id="components" title="6. Components">
          <p className="text-base font-semibold text-navy-900">Buttons</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="lg">Large primary</Button>
            <Button disabled>Disabled</Button>
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Status pills (checker results)</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <StatusPill status="within-range">Within the normal range</StatusPill>
            <StatusPill status="may-have-grounds">May have grounds to appeal</StatusPill>
            <StatusPill status="under-assessed">Possibly under-assessed</StatusPill>
            <StatusPill status="not-enough-data">Not enough data</StatusPill>
            <StatusPill status="neutral">In development</StatusPill>
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Callouts</p>
          <div className="mt-4 flex flex-col gap-4">
            <Callout tone="info" title="Info">Plain facts and tips.</Callout>
            <Callout tone="caution" title="Caution">Something to check before you file.</Callout>
            <Callout tone="success" title="Success">Something went right.</Callout>
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Stat cards (placeholder values, not data)</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <StatCard
              value="X.XX"
              label="Median ratio"
              summary="Placeholder. Real values come from the pipeline."
              explanation="The middle assessment-to-sale ratio among a town's sold homes."
              source="NJ Division of Taxation (example)"
            />
            <StatCard
              value="XX.X"
              label="COD"
              summary="Placeholder. Real values come from the pipeline."
              explanation="Coefficient of dispersion: how spread out the ratios are. Lower is more uniform."
            />
            <StatCard
              value="X.XX"
              label="PRD"
              summary="Placeholder. Real values come from the pipeline."
              explanation="Price-related differential: above 1.03 suggests cheaper homes are over-assessed."
            />
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Term (dotted underline, opens a definition)</p>
          <p className="mt-4 max-w-prose text-base text-ink-800">
            Towns are compared using the{" "}
            <Term definition="Coefficient of dispersion. It measures how spread out the assessment ratios are. A lower number means assessments are more even.">
              COD
            </Term>{" "}
            and the{" "}
            <Term definition="The legal band around a town's average ratio, plus or minus 15%. If your ratio is outside it, you may have grounds to appeal.">
              common level range
            </Term>
            .
          </p>

          <p className="mt-10 text-base font-semibold text-navy-900">Data table</p>
          <div className="mt-4">
            <DataTable label="Example table" caption="Example table with placeholder values" maxHeight="max-h-64">
              <thead>
                <tr>
                  <th scope="col">Town</th>
                  <th scope="col" className="num">Sales</th>
                  <th scope="col" className="num">Median ratio</th>
                  <th scope="col" className="num">COD</th>
                </tr>
              </thead>
              <tbody>
                {["Town A", "Town B", "Town C", "Town D", "Town E", "Town F"].map((town) => (
                  <tr key={town}>
                    <td>{town}</td>
                    <td className="num">XXX</td>
                    <td className="num">X.XX</td>
                    <td className="num">XX.X</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Skeleton loader</p>
          <div className="mt-4 flex max-w-md flex-col gap-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <p className="mt-10 text-base font-semibold text-navy-900">Disclaimer</p>
          <Disclaimer className="mt-4" />

          <p className="mt-10 text-base font-semibold text-navy-900">Header and footer</p>
          <p className="mt-2 text-base text-ink-600">Shown live at the top and bottom of this page.</p>
        </Block>
      </div>
    </main>
  );
}
