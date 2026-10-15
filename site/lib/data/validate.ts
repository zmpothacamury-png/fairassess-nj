// Checks every file in public/data/ against the data contract (schema.ts),
// plus the cross-file rules a single schema cannot see. Used by
// `npm run validate-data` (which runs before every build) and by the tests.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  SHARED_FILES,
  SITE_DATA_MAX_BYTES,
  TOWN_FILE_MAX_BYTES,
  TownFileSchema,
  type Meta,
  type TownEntry,
} from "./schema";

export type ValidationReport = {
  problems: string[];
  sizes: Record<string, number>; // bytes, keyed by path inside the data folder
};

function parseFile(dir: string, file: string, schema: z.ZodType, problems: string[]): unknown {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  } catch (err) {
    problems.push(`${file}: cannot read as JSON (${(err as Error).message})`);
    return undefined;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    problems.push(`${file} does not match the data contract:\n${z.prettifyError(result.error)}`);
    return undefined;
  }
  return result.data;
}

function fileSizes(dir: string): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const full = path.join(entry.parentPath, entry.name);
    sizes[path.relative(dir, full).split(path.sep).join("/")] = statSync(full).size;
  }
  return sizes;
}

/** Validate the whole data folder. An empty `problems` list means every file passed. */
export function validateDataDir(dir: string): ValidationReport {
  const problems: string[] = [];
  const parsed: Record<string, unknown> = {};

  for (const [file, schema] of Object.entries(SHARED_FILES)) {
    parsed[file] = parseFile(dir, file, schema, problems);
  }

  const towns = parsed["towns.json"] as TownEntry[] | undefined;
  const meta = parsed["meta.json"] as Meta | undefined;
  const sizes = fileSizes(dir);

  if (towns) {
    if (meta && towns.length !== meta.n_towns) {
      problems.push(`towns.json has ${towns.length} towns but meta.json says ${meta.n_towns}`);
    }
    const slugs = new Set(towns.map((t) => t.slug));
    if (slugs.size !== towns.length) problems.push("towns.json has a repeated slug");

    for (const entry of towns) {
      const file = `towns/${entry.slug}.json`;
      if (!(file in sizes)) {
        problems.push(`${file} is missing (towns.json lists ${entry.slug})`);
        continue;
      }
      const town = parseFile(dir, file, TownFileSchema, problems) as TownEntry | undefined;
      if (!town) continue;
      for (const key of Object.keys(entry) as (keyof TownEntry)[]) {
        if (JSON.stringify(town[key]) !== JSON.stringify(entry[key])) {
          problems.push(`${file}: field "${key}" differs from its towns.json entry`);
        }
      }
    }
    for (const file of Object.keys(sizes)) {
      if (file.startsWith("towns/") && !slugs.has(file.slice(6, -5))) {
        problems.push(`${file} is not listed in towns.json`);
      }
    }
  }

  for (const [file, bytes] of Object.entries(sizes)) {
    if (file.startsWith("towns/") && bytes > TOWN_FILE_MAX_BYTES) {
      problems.push(`${file} is ${bytes} bytes, over the ${TOWN_FILE_MAX_BYTES} byte budget`);
    }
  }
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  if (total > SITE_DATA_MAX_BYTES) {
    problems.push(`public/data is ${total} bytes, over the ${SITE_DATA_MAX_BYTES} byte budget`);
  }

  return { problems, sizes };
}
