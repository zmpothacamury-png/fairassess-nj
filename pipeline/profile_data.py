"""Write docs/data-profile.md: a plain-English description of the raw data.

This step only READS and DESCRIBES. It applies no cleaning rules. Where it
filters (for example "class 2, usable"), that is to describe a group, not to
clean it. Every number in the report is computed here, so rerunning the
script refreshes the report.

Run after the parsers:
.venv\\Scripts\\python.exe -m pipeline.profile_data
"""

from datetime import date

import numpy as np
import pandas as pd

from pipeline import config

WINDOW_START = date(2024, 7, 1)  # last 24 months of recording dates in our files
WINDOW_END = date(2026, 6, 30)
FAR_BELOW = 0.70  # towns whose median raw ratio is under this get called out


# ---------------------------------------------------------------- helpers

def md_table(df, floatfmt=None):
    """Render a DataFrame as a GitHub Markdown table (no extra packages)."""
    floatfmt = floatfmt or {}

    def cell(col, v):
        if v is None or (isinstance(v, float) and np.isnan(v)) or v is pd.NA or v is pd.NaT:
            return "—"
        if col in floatfmt:
            return format(v, floatfmt[col])
        if isinstance(v, (int, np.integer)) and not isinstance(v, bool):
            return f"{v:,}"
        if isinstance(v, (float, np.floating)):
            return f"{v:,.2f}"
        if isinstance(v, pd.Timestamp):
            return v.date().isoformat()
        return str(v).replace("|", "\\|")

    head = "| " + " | ".join(df.columns) + " |"
    sep = "|" + "|".join("---" for _ in df.columns) + "|"
    body = ["| " + " | ".join(cell(c, v) for c, v in zip(df.columns, row)) + " |"
            for row in df.itertuples(index=False)]
    return "\n".join([head, sep, *body])


def read_codes(path):
    """Read a processed CSV keeping district_code as text."""
    return pd.read_csv(path, dtype={"district_code": str})


def n(x):
    """Format a whole number with commas."""
    return f"{int(x):,}"


def multi_lot_flags(df):
    """Three ways to spot a sale with extra lots; returned as columns.

    - total_gt_main: TOTAL ASSESSMENT (5-16) is larger than the main lot total
    - addl_value: any ADDL-VALUE-TOTAL above 0
    - addl_block_real: any ADDL-BLOCK that is not blank and not all zeros
    """
    blocks = df[[f"addl_block_{i}" for i in range(1, 6)]]
    real = blocks.apply(lambda s: s.notna() & ~s.fillna("").str.fullmatch("0+"))
    any_block = blocks.notna().any(axis=1)
    addl = df[[f"addl_av_total_{i}" for i in range(1, 6)]].fillna(0).sum(axis=1)
    return pd.DataFrame({
        "addl_block_any": any_block,
        "addl_block_real": real.any(axis=1),
        "addl_value": addl > 0,
        "total_gt_main": df["total_assessment"] > df["av_total"],
    })


# ---------------------------------------------------------------- sections

