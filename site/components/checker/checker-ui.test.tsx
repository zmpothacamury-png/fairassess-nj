// @vitest-environment jsdom
// Component tests for the appeal checker page (Prompt 12).
// 1. The small display helpers in copy.ts.
// 2. Form validation: inline errors, aria-describedby, money formatting, the town list.
// 3. Every verdict renders correctly from a fixed engine result.
// 4. Privacy: the page sends only the town file request, and nothing typed.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DISCLAIMER_TEXT } from "@/components/Disclaimer";
import type { CheckerPriceIndex, CheckerResult } from "@/lib/checker";
import { CheckerApp, PRIVACY_LINE } from "./CheckerApp";
import { caretAfterDigits, digitsBefore, formatMoneyTyping, ratioRange, tiltFor } from "./copy";
import { ResultView, type CheckedInputs } from "./ResultView";

const DATA = path.resolve(__dirname, "..", "..", "public", "data");
const INDEX = JSON.parse(readFileSync(path.join(DATA, "price-index.json"), "utf8")) as CheckerPriceIndex;
const TEANECK = readFileSync(path.join(DATA, "towns", "teaneck.json"), "utf8");
const TOWNS = [
  { slug: "teaneck", name: "Teaneck" },
  { slug: "washington-township", name: "Washington Township" },
  { slug: "ho-ho-kus", name: "Ho-Ho-Kus" },
];

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/check");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// ================================================================ 1. helpers

describe("display helpers", () => {
  it("adds commas as you type, but leaves cents, letters, and minus signs alone for the engine to explain", () => {
    expect(formatMoneyTyping("450000")).toBe("450,000");
    expect(formatMoneyTyping("$1,2345")).toBe("12,345");
    expect(formatMoneyTyping("0045")).toBe("45");
    expect(formatMoneyTyping("")).toBe("");
    expect(formatMoneyTyping("450000.50")).toBe("450000.50");
    expect(formatMoneyTyping("abc")).toBe("abc");
    expect(formatMoneyTyping("-5000")).toBe("-5000");
    // A very long typo keeps every digit (no rounding through Number()).
    expect(formatMoneyTyping("123456789012345678901")).toBe("123,456,789,012,345,678,901");
  });

  it("keeps the cursor after the same digit when commas are added", () => {
    // "45000|0" -> "450,00|0": 5 digits before the cursor either way.
    expect(digitsBefore("450000", 5)).toBe(5);
    expect(caretAfterDigits("450,000", 5)).toBe(6);
    expect(caretAfterDigits("450,000", 0)).toBe(0);
    expect(caretAfterDigits("450,000", 9)).toBe(7);
  });

  it("tips the scale toward blue above the range, level within, toward green below", () => {
    expect(tiltFor("above").degrees).toBeLessThan(0);
    expect(tiltFor("within").degrees).toBe(0);
    expect(tiltFor(null).degrees).toBe(0);
    expect(tiltFor("below").degrees).toBeGreaterThan(0);
  });

  it("reads the ratio range straight from the engine's percentiles (low ratio = high value)", () => {
    expect(ratioRange(BASE)).toEqual({ low: 70, mid: 75, high: 80 });
    expect(ratioRange({ ...BASE, estimate: null })).toBeNull();
  });
});

// ================================================================ 2. the form

function renderApp() {
  return render(<CheckerApp towns={TOWNS} priceIndex={INDEX} />);
}
const townBox = () => screen.getByRole("combobox", { name: "Your town" });
const assessedBox = () => screen.getByLabelText("Your assessed value");
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Check my assessment" }));

