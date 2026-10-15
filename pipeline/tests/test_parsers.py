"""Tests for the Prompt 4 parsers (SR1A, Chapter 123, state tables, towns)."""

from datetime import date

import pandas as pd
import pytest

from pipeline import config
from pipeline.build_towns import drop_type_word, make_slug, title_name
from pipeline.parse_ch123 import missing_codes, parse_ch123_text
from pipeline.parse_sr1a import (add_record_ids, check_layout, decode_date, decode_decimal,
                                 decode_int, expand_year, load_layout, parse_line)
from pipeline.parse_state_tables import cod_values, parse_cod_text

LAYOUT = load_layout()


def make_line(values):
    """Build a fake 663-character SR1A line. values = {field name: raw text}.

    Uses made-up data only (no real names or addresses).
    """
    chars = [" "] * config.SR1A_LINE_LENGTH
    spans = LAYOUT.set_index("field")[["start", "end"]]
    for field, raw in values.items():
        start, end = spans.loc[field]
        assert len(raw) == end - start + 1, field
        chars[start - 1:end] = list(raw)
    return "".join(chars)


SAMPLE = make_line({
    "COUNTY-CODE": "02", "DISTRICT-CODE": "20",
    "TOTAL ASSESSMENT": "000000851900",
    "LAST-UPDATE-DATE": "122925",
    "U-N-TYPE": "U", "SR-NU-CODE": "   ",
    "REPORTED-SALES-PRICE": "000999999", "VERIFIED-SALES-PRICE": "000999999",
    "MAIN LOT ASSESSED-VALUE-LAND": "000469900", "MAIN LOT ASSESSED-VALUE-BLDG": "000382000",
    "MAIN LOT ASSESSED-VALUE-TOTAL": "000851900", "SALES-RATIO": "08519",
    "SERIAL-NUMBER": "7354014",
    "GRANTOR-NAME": "TEST SELLER".ljust(35), "PROPERTY-LOCATION": "1 TEST ST".ljust(25),
    "DEED-DATE": "250611", "DATE-RECORDED": "250702",
    "BLOCK": "01204", "LOT": "00009",
    "QUALIFICATION-CODES": "     ", "ASSESS-YEAR": "25", "PROPERTY-CLASS": "2  ",
    "YEAR-BUILT": "1965", "LIVING-SPACE": "2680   ",
})


# ---------------------------------------------------------------- layout

def test_layout_covers_663_characters_with_no_gaps():
    check_layout(LAYOUT)  # raises if there is a gap or overlap
    assert LAYOUT["start"].iloc[0] == 1
    assert LAYOUT["end"].iloc[-1] == 663


def test_layout_matches_pdf_for_key_fields():
    spans = LAYOUT.set_index("field")
    assert tuple(spans.loc["VERIFIED-SALES-PRICE", ["start", "end"]]) == (47, 55)
    assert tuple(spans.loc["MAIN LOT ASSESSED-VALUE-TOTAL", ["start", "end"]]) == (74, 82)
    assert tuple(spans.loc["SALES-RATIO", ["start", "end"]]) == (83, 87)
    assert spans.loc["SALES-RATIO", "type"] == "signed_decimal"
    assert spans.loc["SALES-RATIO", "decimals"] == 2
    assert tuple(spans.loc["DEED-DATE", ["start", "end"]]) == (339, 344)
    assert tuple(spans.loc["PROPERTY-CLASS", ["start", "end"]]) == (627, 629)


def test_private_fields_are_never_kept():
    private = LAYOUT[LAYOUT["field"].str.contains("GRANTOR|GRANTEE|PROPERTY-LOCATION|OPERATOR")]
    assert len(private) == 10
    assert (private["column"] == "").all()


# ---------------------------------------------------------------- one sample line