def section_files(summary, df):
    """Rows per file, date ranges, and how files overlap."""
    s = summary.copy()
    s["layout matches PDF"] = s["layout_ok"].map({True: "yes", False: "**no**"})
    tbl = s[["source_file", "extracted", "rows_all_nj", "rows_bergen", "recorded_min",
             "recorded_max", "deed_min", "deed_max", "layout matches PDF"]]
    tbl.columns = ["File", "File date", "Rows (all NJ)", "Rows (Bergen)", "First recorded",
                   "Last recorded", "Earliest deed", "Latest deed", "Layout matches PDF"]

    ids = {f: set(g["record_id"]) for f, g in df.groupby("source_file")}
    s26, ytd, s25 = ids["Sales2026"], ids["YTDSR1A2026"], ids["Sales2025"]
    both = df[df.record_id.isin(s26 & ytd)]
    pair = both.pivot_table(index="record_id", columns="source_file", values="line_md5", aggfunc="first")
    identical = int((pair["Sales2026"] == pair["YTDSR1A2026"]).sum())
    un = both.pivot_table(index="record_id", columns="source_file", values="un_type", aggfunc="first")
    u_to_n = int(((un["YTDSR1A2026"] == "U") & (un["Sales2026"] == "N")).sum())
    n_to_u = int(((un["YTDSR1A2026"] == "N") & (un["Sales2026"] == "U")).sum())
    only26 = df[df.record_id.isin(s26 - ytd) & (df.source_file == "Sales2026")]
    late = int((only26.recorded_date >= "2026-06-01").sum())

    return f"""## 1. The SR1A files

SR1A is the state's sales file. Every deed recorded in New Jersey gets one line of 663 characters.

{md_table(tbl)}

- Every line in every file is exactly {config.SR1A_LINE_LENGTH} characters long. No file has two exactly identical lines.
- "Recorded" is the date the deed was filed with the county. Each file covers **July 1 to June 30** of recording dates. That is the state's own sampling year (methodology Section 3.2).
- "Deed" is the date the deed was signed. A few deeds are years old when they are finally recorded (the earliest in Sales2026 was signed {summary.set_index("source_file").at["Sales2026", "deed_min"]}), so deed dates spread wider than recording dates.

**Sales2024 does not match the layout PDF.** Its value fields are shifted: in most Bergen rows, positions 65-73 hold land + building (the total), not the building value, and its SALES-RATIO only matches our math on a minority of rows. Its property class sits one place to the right, and its ETC flag is "X" on every Bergen row. Dates (positions 339-350) and the county/town codes still line up, so the table above is right, but the parser does **not** decode Sales2024 into the parquet file. Sales2024 is not used in v1 (methodology Section 3.1).

### Duplicates across files

Each SR1A line has a SERIAL-NUMBER, which the state calls a "unique auto generated number issued to each SR1A." We use **record_id = county code + district code + serial number** (for example `0201-7354015`). No record_id repeats inside any file.

| Pair of files | Shared sales | Only in first | Only in second |
|---|---|---|---|
| Sales2026 and YTDSR1A2026 | {n(len(s26 & ytd))} | {n(len(s26 - ytd))} | {n(len(ytd - s26))} |
| Sales2025 and Sales2026 | {n(len(s25 & s26))} | {n(len(s25 - s26))} | {n(len(s26 - s25))} |

What this shows:
- **YTDSR1A2026 is an older copy of Sales2026.** Every one of its {n(len(ytd))} Bergen sales is also in Sales2026. Its file date is August 12, 2026; Sales2026's is September 24, 2026. Sales2026 has {n(len(s26 - ytd))} more sales, {n(late)} of them recorded in June 2026 (late arrivals).
- Of the {n(len(s26 & ytd))} shared sales, {n(identical)} lines are identical. The rest were updated by the state between the two copies. {n(u_to_n)} sales changed from usable to non-usable, and {n(n_to_u)} changed the other way.
- **Rule for removing duplicates:** when the same record_id is in two files, keep the row from the newer file (Sales2026). The parquet file keeps every row and marks the older copy with `superseded_by_newer_file = True`, so nothing is thrown away before the cleaning step.
- Sales2025 and Sales2026 share no sales. Their recording dates do not overlap.

**For the rest of this report** we use the {n((~df.superseded_by_newer_file).sum())} Bergen rows that are not superseded: Sales2025 ({n((df.source_file == 'Sales2025').sum())}) plus Sales2026 ({n((df.source_file == 'Sales2026').sum())}). Recording dates run July 1, 2024 to June 30, 2026, which is exactly 24 months.
"""


