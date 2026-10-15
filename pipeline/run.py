"""Run the whole FairAssess NJ pipeline, stage by stage, in order.

Usage from PowerShell (in the project folder):
    .\\.venv\\Scripts\\python -m pipeline.run          # every stage
    .\\.venv\\Scripts\\python -m pipeline.run clean    # start at the "clean" stage

Stages so far: parse -> clean -> stats -> validate. Later prompts add more stages to STAGES.
"""

import sys

from pipeline import (build_stats, build_towns, clean, config, parse_ch123, parse_sr1a, parse_state_tables,
                      profile_data, validate)


def parse_stage():
    """Read the raw state files into tables, then write the data profile."""
    parse_sr1a.main()
    parse_ch123.main()
    parse_state_tables.main()
    build_towns.main()
    profile_data.main()


def parse_inputs():
    """Raw files the parse stage needs."""
    sr1a = [config.RAW_SR1A_DIR / spec["zip"] for spec in config.SR1A_FILES]
    state = [*config.CH123_PDFS.values(), config.DIR_RATIOS_XLSX, config.COD_PDF,
             config.GTR_XLSX, config.AVG_RES_PDF, *config.TEV_PDFS.values()]
    reference = [config.SR1A_LAYOUT_PDF, config.NONUSABLE_CODES_CSV, config.REVALUATION_TOWNS_CSV]
    return sr1a + state + reference


def clean_inputs():
    """Files the clean stage needs (made by the parse stage, plus the reval list)."""
    return [config.SR1A_PARQUET, config.TOWNS_CSV, config.REVALUATION_TOWNS_CSV]


def stats_inputs():
    """Files the stats stage needs (made by the clean and parse stages)."""
    return [config.SALES_CLEAN_CSV, config.REMOVED_ROWS_PARQUET, config.TOWNS_CSV,
            config.CH123_CSV[config.CH123_TAX_YEAR]]


def validate_inputs():
    """Files the validate stage needs (made by the parse, clean, and stats stages)."""
    return [config.SR1A_PARQUET, config.SALES_CLEAN_CSV, config.TOWNS_CSV, config.TOWN_STATS_CSV,
            config.CH123_CSV[config.CH123_TAX_YEAR], config.STATE_COD_CSV, config.AVG_RES_CSV,
            config.DIR_RATIOS_CSV, config.TEV_CSV]


# (name, function, files that must exist before the stage runs)
STAGES = [
    ("parse", parse_stage, parse_inputs),
    ("clean", clean.main, clean_inputs),
    ("stats", build_stats.main, stats_inputs),
    ("validate", validate.main, validate_inputs),
]


def missing_files(paths):
    """Return the paths in the list that do not exist."""
    return [p for p in paths if not p.exists()]


def main(argv=None):
    """Run every stage from the chosen start stage. Stop if an input file is missing."""
    argv = sys.argv[1:] if argv is None else argv
    names = [name for name, _, _ in STAGES]
    start = argv[0] if argv else names[0]
    if start not in names:
        sys.exit(f"Unknown stage '{start}'. Choose one of: {', '.join(names)}")
    for name, run_stage, inputs in STAGES[names.index(start):]:
        missing = missing_files(inputs())
        if missing:
            listed = "\n".join(f"  - {p.relative_to(config.ROOT)}" for p in missing)
            sys.exit(f"STOPPED before stage '{name}': {len(missing)} input file(s) missing:\n{listed}\n"
                     "Download or rebuild them, then run the pipeline again.")
        print(f"\n=== Stage: {name} ===")
        run_stage()
    print("\nPipeline finished.")


if __name__ == "__main__":
    main()
