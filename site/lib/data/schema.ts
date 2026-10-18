// Data contract for the JSON files in public/data/ (made by pipeline/export.py).
// Every field is described in docs/data-contract.md. Objects are strict: a field
// the contract does not list (for example a street name on a comp) fails validation.
import { z } from "zod";

const isoDate = z.iso.date(); // YYYY-MM-DD
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "expected YYYY-MM");
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "expected a lowercase slug");
const districtCode = z.string().regex(/^02(0[1-9]|[1-6]\d|70)$/, "expected a Bergen district code 0201 to 0270");
const count = z.number().int().nonnegative();
const dollars = z.number().int().nonnegative();
const ratio = z.number(); // a decimal share of market value, e.g. 0.8 = 80%
const percent = z.number(); // a percent, e.g. 89.97
const share = z.number().min(0).max(1);

export const LABELS = [
  "Regressive pattern",
  "Progressive pattern",
  "Within standards",
  "Mixed signals",
  "Not enough sales",
] as const;
export const DATA_QUALITY = ["normal", "limited data", "not enough sales", "recent revaluation"] as const;

const label = z.enum(LABELS);

// ---------------------------------------------------------------- meta.json
export const MetaSchema = z.strictObject({
  generated_at: z.iso.datetime(),
  data_as_of: isoDate,
  county: z.literal("Bergen"),
  n_towns: count,
  town_stats_sales: z.strictObject({
    source_file: z.string(),
    sr1a_extract_date: isoDate,
    recorded_from: isoDate,
    recorded_to: isoDate,
    n_sales: count,
  }),
  comp_sales: z.strictObject({
    source_files: z.array(z.string()),
    deed_date_from: isoDate,
    deed_date_to: isoDate,
  }),
  price_index_months: z.strictObject({ from: month, to: month }),
  valuation_date: isoDate,
  chapter123_tax_year: z.number().int(),
  tax_rate_year: z.number().int(),
  methodology_version: z.string().regex(/^\d+(\.\d+)*$/),
  methodology_date: isoDate,
});

// ---------------------------------------------------------------- county.json
const groupMeasures = z.strictObject({
  about: z.string(),
  n_sales: count,
  median_ratio: ratio,
  mean_ratio: ratio,
  weighted_mean_ratio: ratio,
  cod: z.number(),
  prd: z.number(),
  prb: z.number(),
  prb_intercept: z.number(),
  prb_se: z.number(),
  prb_ci_low: z.number(),
  prb_ci_high: z.number(),
  median_ci_low: ratio,
  median_ci_high: ratio,
  cod_ci_low: z.number(),
  cod_ci_high: z.number(),
  prd_ci_low: z.number(),
  prd_ci_high: z.number(),
});

export const CountySchema = z.strictObject({
  source_file: z.string(),
  sales_recorded: z.string(),
  n_sales: count,
  n_towns: count,
  n_towns_with_sales: count,
  headline_version: z.enum(["within_town", "pooled"]),
  within_town: groupMeasures,
  pooled: groupMeasures,
  towns_by_label: z.record(label, count),
  towns_by_data_quality: z.record(z.enum(DATA_QUALITY), count),
  ranked_towns: count,
  ranked_towns_meeting_iaao: z.strictObject({ cod: count, prd: count, prb: count }),
  ranked_towns_prb_range_below_zero: count,
  ranked_towns_prb_range_above_zero: count,
  ranked_towns_prb_range_outside_0_10: count,
  ranked_towns_label_sensitive_to_outliers: count,
  t7_value_quarters: z.strictObject({
    n_towns: count,
    by_tier: z.array(
      z.strictObject({
        tier: z.number().int().min(1).max(4),
        n_sales: count,
        n_above_upper: count,
        n_below_lower: count,
        share_above_upper: share,
        share_below_lower: share,
      }),
    ),
  }),
  state_average_ratio_range: z.strictObject({
    tax_year: z.number().int(),
    source: z.string(),
    min: percent,
    min_town: z.string(),
    max: percent,
    max_town: z.string(),
  }),
  typical_ranked_town: z.strictObject({
    median_cod: z.number(),
    median_prd: z.number(),
    median_prb: z.number(),
  }),
});

// ---------------------------------------------------------------- towns.json
export const TownStatsSchema = z.strictObject({
  median_ratio: ratio,
  median_ci_low: ratio,
  median_ci_high: ratio,
  mean_ratio: ratio,
  weighted_mean_ratio: ratio,
  cod: z.number().nonnegative(),
  cod_ci_low: z.number().nonnegative(),
  cod_ci_high: z.number().nonnegative(),
  prd: z.number(),
  prd_ci_low: z.number(),
  prd_ci_high: z.number(),
  prb: z.number(),
  prb_intercept: z.number(),
  prb_se: z.number().nonnegative(),
  prb_ci_low: z.number(),
  prb_ci_high: z.number(),
  cod_meets_iaao: z.boolean(),
  cod_below_5: z.boolean(),
  prd_meets_iaao: z.boolean(),
  prb_meets_iaao: z.boolean(),
  prb_ci_outside_0_10: z.boolean(),
  label_fence_1_5: label,
  label_no_trim: label,
  label_sensitive_to_outliers: z.boolean(),
});