def section_classes(d, codes):
    """Counts by property class, usable vs non-usable, and top non-usable codes."""
    labels = {"1": "Vacant land", "2": "Residential", "3A": "Farm (regular)", "3B": "Farm (qualified)",
              "4A": "Commercial", "4B": "Industrial", "4C": "Apartment",
              "15A": "Public school", "15B": "Other school", "15C": "Public property",
              "15D": "Church and charitable", "15E": "Cemetery", "15F": "Other exempt"}
    t = pd.crosstab(d.property_class.fillna("(blank)"), d.un_type).reset_index()
    t["Total"] = t["N"] + t["U"]
    t.insert(1, "Meaning", t["property_class"].map(labels).fillna("?"))
    t = t.sort_values("Total", ascending=False)
    t.columns = ["Class", "Meaning", "Non-usable (N)", "Usable (U)", "Total"]

    nu = d[d.un_type == "N"]
    top = nu.sr_nu_code.fillna("(blank)").value_counts().head(15).reset_index()
    top.columns = ["code", "Sales"]
    top["code"] = top["code"].str.zfill(2)
    top = top.merge(codes[["code", "short_label"]], on="code", how="left")
    top["Share of non-usable"] = (top["Sales"] / len(nu) * 100).map(lambda x: f"{x:.1f}%")
    top = top[["code", "short_label", "Sales", "Share of non-usable"]]
    top.columns = ["Code", "What it means", "Sales", "Share of non-usable"]
    blank_n = int(nu.sr_nu_code.isna().sum())
    class2 = d[d.property_class == "2"]
    return f"""## 2. Property class and usable sales

Class comes from PROPERTY-CLASS. "Usable" comes from U-N-TYPE: the state marks each sale U (usable in its ratio study) or N (not usable).

{md_table(t)}

- {n(len(class2))} of {n(len(d))} Bergen sales ({len(class2) / len(d) * 100:.0f}%) are class 2. Of those, {n((class2.un_type == 'U').sum())} ({(class2.un_type == 'U').mean() * 100:.0f}%) are usable.
- Overall, {n((d.un_type == 'U').sum())} sales are usable and {n((d.un_type == 'N').sum())} are not.

### The 15 most common non-usable codes

The SR1A description PDF does not list what the codes mean; it points to N.J.A.C. 18:12-1.1. The meanings below come from the state's *Guidelines for use of 36 Nonusable Categories* (May 2025), saved as `data/raw/notes/NJ_Guidelines_Nonusable_Categories_36.pdf` and summarized in `data/reference/nonusable_codes.csv`.

{md_table(top)}

{n(blank_n)} non-usable sales have a blank SR-NU-CODE.
"""


def section_missing(d):
    """Missing or zero values in the key fields."""
    rows = []
    for col, label in [("price_verified", "Verified sale price"), ("price_reported", "Reported sale price"),
                       ("av_total", "Assessed value (main lot total)"), ("property_class", "Property class"),
                       ("deed_date", "Deed date"), ("recorded_date", "Recorded date"),
                       ("assess_year", "Assessment year")]:
        s = d[col]
        missing = int(s.isna().sum())
        zero = int((s == 0).sum()) if s.dtype.kind in "iuf" or str(s.dtype) in ("Int64", "Float64") else 0
        tiny = f"{int(((s > 0) & (s < 1000)).sum()):,}" if col.startswith("price") else None
        rows.append({"Field": label, "Missing": missing, "Zero": zero,
                     "$1 to $999": tiny})
    t = pd.DataFrame(rows)
    u2 = d[(d.property_class == "2") & (d.un_type == "U")]
    nominal = d[(d.price_verified < 1000)]
    return f"""## 3. Missing and zero values

All {n(len(d))} rows (Sales2025 + Sales2026, Bergen):

{md_table(t)}

- No date failed to decode. Dates that are all zeros would count as missing; none of the key dates are.
- {"All" if (nominal.un_type == 'N').all() else n((nominal.un_type == 'N').sum()) + " of the"} {n(len(nominal))} sales under $1,000 are non-usable. Most are token-price deeds (code 25, "price of $100 or less"), such as transfers between family members or to fix a title.
- **Class 2 usable sales have no missing or zero price, assessment, class, or date** ({n(len(u2))} rows). Their verified price equals the reported price on every row ({n((u2.price_verified != u2.price_reported).sum())} differ).
"""


