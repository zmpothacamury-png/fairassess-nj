"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { buttonClasses } from "./Button";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Postgres error code for a unique-constraint violation. A duplicate email
// is treated the same as a new signup so we never reveal who already
// signed up.
const UNIQUE_VIOLATION = "23505";

type Status = "idle" | "loading" | "success" | "error";

/**
 * "Get updates" email signup form (the Supabase waitlist table). Lives on the
 * Contact page at #updates. `source` records where people signed up; "hero"
 * and "footer" are kept because older rows use them.
 */
export function WaitlistForm({ source }: { source: "hero" | "footer" | "contact" }) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Real visitors never fill this in. Bots that auto-fill every field do.
    if (honeypot) {
      setStatus("success");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setFieldError("Enter a valid email address, like name@example.com.");
      return;
    }

    setFieldError("");
    setStatus("loading");

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase(), source });

    if (error && error.code !== UNIQUE_VIOLATION) {
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="flex gap-2 rounded-card border-l-4 border-green-600 bg-green-100 px-4 py-3 text-base text-navy-900"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={2} />
        <span>
          You&rsquo;re signed up. We&rsquo;ll email you about new towns and
          appeal season reminders.
        </span>
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="relative flex-1">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${inputId}-error` : undefined}
          className="focus-ring min-h-12 w-full rounded-control border border-ink-600 bg-white px-4 py-2 text-base text-ink-800 placeholder:text-ink-600"
        />
        {/* Honeypot field: hidden from sighted users, visible to bots that fill every field. */}
        <input
          type="text"
          name="company"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-0 top-0 h-0 w-0 opacity-0"
        />
        {fieldError && (
          <p id={`${inputId}-error`} className="mt-2 flex gap-1.5 text-sm text-navy-900">
            <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" strokeWidth={2} />
            {fieldError}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className={`${buttonClasses("primary", "md")} whitespace-nowrap`}
      >
        {status === "loading" ? "Signing up…" : "Get updates"}
      </button>
      {status === "error" && (
        <p role="alert" className="flex gap-1.5 text-sm text-navy-900 sm:basis-full">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" strokeWidth={2} />
          Something went wrong on our end. Please try again in a minute.
        </p>
      )}
    </form>
  );
}