export const TownEntrySchema = z.strictObject({
  slug,
  name: z.string().min(1),
  district_code: districtCode,
  revaluation_tax_year: z.number().int().nullable(),
  n_sales: count,
  data_quality: z.enum(DATA_QUALITY),
  label,
  rank: z.number().int().positive().nullable(),
  stats: TownStatsSchema.nullable(),
  ch123: z.strictObject({
    tax_year: z.number().int(),
    average_ratio: percent,
    lower_limit: percent,
    upper_limit: percent,
    amended_by_tax_court: z.boolean(),
  }),
  tax_rate: z.strictObject({ year: z.number().int(), general_tax_rate: z.number().positive() }).nullable(),
  avg_residential: z
    .strictObject({
      year: z.number().int(),
      line_items: count,
      avg_assessment: dollars,
      n_sales: count,
      avg_sale_price: dollars,
    })
    .nullable(),
});

export const TownsSchema = z.array(TownEntrySchema);

// ---------------------------------------------------------------- filter log rows (Section 4)
export const FilterRowSchema = z.strictObject({
  source_file: z.enum(["All", "Sales2025", "Sales2026"]),
  rule_id: z.string().regex(/^C\d+$/),
  rows_in: count,
  rows_removed: count,
  rows_out: count,
});

// ---------------------------------------------------------------- towns/<slug>.json
export const TierSchema = z.strictObject({
  tier: z.number().int().min(1).max(4),
  n: count,
  value_low: dollars,
  value_high: dollars,
  sale_price_low: dollars,
  sale_price_high: dollars,
  median_ratio: ratio,
  lower_trigger: percent.nullable(),
  upper_trigger: percent.nullable(),
  n_above_upper: count.nullable(),
  n_below_lower: count.nullable(),
  share_above_upper: share.nullable(),
  share_below_lower: share.nullable(),
});

export const ScatterPointSchema = z.strictObject({ value: dollars, ratio });

// The only fields a comp may have. No street, house number, owner, or record ID.
export const CompSchema = z.strictObject({
  deed_date: isoDate,
  sale_price: dollars,
  assessed_value: dollars,
  ratio,
});

export const TownFileSchema = TownEntrySchema.extend({
  tiers: z.array(TierSchema),
  scatter: z.array(ScatterPointSchema),
  scatter_sampling: z.strictObject({
    n_sales: count,
    n_shown: count,
    max_points: count,
    method: z.string(),
  }),
  comp_window: z.strictObject({ deed_date_from: isoDate, deed_date_to: isoDate }),
  comps: z.array(CompSchema),
  filter_log: z.array(FilterRowSchema),
});

// ---------------------------------------------------------------- price-index.json
export const PriceIndexSchema = z.strictObject({
  base_month: month,
  chart_from: month,
  valuation_date: isoDate,
  note: z.string(),
  months: z.array(
    z.strictObject({
      month,
      n_sales: count,
      kept: z.boolean(),
      n_window: count.nullable(),
      raw_median_price: dollars.nullable(),
      index: z.number().positive().nullable(),
    }),
  ),
});

// ---------------------------------------------------------------- validation.json
export const ValidationSchema = z.strictObject({
  thresholds: z.strictObject({ v4_flag_pp: z.number(), v3_flag_pp: z.number(), v2_pass_pp: z.number() }),
  summary: z.record(z.string(), z.union([z.number(), z.string()])),
  towns: z.array(
    z.strictObject({
      district_code: districtCode,
      town: z.string(),
      state_average_ratio: percent,
      our_class2_median: percent.nullable(),
      diff_class2_median_pp: z.number().nullable(),
      v3_flag_over_10pp: z.boolean(),
      state_one_year_ratio: percent.nullable(),
      our_ratio_state_style: percent.nullable(),
      diff_one_year_pp: z.number().nullable(),
      flag_over_5pp: z.boolean(),
      averaging_effect_pp: z.number().nullable(),
      state_ratio_2025: percent.nullable(),
      our_n_classes_1_2_4: count,
      state_n_classes_1_2_4: count,
      counts_match: z.boolean(),
      state_cod_class2: z.number().nullable(),
      our_cod_state_style: z.number().nullable(),
      diff_cod: z.number().nullable(),
      v2_pass: z.boolean().nullable(),
    }),
  ),
});

// ---------------------------------------------------------------- filter-log.json
// County rows only; each town's rows are in its town file (filter_log).
export const FilterLogSchema = z.strictObject({
  rules: z.array(z.strictObject({ step: z.number().int().positive(), rule_id: z.string(), description: z.string() })),
  county: z.array(FilterRowSchema),
});

// ---------------------------------------------------------------- types
export type Meta = z.infer<typeof MetaSchema>;
export type County = z.infer<typeof CountySchema>;
export type TownStats = z.infer<typeof TownStatsSchema>;
export type TownEntry = z.infer<typeof TownEntrySchema>;
export type Tier = z.infer<typeof TierSchema>;
export type ScatterPoint = z.infer<typeof ScatterPointSchema>;
export type Comp = z.infer<typeof CompSchema>;
export type TownFile = z.infer<typeof TownFileSchema>;
export type PriceIndex = z.infer<typeof PriceIndexSchema>;
export type Validation = z.infer<typeof ValidationSchema>;
export type FilterRow = z.infer<typeof FilterRowSchema>;
export type FilterLog = z.infer<typeof FilterLogSchema>;

// Shared files (one per site) and the schema each must match.
export const SHARED_FILES = {
  "meta.json": MetaSchema,
  "county.json": CountySchema,
  "towns.json": TownsSchema,
  "price-index.json": PriceIndexSchema,
  "validation.json": ValidationSchema,
  "filter-log.json": FilterLogSchema,
} as const;

// Size budget (same numbers as pipeline/config.py).
export const TOWN_FILE_MAX_BYTES = 150 * 1024;
export const SITE_DATA_MAX_BYTES = 5 * 1024 * 1024;