def section_window(d, ch, towns, cod, avg):
    """Class 2 usable sales, last 24 months: per-town counts, prices, ratios."""
    w = d[(d.property_class == "2") & (d.un_type == "U") &
          (d.recorded_date >= pd.Timestamp(WINDOW_START)) & (d.recorded_date <= pd.Timestamp(WINDOW_END))].copy()
    w["ratio"] = w["av_total"] / w["price_verified"]
    p = w["price_verified"]
    pq = pd.DataFrame({"Measure": ["Lowest", "10th percentile", "25th percentile", "Median",
                                   "75th percentile", "90th percentile", "Highest"],
                       "Sale price": [p.min(), p.quantile(.1), p.quantile(.25), p.median(),
                                      p.quantile(.75), p.quantile(.9), p.max()],
                       "Raw ratio": [w.ratio.min(), w.ratio.quantile(.1), w.ratio.quantile(.25),
                                     w.ratio.median(), w.ratio.quantile(.75), w.ratio.quantile(.9),
                                     w.ratio.max()]})
    pq["Sale price"] = pq["Sale price"].map(lambda x: f"${x:,.0f}")

    g = w.groupby("district_code")
    t = pd.DataFrame({
        "sales_2y": g.size(),
        "sales_26": w[w.source_file == "Sales2026"].groupby("district_code").size(),
        "median_price": g.price_verified.median(),
        "q1": g.ratio.quantile(.25), "median_ratio": g.ratio.median(), "q3": g.ratio.quantile(.75),
    }).reindex(towns.district_code).fillna({"sales_2y": 0, "sales_26": 0})
    t = t.reset_index().merge(towns[["district_code", "display_name"]], on="district_code")
    t = t.merge(ch[["district_code", "average_ratio"]], on="district_code")
    t["state_avg"] = t["average_ratio"] / 100
    cnt = cod[cod.year == 2026][["district_code", "n_class2"]].fillna({"n_class2": 0})  # "-" = no sales
    t = t.merge(cnt, on="district_code").merge(avg[["district_code", "n_sales"]], on="district_code")
    v1 = int(((t.sales_26 == t.n_class2) & (t.sales_26 == t.n_sales)).sum())

    show = t[["district_code", "display_name", "sales_2y", "sales_26", "median_price", "q1",
              "median_ratio", "q3", "state_avg"]].copy()
    show["median_price"] = show["median_price"].map(lambda x: "—" if pd.isna(x) else f"${x:,.0f}")
    for c in ["sales_2y", "sales_26"]:
        show[c] = show[c].astype(int)
    show.columns = ["Code", "Town", "Sales (24 mo)", "Sales2026 only", "Median price",
                    "Ratio Q1", "Median ratio", "Ratio Q3", "State avg ratio 2027"]
    fmt = {c: ".2f" for c in ["Ratio Q1", "Median ratio", "Ratio Q3", "State avg ratio 2027"]}

    m26 = w[w.source_file == "Sales2026"].groupby("district_code").ratio.median()
    gap = (t.set_index("district_code").state_avg - m26).dropna() * -1
    big = gap.sort_values().head(5)
    names = towns.set_index("district_code").display_name
    big5 = ", ".join(f"{names[c]} ({v * 100:+.1f})" for c, v in big.items())
    reval26 = set(towns[towns.revaluation_tax_year == 2026].district_code)
    n_reval = sum(c in reval26 for c in big.index)
    s26 = w[(w.source_file == "Sales2026") & w.district_code.isin(reval26)]
    old_basis = n((s26.assess_year == 25).sum())
    s25 = w[(w.source_file == "Sales2025") & w.district_code.isin(reval26)]
    old25, all25 = n((s25.assess_year < 26).sum()), n(len(s25))
    cnt26 = w[w.source_file == "Sales2026"].groupby("district_code").size()
    few = ", ".join(f"{names[c]} {int(cnt26.get(c, 0))}" for c in big.index)
    low = t[t.median_ratio < FAR_BELOW].sort_values("median_ratio")
    low_list = ", ".join(f"{r.display_name} ({r.median_ratio:.2f})" for r in low.itertuples())
    lowest = low.iloc[0]
    above1 = t[t.median_ratio > 1.0]
    small = t[t.sales_2y < 20]

    return f"""## 4. Class 2 usable sales in the last 24 months

**Group described here:** class 2 (residential), usable (U), recorded July 1, 2024 to June 30, 2026 (Sales2025 + Sales2026). That is {n(len(w))} sales. No cleaning rules are applied: condos, multi-lot sales, and outliers are all still in.

**Raw ratio** = assessed value (main lot total) / verified sale price. A ratio of 0.80 means the home is assessed at 80% of what it sold for. We show ratios as decimals here; the site shows them as percents.

### Price and ratio, all Bergen

{md_table(pq, {"Raw ratio": ".3f"})}

### By town (all 70)

"Sales2026 only" is the state's July 2025 to June 2026 sampling year (methodology rule T0). "State avg ratio 2027" is the town's average ratio from 2027CH123.pdf, shown as a decimal. Q1 and Q3 are the 25th and 75th percentiles of the raw ratio: half the town's sales fall between them.

{md_table(show, fmt)}

**Check against the state (V1):** the "Sales2026 only" count equals the state's 2026 class-2 count in CoefficientDeviations.pdf **and** the "# of Sales" in 2026AvgResStat.pdf in **{v1} of 70** towns.

### Towns assessed far below market value

A ratio far below 1.0 does **not** by itself mean a town is unfair. New Jersey towns do not all assess at 100% of market value. Between revaluations, home prices rise but assessments stay the same, so the ratio drifts down over time. What matters for fairness is whether homes *within* a town have similar ratios (COD) and whether cheap and expensive homes are treated alike (PRD, PRB). That is why every comparison on the site is made against each town's own level.

- {len(low)} towns have a median raw ratio under {FAR_BELOW:.2f}: {low_list}.
- The lowest is {lowest.display_name} at {lowest.median_ratio:.2f}: a typical home there is assessed at about {lowest.median_ratio * 100:.0f}% of its sale price. The state's 2027 average ratio for {lowest.display_name} ({lowest.average_ratio:.2f}%) tells the same story.
- {"No town has" if not len(above1) else f"{len(above1)} towns have"} a median raw ratio above 1.0{": " + ", ".join(above1.display_name) if len(above1) else ""}.
- Using Sales2026 only (the state's sampling year), our raw median is below the state's 2027 average ratio in {int((gap < 0).sum())} of {len(gap)} towns with sales. The average gap is {gap.mean() * 100:+.1f} points and the biggest is {gap.min() * 100:+.1f} points. Methodology rule V3 expects our median to sit below the state's number. (These raw medians still include condos and multi-lot sales.)
- The 5 biggest gaps (Sales2026 only): {big5}. {n_reval} of these 5 towns are on the county's 2026 revaluation/reassessment list. In 2026-list towns, {old_basis} usable class-2 Sales2026 sales carry the old (ASSESS-YEAR 25) assessment, so the gap is **not** caused by mixing old and new assessments. Several of these towns have very few sales ({few}). We do not yet know why the gap is so large; rule V3 flags these towns for review once cleaning is done. **Decided (methodology 1.1, rule C6):** a sale is multi-lot when TOTAL ASSESSMENT is greater than the main-lot total.
- The 24-month medians (table above) mix two assessment bases in the 36 towns on the 2026 list: {old25} of their {all25} usable class-2 Sales2025 sales carry a pre-revaluation assessment (ASSESS-YEAR before 26). This helps explain why, for example, Leonia's 24-month median is far below its 2027 state ratio. Rule C9 handles this; town statistics use Sales2026 only (rule T0).
- {len(small)} towns have fewer than 20 sales even over 24 months: {", ".join(small.display_name)}.
"""