/** The error text a field points to with aria-describedby. */
function describedText(el: HTMLElement): string {
  return (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
}

describe("form validation", () => {
  it("shows the privacy line next to the form, and step 3 starts collapsed", () => {
    renderApp();
    expect(screen.getByText(PRIVACY_LINE)).toBeTruthy();
    const toggle = screen.getByRole("button", { name: /own estimate of your home/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByLabelText("Your estimate of its market value").closest("[hidden]")).not.toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByLabelText("Your estimate of its market value").closest("[hidden]")).toBeNull();
  });

  it("an empty form shows an error next to each required field, linked with aria-describedby, and sends nothing", () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    renderApp();
    submit();
    expect(townBox().getAttribute("aria-invalid")).toBe("true");
    expect(describedText(townBox())).toContain("Please choose your town.");
    expect(assessedBox().getAttribute("aria-invalid")).toBe("true");
    expect(describedText(assessedBox())).toContain("Please enter your assessed value.");
    expect(document.activeElement).toBe(townBox());
    expect(spy).not.toHaveBeenCalled();
  });

  it.each([
    ["abc", "should be a number in dollars"],
    ["450000.50", "whole dollars, with no cents"],
    ["-5000", "can't be a negative number"],
    ["999", "must be at least $10,000"],
    ["25000000", "must be $20,000,000 or less"],
  ])("assessed value %s gives a plain-words error", (typed, words) => {
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: typed } });
    submit();
    expect(describedText(assessedBox())).toContain(words);
    expect(townBox().getAttribute("aria-invalid")).toBeNull();
    expect(document.activeElement).toBe(assessedBox());
  });

  it("formats the assessed value with commas as you type", () => {
    renderApp();
    fireEvent.change(assessedBox(), { target: { value: "1234567" } });
    expect((assessedBox() as HTMLInputElement).value).toBe("1,234,567");
  });

  it("a town that is not on the list gets its own error", () => {
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Narnia" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    submit();
    expect(describedText(townBox())).toContain("Bergen County town from the list");
  });

  it("an error clears as soon as the field is edited", () => {
    renderApp();
    submit();
    fireEvent.change(assessedBox(), { target: { value: "4" } });
    expect(assessedBox().getAttribute("aria-invalid")).toBeNull();
  });

  it("the own-estimate field is checked only when step 3 is open", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /own estimate of your home/ }));
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    const own = screen.getByLabelText("Your estimate of its market value");
    fireEvent.change(own, { target: { value: "lots" } });
    submit();
    expect(describedText(own)).toContain("market value estimate should be a number");
  });

  it("the town list filters as you type and picks with the keyboard", () => {
    renderApp();
    const box = townBox();
    fireEvent.change(box, { target: { value: "town" } });
    const list = screen.getByRole("listbox", { name: "Bergen County towns" });
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Washington Township"]);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box.getAttribute("aria-activedescendant")).toBeTruthy();
    fireEvent.keyDown(box, { key: "Enter" });
    expect((box as HTMLInputElement).value).toBe("Washington Township");
    expect(box.getAttribute("aria-expanded")).toBe("false");
    // "ho ho kus" finds Ho-Ho-Kus.
    fireEvent.change(box, { target: { value: "ho ho" } });
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Ho-Ho-Kus"]);
    fireEvent.keyDown(box, { key: "Escape" });
    expect(box.getAttribute("aria-expanded")).toBe("false");
  });

  it("?town=<slug> preselects the town; any other URL value is ignored", () => {
    window.history.replaceState(null, "", "/check?town=teaneck");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(TEANECK, { status: 200 })));
    renderApp();
    expect((townBox() as HTMLInputElement).value).toBe("Teaneck");
    cleanup();
    window.history.replaceState(null, "", "/check?town=nowhere&value=450000");
    renderApp();
    expect((townBox() as HTMLInputElement).value).toBe("");
    expect((assessedBox() as HTMLInputElement).value).toBe("");
  });
});

