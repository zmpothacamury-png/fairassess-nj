import { describe, expect, it } from "vitest";
import { logMoneyTicks, percentTicks, prbDomain, shortDollars, tierRange } from "./chart";

describe("chart number formats", () => {
  it("shortens dollar amounts for axis labels", () => {
    expect(shortDollars(394_017)).toBe("$394k");
    expect(shortDollars(1_000_000)).toBe("$1M");
    expect(shortDollars(1_770_000)).toBe("$1.77M");
    expect(tierRange(394_017, 569_917)).toBe("$394k to $570k");
  });
});

describe("chart axes", () => {
  it("gives evenly spaced percent ticks that cover the data", () => {
    expect(percentTicks(0, 0.57)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(percentTicks(0.31, 0.83)).toEqual([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    // A wide range switches to 20-point steps so labels stay readable.
    expect(percentTicks(0, 1.5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6]);
  });

  it("keeps log-scale money ticks inside the range and at most 6", () => {
    expect(logMoneyTicks(350_000, 1_900_000)).toEqual([500_000, 750_000, 1_000_000, 1_500_000]);
    const wide = logMoneyTicks(90_000, 25_000_000);
    expect(wide.length).toBeLessThanOrEqual(6);
    expect(wide.every((t) => t >= 90_000 && t <= 25_000_000)).toBe(true);
  });

  it("always shows the whole IAAO band and every PRB range, rounded out to 0.05", () => {
    expect(prbDomain([-0.03], [0.02])).toEqual([-0.1, 0.1]);
    const [lo, hi] = prbDomain([-0.4445, -0.1], [0.0613, 0.3]);
    expect(lo).toBeCloseTo(-0.45, 10);
    expect(hi).toBeCloseTo(0.3, 10);
  });
});