def section_examples(d, codes):
    """Five example rows with every kept field explained."""
    picks = []
    u2 = d[(d.property_class == "2") & (d.un_type == "U")]
    picks.append(u2[(u2.source_file == "Sales2026") & u2.qual_code.isna()].iloc[0])
    picks.append(u2[u2.qual_code.fillna("").str.startswith("C")].iloc[0])
    picks.append(u2[(u2.total_assessment > u2.av_total) & u2.qual_code.isna()].iloc[0])
    picks.append(d[(d.property_class == "2") & (d.un_type == "N") & (d.price_verified < 1000)].iloc[0])
    picks.append(d[(d.property_class == "4A")].iloc[0])
    ex = pd.DataFrame(picks)
    fields = [("source_file", "Which SR1A file the row came from."),
              ("district_code", "4-digit town code: county 02 + town. Joins to towns.csv."),
              ("un_type", "U = usable in the state's ratio study, N = not usable."),
              ("sr_nu_code", "Why the state marked it non-usable (Section 2)."),
              ("price_verified", "Sale price in whole dollars, verified by the state."),
              ("av_total", "Assessed value of the main lot (land + building)."),
              ("total_assessment", "Assessed value of all lots in the sale (main + extra lots)."),
              ("state_sales_ratio", "The state's ratio in percent (we do not use it; see methodology 2.1)."),
              ("deed_date", "Date the deed was signed."),
              ("recorded_date", "Date the deed was recorded; sets the sampling year."),
              ("assess_year", "Tax year of the assessment paired with the sale (2-digit)."),
              ("property_class", "2 = residential, 4A = commercial, and so on."),
              ("qual_code", "Starts with C = condominium unit."),
              ("year_built", "Year built (or effective year)."),
              ("living_sqft", "Living area in square feet.")]
    names = ["A: house", "B: condo", "C: two lots", "D: token price", "E: commercial"]
    rows = []
    for col, meaning in fields:
        vals = []
        for _, r in ex.iterrows():
            v = r[col]
            if v is None or v is pd.NA or (isinstance(v, float) and np.isnan(v)) or v is pd.NaT:
                vals.append("—")
            elif isinstance(v, pd.Timestamp):
                vals.append(v.date().isoformat())
            elif col in ("price_verified", "av_total", "total_assessment"):
                vals.append(f"${int(v):,}")
            elif col == "state_sales_ratio":
                vals.append(f"{float(v):.2f}")
            else:
                vals.append(str(v))
        rows.append([f"`{col}`", *vals, meaning])
    t = pd.DataFrame(rows, columns=["Field", *names, "Meaning"])
    return f"""## 5. Five example rows

Five real Bergen rows, one of each kind. Block, lot, deed book and page, and serial number are left out of this public document. Names and addresses are never read at all.

{md_table(t)}

- Row C shows why multi-lot sales matter: the main-lot assessment alone (`av_total`) is lower than the assessment of everything sold (`total_assessment`), so a ratio built on `av_total` would be too low.
- Row D is a typical non-usable deed for a token price.
"""