describe("running the checker from the form", () => {
  it("loads only the town file, shows the result, and moves focus to the result heading", async () => {
    const spy = vi.fn(async () => new Response(TEANECK, { status: 200 }));
    vi.stubGlobal("fetch", spy);
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    await act(async () => submit());
    const heading = await screen.findByRole("heading", { level: 2, name: /Your result for Teaneck/ });
    expect(document.activeElement).toBe(heading);
    expect(heading.textContent).toContain("Your assessment is within the normal range.");
    // Privacy: one GET for the public town file, nothing typed in it, and nothing in the URL.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("/data/towns/teaneck.json", { method: "GET", credentials: "omit" });
    expect(JSON.stringify(spy.mock.calls)).not.toMatch(/450/);
    expect(window.location.href).not.toMatch(/450/);
  });

  it("a failed town file shows a friendly retry, and Try again works", async () => {
    let fail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (fail ? new Response("", { status: 500 }) : new Response(TEANECK, { status: 200 }))),
    );
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    await act(async () => submit());
    expect(await screen.findByText("We couldn't load the sales for Teaneck")).toBeTruthy();
    fail = false;
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(await screen.findByRole("heading", { level: 2, name: /Your result for Teaneck/ })).toBeTruthy();
  });

  it("Check another home clears every field and the result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(TEANECK, { status: 200 })));
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    await act(async () => submit());
    await screen.findByRole("heading", { level: 2, name: /Your result/ });
    fireEvent.click(screen.getByRole("button", { name: "Check another home" }));
    expect(screen.queryByRole("heading", { level: 2, name: /Your result/ })).toBeNull();
    expect((townBox() as HTMLInputElement).value).toBe("");
    expect((assessedBox() as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(townBox());
  });

  it("changing an answer after a result marks the result as out of date", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(TEANECK, { status: 200 })));
    renderApp();
    fireEvent.change(townBox(), { target: { value: "Teaneck" } });
    fireEvent.change(assessedBox(), { target: { value: "450000" } });
    await act(async () => submit());
    await screen.findByRole("heading", { level: 2, name: /Your result/ });
    fireEvent.change(assessedBox(), { target: { value: "460000" } });
    expect(screen.getByText("You changed your answers")).toBeTruthy();
  });
});

// ================================================================ 3. each verdict from a fixed result

const TOWN = {
  slug: "testville",
  name: "Testville",
  ch123: { tax_year: 2027, average_ratio: 80, lower_limit: 68, upper_limit: 92, amended_by_tax_court: false },
};
const INPUTS: CheckedInputs = { townName: "Testville", assessedValue: 450_000, ownEstimate: null, checkedOn: "October 18, 2026" };
const comp = (saleMonth: string, salePrice: number, assessedValue: number, weight: number) => ({
  saleMonth,
  salePrice,
  adjustedPrice: salePrice,
  assessedValue,
  adjustedRatio: assessedValue / salePrice,
  sizeWeight: 1,
  timeWeight: weight,
  weight,
});

/** A fixed "within the normal range" result. The other verdicts change only what they need. */
const BASE: CheckerResult = {
  verdict: "within-range",
  strength: null,
  town: { slug: "testville", name: "Testville", revaluationTaxYear: null },
  assessedValue: 450_000,
  comps: {
    windowFrom: "2024-10-01",
    windowTo: "2026-06-30",
    bandPercent: 15,
    widened: false,
    countAtFirstBand: 3,
    count: 3,
    used: [comp("2025-01", 600_000, 440_000, 0.5), comp("2025-11", 610_000, 455_000, 0.8), comp("2026-05", 590_000, 450_000, 0.95)],
  },
  estimate: {
    ratioP25: 0.7,
    ratioP50: 0.75,
    ratioP75: 0.8,
    marketValueLow: 562_500,
    marketValueMid: 600_000,
    marketValueHigh: 642_857,
    exact: { low: 562_500, mid: 600_000, high: 642_857.14 },
  },
  chapter123: {
    homeownerRatio: 75,
    averageRatioUsed: 80,
    lowerTrigger: 68,
    upperTrigger: 92,
    position: "within",
    ratioAtHighValue: 70,
    averageRatio: 80,
    lowerLimit: 68,
    upperLimit: 92,
  },
  ownEstimate: null,
  savings: null,
  appeal: { taxYear: 2027, deadline: "April 1, 2027", filingFee: 25 },
  warnings: [],
  suggestOwnEstimate: true,
  steps: ["We looked for homes in Testville.", "Your assessment ratio: $450,000 / $600,000 = 75.00%."],
};

