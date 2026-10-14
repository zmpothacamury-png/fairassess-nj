import { describe, expect, it } from "vitest";
import { REVEAL, easeOutCubic, revealProgress, revealStyle } from "./motion";

describe("easeOutCubic", () => {
  it("starts at 0, ends at 1, and is past halfway at the midpoint", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 10);
  });
});

describe("revealProgress (same formula as T&T site.js:39-44)", () => {
  const vh = 1000;

  it("is hidden below the 94% start line", () => {
    expect(revealProgress(950, vh)).toBe(0);
  });

  it("is fully shown at or above the 50% line", () => {
    expect(revealProgress(500, vh)).toBe(1);
    expect(revealProgress(100, vh)).toBe(1);
  });

  it("is part-way between the lines, eased", () => {
    // Halfway between 940 and 500 is 720; eased 0.5 -> 0.875.
    expect(revealProgress(720, vh)).toBeCloseTo(0.875, 10);
  });

  it("starts each later sibling 34px of scroll later", () => {
    // Sibling 1's start line is 940 - 34 = 906, so at 920 it is still hidden.
    expect(revealProgress(920, vh, 0)).toBeGreaterThan(0);
    expect(revealProgress(920, vh, 1)).toBe(0);
    expect(REVEAL.staggerPx).toBe(34);
  });
});

describe("revealStyle", () => {
  it("is 54px down, scale .972, transparent when hidden", () => {
    expect(revealStyle(0)).toEqual({ opacity: "0.000", transform: "translateY(54.0px) scale(0.9720)" });
  });

  it("is in place, full size, opaque when shown", () => {
    expect(revealStyle(1)).toEqual({ opacity: "1.000", transform: "translateY(0.0px) scale(1.0000)" });
  });
});
