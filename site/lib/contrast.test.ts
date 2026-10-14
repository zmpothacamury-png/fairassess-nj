import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  APPROVED_PAIRS,
  FORBIDDEN_PAIRS,
  contrastRatio,
  parseColorTokens,
} from "./contrast";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const tokens = parseColorTokens(css);

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // #767676 on white is the classic "just passes 4.5:1" gray.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("does not care which color is foreground", () => {
    expect(contrastRatio("#20608c", "#f5f7fa")).toBeCloseTo(
      contrastRatio("#f5f7fa", "#20608c"),
      10,
    );
  });
});

describe("design tokens", () => {
  it("parses every brand color from globals.css", () => {
    for (const name of [
      "navy-900", "navy-700", "blue-600", "blue-100", "sky-400",
      "green-600", "green-700", "green-100", "gold-400", "gold-700",
      "gold-100", "outline-200", "mist-50", "white", "ink-800",
      "ink-600", "gray-100",
    ]) {
      expect(tokens[name], name).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(APPROVED_PAIRS)("$fg on $bg passes $min:1 ($use)", ({ fg, bg, min }) => {
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });

  it.each(FORBIDDEN_PAIRS)("$fg on $bg really fails ($use)", ({ fg, bg, min }) => {
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeLessThan(min);
  });
});