const GROUNDS: CheckerResult = {
  ...BASE,
  verdict: "may-have-grounds",
  strength: "strong",
  estimate: { ...BASE.estimate!, marketValueMid: 450_000, marketValueLow: 430_000, marketValueHigh: 470_000 },
  chapter123: { ...BASE.chapter123!, homeownerRatio: 100, ratioAtHighValue: 95.74, position: "above" },
  savings: { correctedAssessment: 360_000, yearlySavings: 2_250, generalTaxRate: 2.5, taxRateYear: 2025 },
  suggestOwnEstimate: false,
};
const UNDER: CheckerResult = {
  ...BASE,
  verdict: "possibly-under-assessed",
  chapter123: { ...BASE.chapter123!, homeownerRatio: 60, position: "below" },
  suggestOwnEstimate: false,
};
const THIN: CheckerResult = {
  ...BASE,
  verdict: "not-enough-data",
  estimate: null,
  chapter123: null,
  comps: { ...BASE.comps, widened: true, bandPercent: 25 },
  steps: ["We need at least 5 sales to make a fair estimate, so we stopped here."],
};
const REVAL: CheckerResult = {
  ...BASE,
  verdict: "revaluation-no-test",
  town: { ...BASE.town, revaluationTaxYear: 2027 },
  chapter123: null,
  appeal: { ...BASE.appeal, deadline: "May 1, 2027" },
  warnings: [{ code: "revaluation-this-year", message: "Testville is getting new assessments for 2027." }],
  suggestOwnEstimate: false,
};

function show(result: CheckerResult, inputs: CheckedInputs = INPUTS) {
  return render(<ResultView result={result} town={TOWN} inputs={inputs} onReset={() => {}} onAddEstimate={() => {}} />);
}
const headline = () => screen.getByRole("heading", { level: 2 }).textContent ?? "";

/** Things every result must show: deadline and fee (rule 7, K13) and the disclaimer (rule 4). */
function expectEveryResultBasics(deadline: string) {
  expect(screen.getAllByText(deadline).length).toBeGreaterThan(0);
  expect(screen.getByText("Filing fee for your assessed value")).toBeTruthy();
  expect(screen.getByText(DISCLAIMER_TEXT)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Print or save this result" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Check another home" })).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/you will win/i);
}