def test_sample_line_parses_to_expected_values():
    rec = parse_line(SAMPLE, LAYOUT)
    assert rec["county_code"] == "02"
    assert rec["district_code"] == "20"
    assert rec["total_assessment"] == 851900
    assert rec["un_type"] == "U"
    assert rec["sr_nu_code"] is None
    assert rec["price_verified"] == 999999
    assert rec["av_land"] == 469900
    assert rec["av_bldg"] == 382000
    assert rec["av_total"] == 851900
    assert rec["state_sales_ratio"] == 85.19
    assert rec["serial_number"] == "7354014"
    assert rec["deed_date"] == date(2025, 6, 11)
    assert rec["recorded_date"] == date(2025, 7, 2)
    assert rec["last_update_date"] == date(2025, 12, 29)
    assert rec["assess_year"] == 25
    assert rec["property_class"] == "2"
    assert rec["qual_code"] is None
    assert rec["year_built"] == 1965
    assert rec["living_sqft"] == 2680


def test_sample_line_drops_names_and_addresses():
    rec = parse_line(SAMPLE, LAYOUT)
    assert not any("TEST SELLER" in str(v) or "TEST ST" in str(v) for v in rec.values())


# ---------------------------------------------------------------- decoding

@pytest.mark.parametrize("raw, decimals, signed, expected", [
    ("08496", 2, True, 84.96),     # SALES-RATIO S999V99
    ("00000", 2, True, 0.0),
    ("99999", 2, True, 999.99),
    ("0849}", 2, True, -84.90),    # overpunch: } = negative, last digit 0
    ("0849J", 2, True, -84.91),    # overpunch: J = negative, last digit 1
    ("0849A", 2, True, 84.91),     # overpunch: A = positive, last digit 1
    ("-8496", 2, True, -84.96),    # leading minus sign
    ("000586100", 2, False, 5861.0),  # 9(7)V99
    ("0006775.00", 2, False, 6775.0),  # written decimal point wins
    ("     ", 2, True, None),
])
def test_decode_decimal(raw, decimals, signed, expected):
    assert decode_decimal(raw, decimals, signed) == expected


def test_decode_int():
    assert decode_int("000749900") == 749900
    assert decode_int("2045   ") == 2045
    assert decode_int("   ") is None


@pytest.mark.parametrize("raw, fmt, expected", [
    ("250701", "YYMMDD", date(2025, 7, 1)),
    ("260630", "YYMMDD", date(2026, 6, 30)),
    ("071126", "YYMMDD", date(2007, 11, 26)),
    ("991231", "YYMMDD", date(1999, 12, 31)),   # century: 99 -> 1999
    ("122925", "MMDDYY", date(2025, 12, 29)),
    ("061226", "MMDDYY", date(2026, 6, 12)),
    ("000000", "YYMMDD", None),
    ("      ", "YYMMDD", None),
    ("251301", "YYMMDD", None),                 # month 13 is impossible
    ("250230", "YYMMDD", None),                 # February 30 is impossible
    ("122925", "YYMMDD", None),                 # month 29 is impossible as YYMMDD
])
def test_decode_date(raw, fmt, expected):
    assert decode_date(raw, fmt) == expected


def test_expand_year_pivot():
    assert expand_year(0) == 2000
    assert expand_year(26) == 2026
    assert expand_year(49) == 2049
    assert expand_year(50) == 1950
    assert expand_year(99) == 1999


def test_record_ids_mark_older_copy_as_superseded():
    df = pd.DataFrame({
        "source_file": ["YTDSR1A2026", "Sales2026", "Sales2026", "Sales2025"],
        "county_code": ["02"] * 4,
        "district_code": ["01", "01", "02", "01"],
        "serial_number": ["0000001", "0000001", "0000001", "0000009"],
    })
    out = add_record_ids(df)
    assert list(out["district_code"]) == ["0201", "0201", "0202", "0201"]
    assert list(out["record_id"]) == ["0201-0000001", "0201-0000001", "0202-0000001", "0201-0000009"]
    assert list(out["superseded_by_newer_file"]) == [True, False, False, False]


# ---------------------------------------------------------------- Chapter 123

def test_parse_ch123_text_reads_rows_and_tax_court_marks():
    text = ("BERGEN COUNTY AVERAGE RATIO LOWER LIMIT UPPER LIMIT\n"
            "0201 ALLENDALE BORO 89.97 76.47 103.47\n"
            "0202 ALPINE BORO** 96.24 81.80 110.68\n"
            "0901 BAYONNE CITY 62.97 53.52 72.42\n")
    rows = parse_ch123_text(text)
    assert [r["district_code"] for r in rows] == ["0201", "0202"]
    assert rows[0] == {"district_code": "0201", "town_name_printed": "ALLENDALE BORO",
                       "average_ratio": 89.97, "lower_limit": 76.47, "upper_limit": 103.47,
                       "amended_by_tax_court": False}
    assert rows[1]["town_name_printed"] == "ALPINE BORO"
    assert rows[1]["amended_by_tax_court"] is True


