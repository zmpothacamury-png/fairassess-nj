"use client";

import { ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { Skeleton } from "@/components/Skeleton";
import { Term } from "@/components/Term";
import {
  fetchTownFile,
  runChecker,
  validateInputs,
  type CheckerPriceIndex,
  type CheckerResult,
  type CheckerTown,
  type InputField,
} from "@/lib/checker";
import { VERDICTS } from "./copy";
import { MoneyInput } from "./MoneyInput";
import { ResultView, type CheckedInputs } from "./ResultView";
import { TownCombobox, type TownOption } from "./TownCombobox";

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/** The privacy line (privacy rule), with the website's spelling of the name. */
export const PRIVACY_LINE = "Nothing you type leaves your browser. Fair Assess NJ does not save or send your information.";

type Status = "idle" | "loading" | "error" | "done";
type Errors = Partial<Record<InputField, string>>;

/**
 * The appeal checker form and result. All checker math is in
 * lib/checker; this file only collects the inputs, loads the one public town
 * file, calls validateInputs and runChecker, and shows the answer.
 *
 * Privacy (privacy rule): nothing typed here is sent, stored, or put in
 * the URL. The only request is the town file, /data/towns/<slug>.json. The
 * town slug is the only thing read from the URL (?town=), and it is never
 * written back. Tests: components/checker/checker-ui.test.tsx, e2e/check.spec.ts.
 */
export function CheckerApp({ towns, priceIndex }: { towns: TownOption[]; priceIndex: CheckerPriceIndex }) {
  const ids = { town: useId(), assessed: useId(), own: useId(), ownPanel: useId() };
  const [townText, setTownText] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [assessed, setAssessed] = useState("");
  const [ownOpen, setOwnOpen] = useState(false);
  const [own, setOwn] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [loadingTown, setLoadingTown] = useState("");
  const [shown, setShown] = useState<{ result: CheckerResult; town: CheckerTown; inputs: CheckedInputs } | null>(null);
  const [stale, setStale] = useState(false);
  const [announce, setAnnounce] = useState("");

  const townRef = useRef<HTMLInputElement>(null);
  const assessedRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cache = useRef(new Map<string, Promise<CheckerTown>>());
  const focusOwnNext = useRef(false);

  const slugs = towns.map((t) => t.slug);

  /** Load a town file once and reuse it. A failed load is forgotten so "Try again" asks again. */
  function loadTown(slug: string): Promise<CheckerTown> {
    let p = cache.current.get(slug);
    if (!p) {
      p = fetchTownFile(slug);
      p.catch(() => cache.current.delete(slug));
      cache.current.set(slug, p);
    }
    return p;
  }

  // The result appears at once; move focus to its heading so keyboard and screen reader users land on it.
  useEffect(() => {
    if (status === "done") headingRef.current?.focus();
  }, [status, shown]);

  useEffect(() => {
    if (ownOpen && focusOwnNext.current) {
      focusOwnNext.current = false;
      ownRef.current?.focus();
    }
  }, [ownOpen]);

  function edited(field: InputField) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (status === "done") setStale(true);
  }

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    const raw = { town: townSlug || townText, assessedValue: assessed, ownEstimate: ownOpen ? own : "" };
    const v = validateInputs(raw, slugs);
    if (!v.ok) {
      const next: Errors = {};
      for (const err of v.errors) next[err.field] ??= err.message;
      setErrors(next);
      setAnnounce(`Please fix ${v.errors.length === 1 ? "1 problem" : `${v.errors.length} problems`} in the form.`);
      (next.town ? townRef : next.assessedValue ? assessedRef : ownRef).current?.focus();
      return;
    }
    setErrors({});
    const name = towns.find((t) => t.slug === v.inputs.townSlug)!.name;
    setLoadingTown(name);
    setStatus("loading");
    setAnnounce(`Checking sales in ${name}.`);
    try {
      const town = await loadTown(v.inputs.townSlug);
      const result = runChecker(v.inputs, town, priceIndex);
      const checkedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      setShown({
        result,
        town,
        inputs: { townName: name, assessedValue: v.inputs.assessedValue, ownEstimate: v.inputs.ownEstimate, checkedOn },
      });
      setStale(false);
      setStatus("done");
      setAnnounce(`Result ready. ${VERDICTS[result.verdict].headline}`);
    } catch {
      setStatus("error");
      setAnnounce(`We couldn't load the sales for ${name}.`);
    }
  }

  function addEstimate() {
    focusOwnNext.current = true;
    if (ownOpen) {
      focusOwnNext.current = false;
      ownRef.current?.focus();
    } else setOwnOpen(true);
  }

  function reset() {
    setTownText("");
    setTownSlug("");
    setAssessed("");
    setOwn("");
    setOwnOpen(false);
    setErrors({});
    setShown(null);
    setStale(false);
    setStatus("idle");
    setAnnounce("The form is cleared.");
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    formRef.current?.scrollIntoView({ block: "start" });
    townRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <TownFromUrl
        towns={towns}
        onTown={(t) => {
          setTownText(t.name);
          setTownSlug(t.slug);
          loadTown(t.slug).catch(() => {});
        }}
      />
      <section className="bg-white print:hidden">
        <div className="mx-auto grid max-w-content gap-8 px-6 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:order-last lg:col-span-5">
            <div className="flex gap-3 rounded-card bg-mist-50 p-5 sm:p-6">
              <Lock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-blue-600" strokeWidth={2} />
              <div className="text-base text-navy-900">
                <p className="font-semibold">{PRIVACY_LINE}</p>
                <p className="mt-2 text-sm text-ink-600">
                  The math runs on your device. Your browser only downloads the public sales file for the town you pick.{" "}
                  <Link href="/privacy" className={LINK}>
                    Privacy
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-6 hidden text-base text-ink-800 lg:block">
              <p className="font-semibold text-navy-900">What the checker does</p>
              <p className="mt-2">
                It estimates your home&rsquo;s market value from recent sales of homes assessed like yours. Then it
                divides your assessed value by that estimate. That is your{" "}
                <Term definition="Your assessed value divided by your home's market value. It is the share of your home's value that the town taxes.">
                  assessment ratio
                </Term>
                . Under{" "}
                <Term definition="A New Jersey law (Chapter 123, Laws of 1973). If a home's assessment ratio is more than 15% above or below the town's average ratio, the County Board corrects the assessment.">
                  Chapter 123
                </Term>
                , the state sets a range for each town. A ratio above it may be grounds to appeal.
              </p>
            </div>
          </aside>

          <form ref={formRef} noValidate onSubmit={check} className="scroll-mt-28 lg:col-span-7" aria-label="Appeal checker">
            <ol className="flex flex-col gap-8">
              <li>
                <p className="eyebrow text-blue-600">Step 1</p>
                <div className="mt-2">
                  <TownCombobox
                    ref={townRef}
                    id={ids.town}
                    label="Your town"
                    towns={towns}
                    text={townText}
                    selected={townSlug}
                    error={errors.town}
                    onChange={(text, slug) => {
                      setTownText(text);
                      setTownSlug(slug);
                      if (slug) loadTown(slug).catch(() => {});
                      edited("town");
                    }}
                  />
                </div>
              </li>
              <li>
                <p className="eyebrow text-blue-600">Step 2</p>
                <div className="mt-2">
                  <MoneyInput
                    ref={assessedRef}
                    id={ids.assessed}
                    label="Your assessed value"
                    help="It is the total assessed value on your property tax bill or assessment notice. Use the most recent one you have."
                    value={assessed}
                    error={errors.assessedValue}
                    required
                    onChange={(v) => {
                      setAssessed(v);
                      edited("assessedValue");
                    }}
                  />
                </div>
              </li>
              <li>
                <p className="eyebrow text-blue-600">Step 3 (optional)</p>
                <button
                  type="button"
                  aria-expanded={ownOpen}
                  aria-controls={ids.ownPanel}
                  onClick={() => {
                    setOwnOpen(!ownOpen);
                    if (status === "done") setStale(true);
                  }}
                  className="focus-ring group mt-2 flex min-h-12 w-full items-center justify-between gap-4 rounded-control text-left text-base font-semibold text-navy-900 hover:text-blue-600"
                >
                  Do you have your own estimate of your home&rsquo;s market value?
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 text-blue-600 transition-transform duration-[var(--duration-pop)] ease-[var(--ease-out)] motion-reduce:transition-none ${ownOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                <div id={ids.ownPanel} hidden={!ownOpen} className="mt-2">
                  <MoneyInput
                    ref={ownRef}
                    id={ids.own}
                    label="Your estimate of its market value"
                    help="For example, a recent appraisal or the price you paid, if you bought recently. The state asks for the value as of October 1, 2026."
                    value={own}
                    error={errors.ownEstimate}
                    onChange={(v) => {
                      setOwn(v);
                      edited("ownEstimate");
                    }}
                  />
                </div>
              </li>
            </ol>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" aria-describedby={`${ids.town}-privacy`}>
                Check my assessment
              </Button>
              <p id={`${ids.town}-privacy`} className="flex items-center gap-2 text-sm text-ink-600">
                <Lock aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />
                Runs in your browser. Nothing is sent.
              </p>
            </div>
          </form>
        </div>
      </section>

      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>

      {status !== "idle" && (
        <section aria-label="Result" className="bg-mist-50 print:bg-white">
          <div className="mx-auto max-w-content px-6 py-12 sm:py-16 print:p-0">
            {status === "loading" && (
              <div aria-busy="true" className="flex flex-col gap-4">
                <p className="text-base text-ink-600">Loading recent sales in {loadingTown}&hellip;</p>
                <Skeleton className="h-48 w-full" label={`Loading recent sales in ${loadingTown}`} />
                <div aria-hidden="true" className="flex flex-col gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            )}
            {status === "error" && (
              <Callout tone="caution" title={`We couldn't load the sales for ${loadingTown}`}>
                <p>This sometimes happens on a weak connection. Your answers are still in the form.</p>
                <Button variant="secondary" className="mt-4" onClick={() => check()}>
                  Try again
                </Button>
              </Callout>
            )}
            {status === "done" && shown && (
              <ResultView
                ref={headingRef}
                result={shown.result}
                town={shown.town}
                inputs={shown.inputs}
                stale={stale}
                onAddEstimate={() => {
                  addEstimate();
                  formRef.current?.scrollIntoView({ block: "start" });
                }}
                onReset={reset}
              />
            )}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * ?town=<slug> preselects a town (town pages link here this way). The slug is
 * read once after the page loads and never written back, and it is the only
 * thing the checker ever reads from the URL.
 */
function TownFromUrl({ towns, onTown }: { towns: TownOption[]; onTown: (t: TownOption) => void }) {
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("town") ?? "";
    const t = towns.find((x) => x.slug === slug);
    if (t) onTown(t);
    // Run once, on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
