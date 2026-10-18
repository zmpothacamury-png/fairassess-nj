"use client";

import "./globals.css";
import { Disclaimer } from "@/components/Disclaimer";
import { SITE_NAME } from "@/lib/site";

/**
 * Last-resort error page, used only if the site's layout itself breaks
 * (Prompt 14). It replaces the whole page, so it brings its own <html>,
 * styles, title, and the rule 4 disclaimer. Plain links, not client
 * navigation, so the visitor gets a fresh page.
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-mist-50 font-sans text-base text-ink-800 antialiased">
        <title>{SITE_NAME}</title>
        <main className="flex-1">
          <header className="split-accent bg-blue-100">
            <div className="mx-auto max-w-content px-6 pb-12 pt-14">
              <p className="eyebrow text-blue-600">Error</p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold text-navy-900">Something went wrong</h1>
              <p className="mt-4 max-w-prose text-lg text-ink-800">
                {SITE_NAME} did not load correctly. Nothing you typed was saved or sent. Try again, or go back to the home
                page.
              </p>
            </div>
          </header>
          <section className="bg-white">
            <div className="mx-auto flex max-w-content flex-wrap items-center gap-6 px-6 py-16">
              <button
                type="button"
                onClick={() => retry()}
                className="focus-ring min-h-12 rounded-control bg-blue-600 px-6 font-semibold text-white hover:bg-navy-700"
              >
                Try again
              </button>
              {/* A full page load on purpose: the app around this page is not working. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700">
                Home
              </a>
            </div>
          </section>
        </main>
        <footer className="bg-blue-100">
          <div className="mx-auto max-w-content px-6 py-10">
            <Disclaimer />
          </div>
        </footer>
      </body>
    </html>
  );
}
