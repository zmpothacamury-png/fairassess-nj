import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// The waitlist (components/WaitlistForm.tsx) is the only request to another site.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";

/**
 * Content-Security-Policy (Prompt 14). Pages are static (built ahead of time),
 * so this uses the Next.js "without nonces" setup: inline scripts are allowed
 * for Next.js's own page data and the reveal script in app/layout.tsx.
 * - Fonts, images, KaTeX, and the data files all come from this site.
 * - Vercel Web Analytics loads from this site in production (/_vercel/insights);
 *   only `next dev` uses its debug script from va.vercel-scripts.com.
 * - In dev, React needs 'unsafe-eval'; it is never allowed in production.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}${isDev ? " https://va.vercel-scripts.com" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Pipeline JSON: browsers keep it 10 minutes; Vercel's CDN keeps it until the next deploy (each deploy starts a fresh cache).
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=600, s-maxage=31536000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
