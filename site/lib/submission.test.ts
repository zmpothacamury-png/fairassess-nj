import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CountySchema, PriceIndexSchema, TownFileSchema } from "./data/schema";
import { exampleResult, labelCounts, meterScale, qrModules, quarterGap, submissionUrl } from "./submission";

const DATA = path.join(process.cwd(), "public", "data");
const read = (file: string) => JSON.parse(readFileSync(path.join(DATA, file), "utf8"));

describe("submission page numbers", () => {
  const county = CountySchema.parse(read("county.json"));
  const priceIndex = PriceIndexSchema.parse(read("price-index.json"));

  it("label counts add up to the ranked towns", () => {
    const c = labelCounts(county);
    expect(c.within + c.mixed + c.regressive + c.progressive).toBe(c.ranked);
    expect(c.ranked).toBe(48);
  });

  it("the example home gives the same answer as the README screenshot (Teaneck $450,000)", () => {
    const r = exampleResult(TownFileSchema.parse(read("towns/teaneck.json")), priceIndex);
    expect(r.verdict).toBe("within-range");
    expect(r.estimate?.marketValueMid).toBe(601_494);
    expect(r.chapter123?.homeownerRatio).toBeCloseTo(74.81, 2);
  });

  it("New Milford's cheapest quarter has a higher median ratio than its most expensive", () => {
    const g = quarterGap(TownFileSchema.parse(read("towns/new-milford.json")));
    expect(g).toEqual({ lowPercent: 97, highPercent: 81, perQuarter: 25 });
  });

  it("quarterGap rounds to whole percents and needs both end quarters", () => {
    const tier = (n: number, r: number) => ({
      tier: n, n: 10, value_low: 1, value_high: 2, sale_price_low: 1, sale_price_high: 2, median_ratio: r,
      lower_trigger: null, upper_trigger: null, n_above_upper: null, n_below_lower: null,
      share_above_upper: null, share_below_lower: null,
    });
    const base = TownFileSchema.parse(read("towns/new-milford.json"));
    expect(quarterGap({ ...base, tiers: [tier(1, 0.555), tier(4, 0.444)] })).toEqual({ lowPercent: 56, highPercent: 44, perQuarter: 10 });
    expect(quarterGap({ ...base, tiers: [tier(1, 0.5)] })).toBeNull();
  });
});

describe("meterScale", () => {
  it("leaves 35% of the range as room on each side", () => {
    const pos = meterScale(80, 100, []);
    expect(pos(73)).toBeCloseTo(0, 6);
    expect(pos(80)).toBeCloseTo((7 / 34) * 100, 6);
    expect(pos(107)).toBeCloseTo(100, 6);
  });
  it("widens to fit a mark outside that room and clamps to 0..100", () => {
    const pos = meterScale(80, 100, [120]);
    expect(pos(121.6)).toBeCloseTo(100, 6);
    expect(pos(500)).toBe(100);
    expect(pos(-5)).toBe(0);
  });
});

describe("QR code", () => {
  it("is a square grid with the three corner finder squares", () => {
    const { size, dark } = qrModules("https://fairassessnj.vercel.app");
    expect(dark).toHaveLength(size * size);
    expect((size - 17) % 4).toBe(0); // QR sizes are 21, 25, 29, ...
    const at = (r: number, c: number) => dark[r * size + c];
    for (const [r, c] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      expect(at(r, c)).toBe(true); // outer ring
      expect(at(r + 1, c + 1)).toBe(false); // light ring
      expect(at(r + 3, c + 3)).toBe(true); // center
    }
  });

  it("uses SUBMISSION_URL when set, without a trailing slash", () => {
    expect(submissionUrl("https://fairassessnj.vercel.app/")).toBe("https://fairassessnj.vercel.app");
    process.env.SUBMISSION_URL = "https://example.org/";
    expect(submissionUrl("https://fairassessnj.vercel.app")).toBe("https://example.org");
    delete process.env.SUBMISSION_URL;
  });
});
