import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FairAssess NJ",
  description:
    "A public, reproducible study of whether New Jersey towns over-assess lower-priced homes, plus a free homeowner tax-appeal checker.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          FairAssess NJ provides public-data analysis for educational
          purposes. It is not legal advice, tax advice, or an appraisal.
          Homeowners file and present their own appeals. Check your county
          board for current deadlines, fees, and forms.
        </footer>
      </body>
    </html>
  );
}
