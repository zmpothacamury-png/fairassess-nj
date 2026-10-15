import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CompSchema, TownFileSchema, TownsSchema } from "./schema";
import { validateDataDir } from "./validate";
import { DataFileError, readDataFile } from "./load";

const DATA = path.join(__dirname, "..", "..", "public", "data");
const read = (file: string) => JSON.parse(readFileSync(path.join(DATA, file), "utf8"));

describe("data contract on the real exported files", () => {
  it("every file in public/data passes", () => {
    const { problems, sizes } = validateDataDir(DATA);
    expect(problems).toEqual([]);
    expect(Object.keys(sizes)).toContain("towns.json");
  });

  it("has all 70 towns", () => {
    expect(TownsSchema.parse(read("towns.json"))).toHaveLength(70);
  });
});

describe("schemas reject bad data", () => {
  const comp = { deed_date: "2025-03-14", sale_price: 650000, assessed_value: 412300, ratio: 0.6343 };

  it("accepts a normal comp", () => {
    expect(CompSchema.safeParse(comp).success).toBe(true);
  });

  it("rejects a comp with a street name", () => {
    expect(CompSchema.safeParse({ ...comp, street: "MAIN ST" }).success).toBe(false);
  });

  it("rejects a comp with a non-whole sale price or a bad date", () => {
    expect(CompSchema.safeParse({ ...comp, sale_price: 650000.5 }).success).toBe(false);
    expect(CompSchema.safeParse({ ...comp, deed_date: "2025-13-01" }).success).toBe(false);
  });

  it("rejects a town file with a text number or a missing field", () => {
    const town = read("towns/bergenfield.json");
    expect(TownFileSchema.safeParse(town).success).toBe(true);
    expect(TownFileSchema.safeParse({ ...town, n_sales: "156" }).success).toBe(false);
    delete town.comps;
    expect(TownFileSchema.safeParse(town).success).toBe(false);
  });

  it("rejects an unknown label", () => {
    const towns = read("towns.json");
    towns[0].label = "Very unfair";
    expect(TownsSchema.safeParse(towns).success).toBe(false);
  });
});

describe("folder checks", () => {
  let dir = "";
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  const copy = () => {
    dir = mkdtempSync(path.join(tmpdir(), "fa-data-"));
    cpSync(DATA, dir, { recursive: true });
    return dir;
  };

  it("finds a town file that is missing", () => {
    const d = copy();
    rmSync(path.join(d, "towns", "bergenfield.json"));
    expect(validateDataDir(d).problems.join("\n")).toMatch(/bergenfield\.json is missing/);
  });

  it("finds a town file that disagrees with towns.json", () => {
    const d = copy();
    const file = path.join(d, "towns", "bergenfield.json");
    const town = JSON.parse(readFileSync(file, "utf8"));
    town.n_sales += 1;
    writeFileSync(file, JSON.stringify(town));
    expect(validateDataDir(d).problems.join("\n")).toMatch(/"n_sales" differs/);
  });

  it("finds an over-budget town file", () => {
    const d = copy();
    const file = path.join(d, "towns", "bergenfield.json");
    const town = JSON.parse(readFileSync(file, "utf8"));
    town.scatter_sampling.method = "x".repeat(160 * 1024);
    writeFileSync(file, JSON.stringify(town));
    expect(validateDataDir(d).problems.join("\n")).toMatch(/over the 153600 byte budget/);
  });

  it("the loader throws a clear error on a bad file", async () => {
    const d = copy();
    writeFileSync(path.join(d, "meta.json"), JSON.stringify({ n_towns: 70 }));
    const { MetaSchema } = await import("./schema");
    await expect(readDataFile("meta.json", MetaSchema, d)).rejects.toBeInstanceOf(DataFileError);
  });
});
