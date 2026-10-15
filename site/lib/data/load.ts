// Server-side loader for the pipeline's JSON files in public/data/.
// Every read is checked against the data contract (schema.ts), so a page
// never renders from a file that does not match it.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  CountySchema,
  FilterLogSchema,
  MetaSchema,
  PriceIndexSchema,
  TownFileSchema,
  TownsSchema,
  ValidationSchema,
} from "./schema";

export const DATA_DIR = path.join(process.cwd(), "public", "data");

export class DataFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataFileError";
  }
}

/** Read one JSON file from the data folder and validate it. Throws DataFileError if it does not match. */
export async function readDataFile<S extends z.ZodType>(
  file: string,
  schema: S,
  dir: string = DATA_DIR,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  } catch (err) {
    throw new DataFileError(`${file}: cannot read as JSON (${(err as Error).message})`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new DataFileError(`${file} does not match the data contract:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const loadMeta = () => readDataFile("meta.json", MetaSchema);
export const loadCounty = () => readDataFile("county.json", CountySchema);
export const loadTowns = () => readDataFile("towns.json", TownsSchema);
export const loadPriceIndex = () => readDataFile("price-index.json", PriceIndexSchema);
export const loadValidation = () => readDataFile("validation.json", ValidationSchema);
export const loadFilterLog = () => readDataFile("filter-log.json", FilterLogSchema);

/** One town's file. The slug is checked first so it can never point outside the towns folder. */
export function loadTown(slug: string) {
  if (!SLUG.test(slug)) throw new DataFileError(`"${slug}" is not a valid town slug`);
  return readDataFile(`towns/${slug}.json`, TownFileSchema);
}
