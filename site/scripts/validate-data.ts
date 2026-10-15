// npm run validate-data: check every file in public/data/ against the data
// contract. Runs before `next build`, so a bad file fails the build instead
// of reaching users.
import path from "node:path";
import { validateDataDir } from "../lib/data/validate";

const dir = path.join(process.cwd(), "public", "data");
const { problems, sizes } = validateDataDir(dir);

const files = Object.keys(sizes);
const total = Object.values(sizes).reduce((a, b) => a + b, 0);
const townSizes = files.filter((f) => f.startsWith("towns/")).map((f) => sizes[f]);
const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;

if (problems.length > 0) {
  console.error(`validate-data: ${problems.length} problem(s) in public/data:\n`);
  for (const p of problems) console.error(`- ${p}\n`);
  process.exit(1);
}

console.log(
  `validate-data: ${files.length} files match the data contract. ` +
    `Total ${kb(total)}; largest town file ${kb(Math.max(0, ...townSizes))}.`,
);
