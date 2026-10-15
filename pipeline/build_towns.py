"""Build the master town list, data/processed/towns.csv.

One row per Bergen taxing district: district code, the state's official
name, a clean display name, and a URL slug. Every other table joins on
district_code. This step also reports town names that differ across files.

Display names come from sources, not memory:
1. The county's revaluation list (data/reference/bergen_revaluation_towns.csv),
   which spells names out in full (for example "HO-HO-KUS", "FAIR LAWN").
2. Otherwise the state's CoefficientDeviations.pdf name (for example
   "Teaneck Twp"), with the town-type word removed.

Run after parse_ch123 and parse_state_tables:
.venv\\Scripts\\python.exe -m pipeline.build_towns
"""

import re

import pandas as pd

from pipeline import config

TYPE_WORDS = {"BORO", "TWP", "CITY", "VILLAGE", "TOWN", "TOWNSHIP", "BOROUGH"}
# The county list prints Washington Township as "TWP. OF WASHINGTON".
ABBREVIATIONS = {"TWP. OF": "TOWNSHIP OF"}
SMALL_WORDS = {"Of", "And"}
# Display names chosen on purpose instead of the rule above (Zaden delegated,
# 2026-10-15). The county prints "TWP. OF WASHINGTON"; the state prints
# "WASHINGTON TWP". We show the state's order with "Twp" spelled out, because
# that is how people search for the town.
DISPLAY_OVERRIDES = {"0266": ("Washington Township", "2027CH123.pdf (WASHINGTON TWP), Twp spelled out")}


def read_codes(path, **kw):
    """Read a CSV keeping district_code as 4-digit text."""
    return pd.read_csv(path, dtype={"district_code": str}, **kw)


def drop_type_word(name):
    """Remove a trailing town-type word: "Teaneck Twp" -> "Teaneck"."""
    words = name.split()
    if len(words) > 1 and words[-1].upper() in TYPE_WORDS:
        words = words[:-1]
    return " ".join(words)


def title_name(name):
    """Title-case a name: "HO-HO-KUS" -> "Ho-Ho-Kus", "TOWNSHIP OF X" -> "Township of X"."""
    for short, full in ABBREVIATIONS.items():
        name = name.replace(short, full)
    words = [w.title() for w in name.split()]
    return " ".join(w.lower() if i and w in SMALL_WORDS else w for i, w in enumerate(words))


def make_slug(name):
    """URL slug: "Ho-Ho-Kus" -> "ho-ho-kus", "Township of Washington" -> "township-of-washington"."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def norm(name):
    """Upper-case, squeeze spaces, and drop the town-type word, for comparing names."""
    return drop_type_word(re.sub(r"\s+", " ", str(name).upper()).strip())


def build_towns():
    """Return the master town table (70 rows)."""
    ch = read_codes(config.CH123_CSV[2027])
    reval = read_codes(config.REVALUATION_TOWNS_CSV)
    cod = read_codes(config.STATE_COD_CSV)
    cod_names = cod.drop_duplicates("district_code").set_index("district_code")["district_name"]
    towns = ch[["district_code", "town_name_printed"]].rename(
        columns={"town_name_printed": "official_name"})
    towns = towns.merge(reval[["district_code", "name_on_county_list", "revaluation_tax_year"]],
                        on="district_code", how="left")
    display, source = [], []
    for row in towns.itertuples():
        if row.district_code in DISPLAY_OVERRIDES:
            name, src = DISPLAY_OVERRIDES[row.district_code]
            display.append(name)
            source.append(src)
        elif isinstance(row.name_on_county_list, str):
            display.append(title_name(row.name_on_county_list))
            source.append("county revaluation list")
        else:
            display.append(title_name(drop_type_word(cod_names[row.district_code])))
            source.append("CoefficientDeviations.pdf")
    towns["display_name"] = display
    towns["display_name_source"] = source
    towns["slug"] = towns["display_name"].map(make_slug)
    towns["revaluation_tax_year"] = towns["revaluation_tax_year"].astype("Int64")
    cols = ["district_code", "official_name", "display_name", "slug",
            "revaluation_tax_year", "display_name_source"]
    return towns[cols].sort_values("district_code").reset_index(drop=True)


def name_mismatches(towns):
    """Compare each file's town name to the official (2027 Chapter 123) name.

    Returns one row per (file, town) where the name is spelled differently.
    """
    sources = {
        "2026CH123.pdf": (read_codes(config.CH123_CSV[2026]), "town_name_printed"),
        "DirRatios.xlsx": (read_codes(config.DIR_RATIOS_CSV), "district_name"),
        "GTRhistory.xlsx": (read_codes(config.TAX_RATES_CSV), "district_name"),
        "2026AvgResStat.pdf": (read_codes(config.AVG_RES_CSV), "district_name"),
        "CoefficientDeviations.pdf": (read_codes(config.STATE_COD_CSV), "district_name"),
        "county revaluation list": (read_codes(config.REVALUATION_TOWNS_CSV), "name_on_county_list"),
    }
    official = towns.set_index("district_code")["official_name"].map(norm)
    out = []
    for label, (df, col) in sources.items():
        names = df.drop_duplicates("district_code").set_index("district_code")[col]
        for code, name in names.items():
            if code not in official.index:
                out.append({"file": label, "district_code": code, "name_in_file": name,
                            "official_name": "(code not in towns.csv)"})
            elif norm(name) != official[code]:
                out.append({"file": label, "district_code": code, "name_in_file": name,
                            "official_name": towns.set_index("district_code").at[code, "official_name"]})
    return pd.DataFrame(out)


def main():
    """Write towns.csv and print the name check."""
    towns = build_towns()
    towns.to_csv(config.TOWNS_CSV, index=False)
    print(f"{len(towns)} towns -> {config.TOWNS_CSV.relative_to(config.ROOT)}")
    mm = name_mismatches(towns)
    print(f"{len(mm)} name differences (codes always match):")
    if len(mm):
        print(mm.groupby("file").size().to_string())


if __name__ == "__main__":
    main()
