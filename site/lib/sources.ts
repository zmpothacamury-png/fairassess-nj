// Source links for outside facts shown on the site (CLAUDE.md rule 5).
// Each one is recorded in a note in data/raw/notes/ (named beside it).

export const SOURCES = {
  /** 2027 Chapter 123 average ratios and common level ranges. Note: state-data-sources.md */
  ch123_2027: {
    label: "NJ Division of Taxation, Chapter 123 ratios for tax year 2027",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/chap123/2027CH123.pdf",
  },
  /** Chapter 123 definitions and the 3 worked examples. Note: state-data-sources.md */
  ch123_definitions: {
    label: "NJ Division of Taxation, Chapter 123 definitions",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/chap123/ch123definitions.pdf",
  },
  /** 2026 average residential statistics. Note: state-data-sources.md */
  avg_residential_2026: {
    label: "NJ Division of Taxation, 2026 average residential statistics",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/class4/2026AvgResStat.pdf",
  },
  /** 2025 general tax rates. Note: state-data-sources.md */
  tax_rates_2025: {
    label: "NJ Division of Taxation, 2025 general tax rates",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/gtr/2025taxrates.pdf",
  },
  /** SR1A sales files (the sales behind every statistic). Note: state-data-sources.md */
  sr1a: {
    label: "NJ Division of Taxation, SR1A sales files",
    url: "https://www.nj.gov/treasury/taxation/lpt/statdata.shtml",
  },
  /** Non-usable sale categories, incl. category 27. Note: ratio-study-standards.md */
  nonusable_guidelines: {
    label: "NJ Division of Taxation, Guidelines for use of 36 Nonusable Categories (May 2025)",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/guidelines36.pdf",
  },
  /** How the Director computes the average ratio. Note: director-average-ratio-method.md */
  tax_court_method: {
    label: "NJ Tax Court, City of New Brunswick v. Director (January 2026)",
    url: "https://www.njcourts.gov/system/files/court-opinions/2026/10387-25.pdf",
  },
  /** County list of 2026 and 2027 revaluations/reassessments. Note: bergen-revaluations-2026-2027.md */
  bergen_revaluations: {
    label: "Bergen County Board of Taxation, 2026-2027 revaluations and reassessments",
    url: "https://bergencountynj.gov/wp-content/uploads/2026/01/2026-2027-Revaluations-and-Reassessments.pdf",
  },
  /** Deadline and fee rules. Note: appeal-deadlines-and-fees.md */
  form_a1: {
    label: "NJ Form A-1, Petition of Appeal (instructions 1 and 4)",
    url: "https://nj.gov/treasury/taxation/pdf/other_forms/lpt/petappl.pdf",
  },
  /** Bergen County Board of Taxation. Note: appeal-deadlines-and-fees.md */
  bergen_board: {
    label: "Bergen County Board of Taxation",
    url: "https://bergencountynj.gov/boards-commissions/about-board-of-taxation/",
  },
  /** IAAO ranges for COD, PRD, PRB. Note: ratio-study-standards.md */
  iaao: {
    label: "IAAO Standard on Ratio Studies, 2013",
    url: "https://www.audits2.ga.gov/wp-content/uploads/2024/08/Standard_on_Ratio_Studies.pdf",
  },
} as const;

export type SourceKey = keyof typeof SOURCES;
