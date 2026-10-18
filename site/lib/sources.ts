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
    label: "NJ Form A-1, Petition of Appeal (with instructions)",
    url: "https://nj.gov/treasury/taxation/pdf/other_forms/lpt/petappl.pdf",
  },
  /** Bergen County Board of Taxation. Note: appeal-deadlines-and-fees.md */
  bergen_board: {
    label: "Bergen County Board of Taxation",
    url: "https://bergencountynj.gov/boards-commissions/about-board-of-taxation/",
  },
  /** Bergen's online appeal filing, linked from the Board's page. Note: appeal-deadlines-and-fees.md */
  bergen_online_filing: {
    label: "Bergen County online tax appeal filing",
    url: "https://www.taxappeal-nj.com/cgi-bin/index.cgi",
  },
  /** Bergen paper petition form ("hand delivered or mailed only"). Note: appeal-info.md */
  bergen_paper_form: {
    label: "Bergen County paper petition of appeal",
    url: "https://bergencountynj.gov/wp-content/uploads/2023/07/Petition_of_Appeal-newest.pdf",
  },
  /** Linked from the Bergen Board page as "Bergen County Property Record Search". Note: appeal-info.md section 10 */
  bergen_property_search: {
    label: "Bergen County Property Record Search",
    url: "https://taxrecords-nj.com/pub/cgi/prc6.cgi?district=0200&ms_user=ctb02",
  },
  /** Linked from the Bergen Board page. Note: appeal-info.md section 10 */
  bergen_hearing_dates_2025: {
    label: "Bergen County Board of Taxation, 2025 Tax Appeal Hearing Dates",
    url: "https://bergencountynj.gov/wp-content/uploads/2025/07/2025-Appeal-Dates-Spreadsheet.pdf",
  },
  /** State appeal web page (deadlines). Note: appeal-info.md */
  nj_appeal_page: {
    label: "NJ Division of Taxation, Appealing Your Property Tax Assessment",
    url: "https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml",
  },
  /** Comparable sales advice and burden of proof. Note: appeal-deadlines-and-fees.md */
  appeal_hearing_guide: {
    label: "NJ Division of Taxation, A Guide to Tax Appeal Hearings",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/ptappeal.pdf",
  },
  /** The state files behind every number (methodology 3.1). Note: state-data-sources.md */
  sales2026: { label: "SR1A sales file Sales2026.zip", url: "https://www.nj.gov/treasury/taxation/lpt/statdata/Sales2026.zip" },
  sales2025: { label: "SR1A sales file Sales2025.zip", url: "https://www.nj.gov/treasury/taxation/lpt/statdata/Sales2025.zip" },
  tev_2026: {
    label: "2026 Table of Equalized Valuations",
    url: "https://www.nj.gov/treasury/taxation/pdf/lptval/2026/2026TEV.pdf",
  },
  /** Note: methodology.md Section 3.1 (as amended by the Tax Court January 30, 2026). */
  tev_2025: {
    label: "2025 Table of Equalized Valuations",
    url: "https://www.nj.gov/treasury/taxation/pdf/lptval/2024/2025TEV.pdf",
  },
  dir_ratios: { label: "Director's ratio history", url: "https://www.nj.gov/treasury/taxation/lpt/tev/DirRatios.xlsx" },
  coefficient_deviations: {
    label: "Coefficients of deviation, 2023 to 2026",
    url: "https://www.nj.gov/treasury/taxation/pdf/lpt/CoefficientDeviations.pdf",
  },
  gtr_history: { label: "General tax rate history", url: "https://www.nj.gov/treasury/taxation/lpt/GTRhistory.xlsx" },
  /** IAAO ranges for COD, PRD, PRB. Note: ratio-study-standards.md */
  iaao: {
    label: "IAAO Standard on Ratio Studies, 2013",
    url: "https://www.audits2.ga.gov/wp-content/uploads/2024/08/Standard_on_Ratio_Studies.pdf",
  },
  /** How Vercel Web Analytics treats visitors (cookies, the daily hash, what is stored). Note: vercel-web-analytics.md */
  vercel_analytics: {
    label: "Vercel, Web Analytics privacy and compliance",
    url: "https://vercel.com/docs/analytics/privacy-policy",
  },
} as const;

export type SourceKey = keyof typeof SOURCES;
