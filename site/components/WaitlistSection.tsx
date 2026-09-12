import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";
import { Reveal } from "./Reveal";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="scroll-mt-20 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="grid gap-10 border border-slate/20 bg-mist p-8 sm:p-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Image
              src="/logo-icon.png"
              alt=""
              width={28}
              height={46}
              className="h-8 w-auto"
            />
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate">
              Stay in the loop
            </p>
            <h2 className="mt-2 max-w-[24ch] font-serif text-2xl text-ink sm:text-3xl">
              Be notified when the checker launches.
            </h2>
            <p className="mt-3 max-w-[46ch] text-base text-slate">
              Enter your email. We&rsquo;ll send one message when the free
              appeal checker is ready &mdash; no spam before or after that.
            </p>
          </div>

          <div>
            <WaitlistForm source="footer" />
            <p className="mt-3 text-sm text-slate">
              Free. No spam. We only use your email to tell you when the
              checker launches.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