describe("each verdict renders from a fixed engine result", () => {
  it("within the normal range: green pill, level scale, no savings, invites an own estimate", () => {
    show(BASE);
    expect(headline()).toContain("Your assessment is within the normal range.");
    expect(screen.getByText("Within the normal range")).toBeTruthy();
    expect(screen.getByText(/Your ratio is inside the range\. The scale is level\./)).toBeTruthy();
    expect(screen.getByText("75.00%")).toBeTruthy();
    expect(screen.queryByText("Estimated yearly savings (estimate)")).toBeNull();
    expect(screen.getByRole("button", { name: "Add my own estimate" })).toBeTruthy();
    expectEveryResultBasics("April 1, 2027");
  });

  it("may have grounds: gold pill, strength, corrected assessment and savings labeled as estimates with the tax year", () => {
    show(GROUNDS);
    expect(headline()).toContain("You may have grounds to appeal.");
    expect(screen.getByText("May have grounds to appeal")).toBeTruthy();
    expect(screen.getByText(/^Strong result/)).toBeTruthy();
    expect(screen.getByText("Estimated corrected assessment (estimate)")).toBeTruthy();
    expect(screen.getByText("$360,000")).toBeTruthy();
    expect(screen.getByText("Estimated yearly savings (estimate)")).toBeTruthy();
    expect(screen.getByText("$2,250")).toBeTruthy();
    expect(screen.getByText(/Uses the 2025 tax rate/)).toBeTruthy();
    expect(screen.getByText(/above the range\. The scale tips toward the assessed value side\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add my own estimate" })).toBeNull();
    expectEveryResultBasics("April 1, 2027");
  });

  it("borderline strength is said in words", () => {
    show({ ...GROUNDS, strength: "borderline" });
    expect(screen.getByText(/^Borderline result/)).toBeTruthy();
  });

  it("may be lower than typical: blue pill and a warning that an appeal could raise the assessment", () => {
    show(UNDER);
    expect(headline()).toContain("Your assessment may be lower than typical.");
    expect(screen.getByText("May be lower than typical")).toBeTruthy();
    expect(screen.getAllByText(/could raise your assessment/).length).toBeGreaterThan(0);
    expect(screen.getByText(/tips toward the market value side/)).toBeTruthy();
    expectEveryResultBasics("April 1, 2027");
  });

  it("not enough data: gray pill, why, other options, no estimate and no meter", () => {
    show(THIN);
    expect(headline()).toContain("Not enough data to check your home.");
    expect(screen.getByText("Not enough data")).toBeTruthy();
    expect(screen.getByText(/We found 3 recent sales in Testville/)).toBeTruthy();
    expect(screen.getByText(/Ask your town.s tax assessor which sales/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "appeal guide" }).getAttribute("href")).toBe("/appeal-guide");
    expect(screen.queryByText("Where your ratio sits")).toBeNull();
    expect(screen.queryByText("Estimated market value (estimate)")).toBeNull();
    expectEveryResultBasics("April 1, 2027");
  });

  it("2027 revaluation town: no Chapter 123 result, the estimate, the warning, and the May 1 deadline", () => {
    show(REVAL);
    expect(headline()).toContain("Chapter 123 does not apply in your town this year.");
    expect(screen.getByText("No Chapter 123 test in 2027")).toBeTruthy();
    expect(screen.getByText("Estimated market value (estimate)")).toBeTruthy();
    expect(screen.getByText("New assessments are coming in 2027")).toBeTruthy();
    expect(screen.queryByText("Where your ratio sits")).toBeNull();
    expect(screen.getByText(/so its deadline is May 1. May 1, 2027 is a Saturday./)).toBeTruthy();
    expectEveryResultBasics("May 1, 2027");
  });

  it("an own estimate shows both tests side by side; grounds from it alone show no savings", () => {
    show(
      {
        ...BASE,
        suggestOwnEstimate: false,
        ownEstimate: {
          value: 420_000,
          differenceShare: 0.3,
          test: { homeownerRatio: 107.14, averageRatioUsed: 80, lowerTrigger: 68, upperTrigger: 92, position: "above" },
        },
        warnings: [{ code: "own-estimate-differs", message: "Your estimate differs from ours by 30%." }],
      },
      { ...INPUTS, ownEstimate: 420_000 },
    );
    expect(screen.getByText("Using our estimate from recent sales")).toBeTruthy();
    expect(screen.getByText(/Using your estimate of/)).toBeTruthy();
    expect(screen.getByText("May have grounds to appeal")).toBeTruthy();
    expect(screen.getByText(/We don.t estimate savings from your own estimate/)).toBeTruthy();
    expect(screen.getByText("Your estimate and ours are far apart")).toBeTruthy();
    expect(screen.queryByText("Estimated yearly savings (estimate)")).toBeNull();
  });

  it("show the math opens instantly and lists the engine's steps; the comps table shows newest first", () => {
    show(BASE);
    const toggle = screen.getByRole("button", { name: "Show the math" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(BASE.steps[1]).closest("[hidden]")).toBeNull();
    const table = screen.getByRole("region", { name: "Table of sales we compared you to" });
    const rows = within(table).getAllByRole("row");
    expect(rows[1].textContent).toContain("May 2026");
    expect(rows[3].textContent).toContain("January 2025");
  });

  it("very large values and a long town name stay whole (break-ui)", () => {
    show(
      { ...GROUNDS, town: { ...GROUNDS.town, name: "Lower Alloways Creek Township" }, assessedValue: 20_000_000 },
      { ...INPUTS, townName: "Lower Alloways Creek Township", assessedValue: 20_000_000 },
    );
    expect(screen.getAllByText("$20,000,000").length).toBeGreaterThan(0);
    expect(headline()).toContain("Lower Alloways Creek Township");
  });
});

// ================================================================ 4. privacy

describe("privacy (CLAUDE.md rule 3)", () => {
  const files = readdirSync(__dirname)
    .filter((f) => /\.tsx?$/.test(f) && !f.includes(".test."))
    .map((f) => ({ file: f, text: readFileSync(path.join(__dirname, f), "utf8") }));

  it("no checker page file sends, stores, or logs anything, or writes to the URL", () => {
    const banned =
      /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|console\.|supabase|pushState|router\.(push|replace)|searchParams\.set|gtag|analytics/;
    for (const { file, text } of files) expect(banned.test(text), file).toBe(false);
  });

  it("the only URL change is removing ?town on Check another home", () => {
    const calls = files.flatMap(({ text }) => text.match(/replaceState\([^)]*\)/g) ?? []);
    expect(calls).toEqual(['replaceState(null, "", window.location.pathname)']);
  });
});
