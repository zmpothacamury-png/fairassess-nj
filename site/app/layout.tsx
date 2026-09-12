import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FairAssess NJ",
  description:
    "A public, reproducible study of whether New Jersey towns over-assess lower-priced homes, plus a free homeowner tax-appeal checker. Join the waitlist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${sourceSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink antialiased">
        {children}
        <Footer />
      </body>
    </html>
  );
}