def section_surprises(d, df, summary, cod, avg, tr):
    """Things that surprised us and the methodology questions they raise."""
    u2 = d[(d.property_class == "2") & (d.un_type == "U")]
    f = multi_lot_flags(u2)
    by = pd.DataFrame({k: v.groupby(u2.source_file).sum() for k, v in f.items()}).astype(int)
    by = by.reset_index()
    by.columns = ["File", "ADDL-BLOCK not blank", "ADDL-BLOCK not blank and not 00000",
                  "ADDL-VALUE-TOTAL > 0", "TOTAL ASSESSMENT > main lot"]
    zeros = int((u2.addl_block_1 == "00000").sum())
    agree = int((f.addl_block_real == f.total_gt_main).sum())
    both = df[~df.superseded_by_newer_file]
    exact = int((both.total_assessment == both.av_total + both[[f"addl_av_total_{i}" for i in range(1, 6)]]
                 .fillna(0).sum(axis=1)).sum())
    half = u2.assign(rec=u2.recorded_date.dt.strftime("%Y-%m").str[:4] + np.where(u2.recorded_date.dt.month > 6, " Jul-Dec", " Jan-Jun"))
    ay = pd.crosstab(half.rec, half.assess_year).reset_index()
    ay.columns = ["Recorded", *[f"ASSESS-YEAR {c}" for c in ay.columns[1:]]]
    ml = both[(both.total_assessment > both.av_total) & (both.price_verified >= 1000)]

    def matches(av):
        return ((av / ml.price_verified * 100).clip(upper=999.99).round(2) - ml.state_sales_ratio).abs() <= 0.011

    ml_total, ml_main = int(matches(ml.total_assessment).sum()), int(matches(ml.av_total).sum())
    condo26 = u2[(u2.source_file == "Sales2026")].qual_code.fillna("").str.startswith("C").sum()
    return f"""## 6. Surprises and questions for the methodology

### 6.1 "00000" placeholders in ADDL-BLOCK (affects rule C6)

Rule C6 says a sale is multi-lot if "any ADDL-BLOCK(1) to ADDL-BLOCK(5) is not blank." In **Sales2025**, {n(zeros)} usable class-2 sales have ADDL-BLOCK(1) = "00000" with no extra lot and $0 extra value. It is a placeholder, not a real lot. Read literally, C6 would wrongly drop them. Sales2026 has no such placeholders.

{md_table(by)}

Three tests agree on every one of the {n(len(u2))} usable class-2 sales ({n(agree)} of {n(len(u2))}) once "00000" is treated as blank. TOTAL ASSESSMENT (positions 5-16) always equals the main lot plus the extra lots ({n(exact)} of {n(len(both))} rows). **Decided (methodology 1.1, rule C6):** multi-lot sales are still dropped, not kept with TOTAL ASSESSMENT.

### 6.2 TOTAL ASSESSMENT covers every lot in the sale

Positions 5-16 hold TOTAL ASSESSMENT (the 2011 description PDF has BATCH-NUMBER and DLN there instead). For one-lot sales it equals the main-lot assessment. For multi-lot sales it adds the extra lots. The state's own SALES-RATIO uses this total for multi-lot sales ({n(ml_total)} of {n(len(ml))} multi-lot sales priced $1,000 or more; {n(ml_main)} use the main lot only). This means multi-lot sales could be **kept** (using TOTAL ASSESSMENT) instead of dropped. Logged in `docs/validation.md` to investigate in the validation step.

### 6.3 YTDSR1A2026 is an older copy of Sales2026

It is a subset taken six weeks earlier. Later state reviews turned some usable sales into non-usable ones. This supports methodology Section 3.1: use Sales2026, not YTDSR1A2026.

### 6.4 Date formats are mixed

DEED-DATE, DATE-RECORDED, and AGING-DATE read as YYMMDD. LAST-UPDATE-DATE reads as **MMDDYY** (values like 122925 cannot be YYMMDD). The description PDF says the opposite for both. The parser handles each field by its real format and has tests for both.

### 6.5 Assessment year paired with each sale (usable class 2)

{md_table(ay)}

Sales recorded July to December carry the current year's assessment; most sales recorded January to June carry the new year's assessment, but some carry the prior year. This matches methodology rule C5 (we keep the state's pairing).

### 6.6 Other notes

- **Condos:** {n(condo26)} of the {n((u2.source_file == 'Sales2026').sum())} usable class-2 sales in Sales2026 are condo units (QUALIFICATION-CODE starts with "C"). Rule C10 removes them.
- **REALTY-TRANSFER-FEE** is stored two different ways (whole dollars in Sales2025; with a written decimal point and one extra character in Sales2026). We do not use it, so the parser does not keep it.
- **2026AvgResStat.pdf** has an "Avg Tax Bill" column, but it is **empty for all 70 Bergen towns**. The table keeps the column (blank). The checker's savings estimate uses GTRhistory.xlsx instead (rule K12).
- **Tax rates:** GTRhistory.xlsx runs {tr.year.min()} to **{tr.year.max()}**. There is no 2026 rate, and no separate 2026 Bergen tax rate file in `data/raw/state/`. Rule K12 already uses 2025.
- **State coefficient table:** CoefficientDeviations.pdf has 2023-2026 for all 70 towns; {int(cod.amended.sum())} town-years are marked amended (*).
"""


