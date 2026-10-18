import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Montserrat, Public_Sans } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealController } from "@/components/RevealController";
import { ScrollCue } from "@/components/ScrollCue";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { motionCssVars } from "@/lib/motion";
import { jsonLdScript, webApplicationJsonLd } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Headings and eyebrows: Montserrat, to match the logo's geometric wordmark.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// Body text and UI: Public Sans, the U.S. Web Design System's typeface (Prompt 10B; replaced Inter).
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Zaden: the browser tab always reads "Fair Assess NJ" (with the logo icon), on every page.
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, type: "website" },
  twitter: { card: "summary_large_image" },
};

/*
 * Turns on the reveal's hidden starting state, before the first paint, only
 * when JavaScript runs (T&T index.html:12). Without JavaScript, nothing hides.
 */
const ENABLE_REVEAL = "document.documentElement.classList.add('has-reveal')";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${publicSans.variable} h-full`}
      style={motionCssVars as CSSProperties}
      // The script above adds a class before React loads; that is expected.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ENABLE_REVEAL }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(webApplicationJsonLd(SITE_DESCRIPTION)) }} />
      </head>
      <body className="flex min-h-full flex-col bg-mist-50 font-sans text-base text-ink-800 antialiased">
        {/* First stop for keyboard users: jumps past the header to the page content. */}
        <a
          href="#main-content"
          className="focus-ring sr-only z-50 rounded-control bg-white px-4 py-2 font-semibold text-blue-600 shadow-raised focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Header />
        {/* Skip-link target, right before every page's <main>. */}
        <div id="main-content" tabIndex={-1} className="scroll-mt-24 outline-none" />
        {children}
        <Footer />
        <ScrollCue />
        <RevealController />
        {/* Only on Vercel, where the analytics script exists; local builds would get a 404 for it. */}
        {process.env.VERCEL && <SiteAnalytics />}
      </body>
    </html>
  );
}
