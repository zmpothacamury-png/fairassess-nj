import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealController } from "@/components/RevealController";
import { ScrollCue } from "@/components/ScrollCue";
import { motionCssVars } from "@/lib/motion";
import { SITE_URL } from "@/lib/site";

// Headings and eyebrows: Montserrat, to match the logo's geometric wordmark.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// Body text and UI: Inter.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Fair Assess NJ",
  description:
    "A public, reproducible study of whether New Jersey towns over-assess lower-priced homes. It also offers a free tax-appeal checker for homeowners. Join the waitlist.",
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
      className={`${montserrat.variable} ${inter.variable} h-full`}
      style={motionCssVars as CSSProperties}
      // The script above adds a class before React loads; that is expected.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ENABLE_REVEAL }} />
      </head>
      <body className="flex min-h-full flex-col bg-mist-50 font-sans text-base text-ink-800 antialiased">
        <Header />
        {children}
        <Footer />
        <ScrollCue />
        <RevealController />
      </body>
    </html>
  );
}
