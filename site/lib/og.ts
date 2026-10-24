import { readFileSync } from "node:fs";
import path from "node:path";
import type { TownEntry } from "@/lib/data/schema";
import { labelStatus } from "@/lib/towns";

/**
 * Helpers for the generated share images (next/og). Those images can't use
 * CSS variables, so colors are read from the design tokens in globals.css
 * (design-token rule: no hex colors in components).
 */
const CSS = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

/** The hex value of one design token, e.g. token("mist-50"). Throws if the token is missing. */
export function token(name: string): string {
  const m = CSS.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Design token --color-${name} not found in globals.css`);
  return m[1];
}

/** The pill colors for a town label, matching StatusPill (components/StatusPill.tsx). */
export function labelColors(label: TownEntry["label"]): { background: string; dot: string; text: string } {
  switch (labelStatus(label)) {
    case "within-range":
      return { background: token("green-100"), dot: token("green-700"), text: token("navy-900") };
    case "may-have-grounds":
      return { background: token("gold-100"), dot: token("gold-700"), text: token("navy-900") };
    case "under-assessed":
      return { background: token("blue-100"), dot: token("blue-600"), text: token("navy-900") };
    case "not-enough-data":
      return { background: token("gray-100"), dot: token("ink-600"), text: token("ink-800") };
    default:
      return { background: token("white"), dot: token("ink-600"), text: token("ink-600") };
  }
}

/** A file from public/ as a data: URL, for <img> inside an ImageResponse. */
export function publicImage(file: string): string {
  return `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", file)).toString("base64")}`;
}

/** A font file from assets/fonts/ (Montserrat, SIL Open Font License: assets/fonts/Montserrat-OFL.txt). */
export function fontFile(file: string): Buffer {
  return readFileSync(path.join(process.cwd(), "assets", "fonts", file));
}