@pytest.mark.parametrize("year", [2027, 2026])
def test_ch123_tables_have_70_bergen_rows(year):
    df = pd.read_csv(config.CH123_CSV[year], dtype={"district_code": str})
    assert len(df) == config.N_TOWNS
    assert df["district_code"].is_unique
    assert missing_codes(df) == []


@pytest.mark.parametrize("year", [2027, 2026])
def test_ch123_lower_below_average_below_upper(year):
    df = pd.read_csv(config.CH123_CSV[year], dtype={"district_code": str})
    all_equal = (df.lower_limit == df.average_ratio) & (df.average_ratio == df.upper_limit)
    ok = (df.lower_limit < df.average_ratio) & (df.average_ratio < df.upper_limit)
    assert (ok | all_equal).all(), df[~(ok | all_equal)]


def test_ch123_2027_known_values():
    df = pd.read_csv(config.CH123_CSV[2027], dtype={"district_code": str}).set_index("district_code")
    assert tuple(df.loc["0201", ["average_ratio", "lower_limit", "upper_limit"]]) == (89.97, 76.47, 103.47)
    assert tuple(df.loc["0255", ["average_ratio", "lower_limit", "upper_limit"]]) == (119.50, 101.58, 137.43)


# ---------------------------------------------------------------- state tables

def test_cod_values_turns_dashes_into_blanks():
    vals = cod_values("11.03 - 10.68 - - 10.68 17.86 - 20 1 21")
    assert vals["general_coeff"] == 11.03
    assert vals["stratified_class1"] is None
    assert vals["stratified_class2"] == 10.68
    assert vals["n_class2"] == 20
    assert vals["n_total"] == 21


def test_cod_values_rejects_wrong_count():
    with pytest.raises(ValueError):
        cod_values("1 2 3")


def test_parse_cod_text_handles_county_prefix_wrapped_names_and_amended():
    text = ("Bergen Allendale Boro 0201 2026 11.03 - 10.68 - - 10.68 17.86 - 20 1 21\n"
            "2025 13.72 - 13.72 - - 13.72 - - 23 - 23\n"
            "East Rutherford 0212 2026 6.80 - 7.13 - - 6.81 6.79 - 10 1 11\n"
            "Boro\n"
            "* 2025 13.45 - 6.77 - 11.29 8.89 65.83 1 11 1 13\n"
            "Bergenfield Boro 0203 2026 14.57 - 14.46 15.61 - 14.45 16.97 - 162 8 170\n")
    df = parse_cod_text(text)
    assert list(df["district_code"]) == ["0201", "0201", "0212", "0212", "0203"]
    assert df.loc[0, "district_name"] == "Allendale Boro"
    assert set(df[df.district_code == "0212"]["district_name"]) == {"East Rutherford Boro"}
    assert df.loc[3, "amended"] and not df.loc[2, "amended"]
    assert df.loc[4, "district_name"] == "Bergenfield Boro"  # "Bergen" only stripped as a word


def test_state_tables_cover_all_70_towns():
    for path in [config.DIR_RATIOS_CSV, config.STATE_COD_CSV, config.TAX_RATES_CSV, config.AVG_RES_CSV]:
        df = pd.read_csv(path, dtype={"district_code": str})
        assert df["district_code"].nunique() == config.N_TOWNS, path.name


def test_avg_residential_tax_bill_column_is_empty_and_counts_sum():
    df = pd.read_csv(config.AVG_RES_CSV, dtype={"district_code": str})
    assert df["avg_tax_bill"].isna().all()
    assert df.set_index("district_code").at["0201", "n_sales"] == 20


def test_director_ratio_2026_equals_ch123_2027_average():
    dr = pd.read_csv(config.DIR_RATIOS_CSV, dtype={"district_code": str})
    ch = pd.read_csv(config.CH123_CSV[2027], dtype={"district_code": str})
    m = dr[dr.year == 2026].merge(ch, on="district_code")
    assert len(m) == config.N_TOWNS
    assert (m.director_ratio.round(2) == m.average_ratio.round(2)).all()


