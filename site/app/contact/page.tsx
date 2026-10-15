import type { Metadata } from "next";
import { Mail, MessageSquareWarning, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { WaitlistForm } from "@/components/WaitlistForm";
import { REPORT_PROBLEM_URL } from "@/lib/nav";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Contact | Fair Assess NJ" };

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/**
 * Contact page in T&T's Contact structure: the sign-up form ("Get Updates",
 * at #updates) beside the contact details.
 */
export default function ContactPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        intro="Questions, corrections, or ideas? Here is how to reach Fair Assess NJ."
      />

      <section id="updates" className="scroll-mt-24 bg-white">
        <Reveal group className="mx-auto grid max-w-content gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow text-blue-600">Get Updates</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-navy-900">
              Get an email when the tools launch
            </h2>
            <div className="mt-6">
              <WaitlistForm source="contact" />
              <p className="mt-4 text-sm text-ink-600">
                Free. No spam. We only use your email to tell you when the
                checker launches.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-8">
            <li className="flex gap-4">
              <Mail aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-blue-600" strokeWidth={2} />
              <div>
                <h2 className="font-heading text-lg font-bold text-navy-900">Email</h2>
                <p className="mt-1 text-base">
                  <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <MessageSquareWarning aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-blue-600" strokeWidth={2} />
              <div>
                <h2 className="font-heading text-lg font-bold text-navy-900">Report a data problem</h2>
                <p className="mt-1 text-base text-ink-600">
                  Found a number that looks wrong?{" "}
                  <a href={REPORT_PROBLEM_URL} className={LINK} rel="noopener noreferrer">
                    Open a short report on GitHub
                  </a>
                  . Please don&rsquo;t include your name or home address.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Newspaper aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-blue-600" strokeWidth={2} />
              <div>
                <h2 className="font-heading text-lg font-bold text-navy-900">Press and partnerships</h2>
                <p className="mt-1 text-base text-ink-600">
                  Email{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </li>
          </ul>
        </Reveal>
      </section>
    </main>
  );
}
