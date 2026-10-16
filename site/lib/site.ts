/**
 * Site-wide facts that more than one page needs.
 *
 * SITE_URL: on Vercel, VERCEL_PROJECT_PRODUCTION_URL is set automatically to
 * the production domain (it switches to a custom domain on its own once one
 * is added in Vercel). The fallback is used for local builds.
 */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://fairassessnj.vercel.app";

export const GITHUB_URL = "https://github.com/zmpothacamury-png/fairassess-nj";

/** Public project email (Zaden, 2026-10-14). */
export const CONTACT_EMAIL = "fairassessnj@gmail.com";

/** The site's name. Every page's browser tab shows exactly this (Zaden, 2026-10-15). */
export const SITE_NAME = "Fair Assess NJ";
