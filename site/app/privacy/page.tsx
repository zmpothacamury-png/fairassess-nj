import { Ban, Calculator, Lock, Mail, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Band, LINK } from "@/components/content/blocks";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  description:
    "Fair Assess NJ's privacy page: the appeal checker runs in your browser and saves nothing; the only thing we store is your email if you join the updates list. Page visits are counted without cookies.",
});

const LAST_UPDATED = "October 18, 2026";

/**
 * Privacy, in plain language. Every statement here describes what the code
 * does (CLAUDE.md rule 3): the checker's only request is the public town file
 * (lib/checker/load-town.ts); the waitlist stores email, source, and date
 * (supabase/schema.sql) behind Row Level Security that allows insert only;
 * Vercel Web Analytics counts page views only, with the ?query and #hash
 * removed (app/layout.tsx, lib/analytics.ts; facts: data/raw/notes/
 * vercel-web-analytics.md). Update this page if any of that changes.
 */
export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Privacy"
        title="Privacy"
        intro="What this site collects, and what it never collects. The short version: the appeal checker saves nothing, and the only thing we store is your email, if you ask for updates."
        meta={<p className="text-sm text-ink-800">Last updated: {LAST_UPDATED}</p>}
      />

      <Band>
        <div className="mx-auto flex max-w-3xl flex-col divide-y divide-outline-200">
          <Item Icon={Calculator} title="The appeal checker">
            <p>
              The checker runs entirely in your browser. Nothing you type (your town, your assessed value, or your own
              estimate) is sent to us, saved, or logged. It is never put in the web address.
            </p>
            <p>
              To check your home, your browser downloads one public file: the sales for the town you picked. That file is
              the same for every visitor and carries no dollar amounts. Our web host can see which town&rsquo;s file was
              loaded, the same as when you visit that town&rsquo;s page.
            </p>
            <p>&ldquo;Print or save this result&rdquo; happens on your own device. We never see the printout.</p>
          </Item>

          <Item Icon={Mail} title="The updates list">
            <p>
              If you join the{" "}
              <Link href="/contact#updates" className={LINK}>
                updates list
              </Link>
              , we store three things: your email address, which page you signed up on, and the date. They are stored with
              Supabase, a database service.
            </p>
            <p>
              We use your email only to send Fair Assess NJ updates: new towns and appeal season reminders. The website can
              add an email to the list but can&rsquo;t read the list back. To be removed, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                {CONTACT_EMAIL}
              </a>{" "}
              and we&rsquo;ll delete your address.
            </p>
          </Item>

          <Item Icon={Server} title="Analytics and cookies">
            <p>
              We count page visits with Vercel Web Analytics, run by our web host. For each visit it gets the page&rsquo;s
              address, the site you came from, your rough location, and your browser and device type. We send only the
              page&rsquo;s path, never anything after a &ldquo;?&rdquo; or &ldquo;#&rdquo; in the address.
            </p>
            <p>
              It sets no cookies. Instead, it tells visitors apart with a code made from the page request, and that code is
              thrown away after 24 hours. We only see totals, like how many people opened the Town Rankings page. Source:{" "}
              <a href={SOURCES.vercel_analytics.url} className={LINK} rel="noopener noreferrer">
                {SOURCES.vercel_analytics.label}
              </a>
              .
            </p>
            <p>
              Analytics never sees what you type in the checker. We send no custom events, only page views. No other
              analytics or tracking tools are used.
            </p>
            <p>Like any website, our host receives your browser&rsquo;s requests for pages and files so it can deliver them.</p>
          </Item>

          <Item Icon={Ban} title="No ads. No selling.">
            <p>There are no ads on this site. We never sell, rent, or share your information.</p>
          </Item>

          <Item Icon={Lock} title="Reporting a data problem">
            <p>
              Data problem reports go to{" "}
              <a href={GITHUB_URL} className={LINK} rel="noopener noreferrer">
                our public GitHub page
              </a>
              , where anyone can read them. Please don&rsquo;t include your name, home address, or assessed value.
            </p>
          </Item>
        </div>
      </Band>

      <CtaBand
        title="Questions about privacy?"
        text={`Email ${CONTACT_EMAIL}.`}
        href="/contact"
        label="Contact"
      />
    </main>
  );
}

function Item({ Icon, title, children }: { Icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-4 py-8 first:pt-0 last:pb-0 sm:gap-6">
      <Icon aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-blue-600" strokeWidth={2} />
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-bold text-navy-900">{title}</h2>
        <div className="mt-2 flex max-w-prose flex-col gap-3 text-base text-ink-800">{children}</div>
      </div>
    </section>
  );
}