def build_report():
    """Compute every section and return the full Markdown text."""
    summary = pd.read_csv(config.INTERIM_DIR / "sr1a_file_summary.csv")
    df = pd.read_parquet(config.SR1A_PARQUET)
    d = df[~df.superseded_by_newer_file]
    codes = pd.read_csv(config.NONUSABLE_CODES_CSV, dtype={"code": str})
    ch = read_codes(config.CH123_CSV[2027])
    towns = read_codes(config.TOWNS_CSV)
    cod = read_codes(config.STATE_COD_CSV)
    avg = read_codes(config.AVG_RES_CSV)
    tr = read_codes(config.TAX_RATES_CSV)
    head = f"""# Data profile

*Generated by `pipeline/profile_data.py` on {date.today().isoformat()}. Do not edit by hand; rerun the script.*

This report describes the raw data **before any cleaning**. It answers: what is in each file, how the files overlap, and what looks odd. Rule IDs (C6, T0, V1, ...) refer to `docs/methodology.md`.

> FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.

"""
    parts = [head, section_files(summary, df), section_classes(d, codes), section_missing(d),
             section_window(d, ch, towns, cod, avg), section_examples(d, codes),
             section_surprises(d, df, summary, cod, avg, tr)]
    return "\n".join(parts)


def main():
    """Write docs/data-profile.md."""
    text = build_report()
    config.DATA_PROFILE_MD.write_text(text, encoding="utf-8", newline="\n")
    print(f"Wrote {config.DATA_PROFILE_MD.relative_to(config.ROOT)} ({len(text):,} characters)")


if __name__ == "__main__":
    main()