# ---------------------------------------------------------------- towns

def test_display_name_helpers():
    assert drop_type_word("Teaneck Twp") == "Teaneck"
    assert drop_type_word("Ridgefield Park Village") == "Ridgefield Park"
    assert title_name("HO-HO-KUS") == "Ho-Ho-Kus"
    assert title_name("TWP. OF WASHINGTON") == "Township of Washington"
    assert make_slug("Franklin Lakes") == "franklin-lakes"
    assert make_slug("Ho-Ho-Kus") == "ho-ho-kus"


def test_towns_csv_is_complete_and_unique():
    towns = pd.read_csv(config.TOWNS_CSV, dtype={"district_code": str})
    assert len(towns) == config.N_TOWNS
    for col in ["district_code", "display_name", "slug"]:
        assert towns[col].is_unique, col
    assert towns.set_index("district_code").at["0220", "slug"] == "franklin-lakes"
    assert towns.set_index("district_code").at["0266", "slug"] == "washington-township"


def test_every_district_code_appears_in_towns_csv():
    known = set(pd.read_csv(config.TOWNS_CSV, dtype={"district_code": str})["district_code"])
    paths = [config.CH123_CSV[2027], config.CH123_CSV[2026], config.DIR_RATIOS_CSV,
             config.STATE_COD_CSV, config.TAX_RATES_CSV, config.AVG_RES_CSV,
             config.REVALUATION_TOWNS_CSV]
    for path in paths:
        codes = set(pd.read_csv(path, dtype={"district_code": str})["district_code"])
        assert codes <= known, (path.name, codes - known)
    if config.SR1A_PARQUET.exists():
        codes = set(pd.read_parquet(config.SR1A_PARQUET, columns=["district_code"])["district_code"])
        assert codes <= known, ("sr1a_bergen.parquet", codes - known)


# ---------------------------------------------------------------- whole-file checks (need the parquet)

needs_parquet = pytest.mark.skipif(not config.SR1A_PARQUET.exists(),
                                   reason="run pipeline.parse_sr1a first")


@needs_parquet
def test_parquet_dates_are_all_possible_and_in_range():
    df = pd.read_parquet(config.SR1A_PARQUET, columns=["source_file", "recorded_date", "deed_date"])
    assert df["recorded_date"].notna().all()
    assert df["deed_date"].notna().all()
    s26 = df[df.source_file == "Sales2026"]
    assert s26.recorded_date.min() == pd.Timestamp("2025-07-01")
    assert s26.recorded_date.max() == pd.Timestamp("2026-06-30")


@needs_parquet
def test_parquet_has_no_private_columns():
    cols = pd.read_parquet(config.SR1A_PARQUET).columns
    assert not any(k in c for c in cols for k in ("grantor", "grantee", "location", "operator"))


@needs_parquet
def test_v1_sales2026_counts_match_state_counts():
    """Methodology V1: class-2 usable counts per town equal the state's counts."""
    df = pd.read_parquet(config.SR1A_PARQUET)
    s = df[(df.source_file == "Sales2026") & (df.property_class == config.RESIDENTIAL_CLASS)
           & (df.un_type == "U")]
    ours = s.groupby("district_code").size()
    cod = pd.read_csv(config.STATE_COD_CSV, dtype={"district_code": str})
    state = cod[cod.year == 2026].set_index("district_code")["n_class2"].fillna(0)
    avg = pd.read_csv(config.AVG_RES_CSV, dtype={"district_code": str}).set_index("district_code")["n_sales"]
    ours = ours.reindex(state.index, fill_value=0)
    assert (ours == state).all()
    assert (ours == avg.reindex(state.index)).all()
    assert ours.sum() == 4917


@needs_parquet
def test_total_assessment_equals_main_plus_extra_lots():
    df = pd.read_parquet(config.SR1A_PARQUET)
    extra = df[[f"addl_av_total_{i}" for i in range(1, 6)]].fillna(0).sum(axis=1)
    assert (df.total_assessment == df.av_total + extra).all()
