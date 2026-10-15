/**
 * WCAG 2.1 contrast math plus the list of approved color pairs.
 * Used by lib/contrast.test.ts (which fails the tests if a pair drops below
 * its minimum) and by the /design style guide (which shows the table).
 */

/** Read every `--color-<name>: #hex;` token out of a CSS file's text. */
export function parseColorTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2].toLowerCase();
  }
  return tokens;
}

/** Relative luminance of a #rrggbb color (WCAG 2.1 definition). */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two #rrggbb colors, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Minimum ratios: 4.5 for normal text, 3 for large text and UI parts (WCAG 2.1 AA). */
export const AA_TEXT = 4.5;
export const AA_UI = 3;

export type ColorPair = {
  fg: string;
  bg: string;
  min: number;
  use: string;
};

/**
 * Every foreground/background pair the site is allowed to use.
 * Add a pair here before using a new combination in a component.
 */
export const APPROVED_PAIRS: ColorPair[] = [
  // Body and heading text on the two page surfaces.
  ...["white", "mist-50"].flatMap((bg) => [
    { fg: "navy-900", bg, min: AA_TEXT, use: "Headings" },
    { fg: "navy-700", bg, min: AA_TEXT, use: "Wordmark, strong labels" },
    { fg: "ink-800", bg, min: AA_TEXT, use: "Body text" },
    { fg: "ink-600", bg, min: AA_TEXT, use: "Secondary text" },
    { fg: "blue-600", bg, min: AA_TEXT, use: "Links, eyebrows" },
    { fg: "green-700", bg, min: AA_TEXT, use: "'Fair' text" },
    { fg: "gold-700", bg, min: AA_TEXT, use: "Caution icons and text" },
    { fg: "ink-600", bg, min: AA_UI, use: "Input borders" },
  ]),
  // Status callouts and pills: tinted background, navy/ink text, colored icon.
  { fg: "navy-900", bg: "green-100", min: AA_TEXT, use: "Within range: text" },
  { fg: "green-700", bg: "green-100", min: AA_TEXT, use: "Within range: icon, label" },
  { fg: "navy-900", bg: "gold-100", min: AA_TEXT, use: "May have grounds: text" },
  { fg: "gold-700", bg: "gold-100", min: AA_TEXT, use: "May have grounds: icon, label" },
  { fg: "navy-900", bg: "blue-100", min: AA_TEXT, use: "Possibly under-assessed: text" },
  { fg: "blue-600", bg: "blue-100", min: AA_TEXT, use: "Possibly under-assessed: icon, label" },
  { fg: "ink-800", bg: "gray-100", min: AA_TEXT, use: "Not enough data: text" },
  { fg: "ink-600", bg: "gray-100", min: AA_TEXT, use: "Not enough data: icon, label" },
  // Dark surfaces (page header, CTA band, primary buttons).
  { fg: "white", bg: "blue-600", min: AA_TEXT, use: "Primary button" },
  { fg: "white", bg: "navy-700", min: AA_TEXT, use: "Primary button hover" },
  { fg: "white", bg: "navy-900", min: AA_TEXT, use: "Page header and CTA band headings" },
  { fg: "outline-200", bg: "navy-900", min: AA_TEXT, use: "Text on navy surfaces" },
  // Footer (light blue tint, like the logo background).
  { fg: "ink-800", bg: "blue-100", min: AA_TEXT, use: "Footer body text and links" },
  { fg: "ink-600", bg: "blue-100", min: AA_TEXT, use: "Footer disclaimer and credit line" },
  { fg: "navy-700", bg: "blue-100", min: AA_TEXT, use: "Footer wordmark and tagline" },
  { fg: "blue-600", bg: "blue-100", min: AA_UI, use: "Footer link hover and focus ring" },
  { fg: "gold-400", bg: "navy-900", min: AA_TEXT, use: "Gold accent on dark only" },
  { fg: "navy-900", bg: "gold-400", min: AA_TEXT, use: "Text on a gold fill" },
  // Chart marks against white (graphics need 3:1).
  { fg: "blue-600", bg: "white", min: AA_UI, use: "Chart: assessed value" },
  { fg: "green-600", bg: "white", min: AA_UI, use: "Chart: sale / market value" },
  // Focus rings.
  { fg: "blue-600", bg: "mist-50", min: AA_UI, use: "Focus ring" },
  { fg: "blue-600", bg: "white", min: AA_UI, use: "Focus ring" },
  { fg: "gold-400", bg: "navy-900", min: AA_UI, use: "Focus ring on dark surfaces" },
];

/**
 * Pairs that are NOT allowed, kept here so the reason is written down.
 * The test checks that each one really fails, so the list stays honest.
 */
export const FORBIDDEN_PAIRS: ColorPair[] = [
  { fg: "gold-400", bg: "white", min: AA_TEXT, use: "Gold text on light backgrounds" },
  { fg: "gold-400", bg: "mist-50", min: AA_TEXT, use: "Gold text on light backgrounds" },
  { fg: "green-600", bg: "white", min: AA_TEXT, use: "Logo green as text (use green-700)" },
  { fg: "sky-400", bg: "white", min: AA_TEXT, use: "Sky blue as text (fills only)" },
  { fg: "outline-200", bg: "white", min: AA_UI, use: "Outline gray as an input border (use ink-600)" },
];
