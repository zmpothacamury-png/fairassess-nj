// npm run capture-submission: make the App Challenge files in docs/submission/ (Prompt 17).
//   cover-600x800.jpg       design A of /cover
//   cover-alt-600x800.jpg   design B of /cover
//   fair-handout.pdf        /handout, one US Letter page
// Needs the production build running first:
//   npm run build; npm run start -- -p 3100
// Each cover is captured at 2x (1200x1600) for sharp edges, then shrunk to exactly 600x800 and
// saved as JPEG quality 90 by Pillow (the pipeline's .venv), so the file is the size the form asks for.
// Optional: BASE_URL (default http://localhost:3100).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const ROOT = path.resolve(process.cwd(), "..");
const OUT = path.join(ROOT, "docs", "submission");
const PYTHON = path.join(ROOT, ".venv", "Scripts", "python.exe");

// The sticky header and the scroll cue would sit on top of the designs in a screenshot.
const HIDE_CHROME = ".site-header, .scroll-cue { display: none !important; }";

const RESIZE = `
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src).convert("RGB")
img.resize((600, 800), Image.LANCZOS).save(dst, "JPEG", quality=90)
check = Image.open(dst)
assert check.size == (600, 800), check.size
print(dst, check.size)
`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    await page.goto(`${BASE}/cover`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: HIDE_CHROME });
    await page.evaluate(() => document.fonts.ready);

    for (const [id, name] of [["cover-a", "cover-600x800.jpg"], ["cover-b", "cover-alt-600x800.jpg"]]) {
      const png = path.join(OUT, `${id}@2x.tmp.png`);
      await page.locator(`#${id}`).screenshot({ path: png });
      execFileSync(PYTHON, ["-I", "-c", RESIZE, png, path.join(OUT, name)], { stdio: "inherit" });
      rmSync(png);
    }

    const handout = await browser.newPage();
    await handout.goto(`${BASE}/handout`, { waitUntil: "networkidle" });
    await handout.evaluate(() => document.fonts.ready);
    const pdf = path.join(OUT, "fair-handout.pdf");
    await handout.pdf({ path: pdf, format: "Letter", printBackground: true });
    console.log(pdf);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
