import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";
import { Reveal } from "./Reveal";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="scroll-mt-24 bg-mist-50">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal className="split-accent grid gap-10 rounded-card border border-outline-200 bg-white p-8 shadow-soft sm:p-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Image
              src="/logo-icon.png"
              alt=""
              width={394}
              height={698}
              className="h-12 w-auto"
            />
            <p className="eyebrow mt-4 text-blue-600">Stay in the loop</p>
            <h2 className="mt-2 max-w-[24ch] font-heading text-2xl font-bold text-navy-900">
              Be notified when the checker launches.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base text-ink-600">
              Enter your email. We&rsquo;ll send one message when the free
              appeal checker is ready. We won&rsquo;t send spam before or
              after that.
            </p>
          </div>

          <div>
            <WaitlistForm source="footer" />
            <p className="mt-4 text-sm text-ink-600">
              Free. No spam. We only use your email to tell you when the
              checker launches.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
