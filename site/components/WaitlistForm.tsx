"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Postgres error code for a unique-constraint violation. A duplicate email
// is treated the same as a new signup so we never reveal who already
// signed up.
const UNIQUE_VIOLATION = "23505";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Waitlist email signup form. Used in the hero and in the waitlist section,
 * with a different `source` label so we can tell which one people use.
 */
export function WaitlistForm({ source }: { source: "hero" | "footer" }) {
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
        className="rounded-sm border border-slate/20 border-l-4 border-l-gold bg-paper px-4 py-3 text-sm text-ink"
      >
        You&rsquo;re on the list. We&rsquo;ll email you when the checker
        launches.
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
          className="w-full rounded-sm border border-slate/40 bg-paper px-4 py-3 text-ink placeholder:text-slate/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
          <p id={`${inputId}-error`} className="mt-2 text-sm text-red-700">
            {fieldError}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="whitespace-nowrap rounded-sm border border-gold bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        {status === "loading" ? "Joining…" : "Join the waitlist"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-700 sm:basis-full">
          Something went wrong on our end. Please try again in a minute.
        </p>
      )}
    </form>
  );
}
