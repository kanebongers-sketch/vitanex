"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { NewsletterApiResponse } from "@rv/lib/newsletter-schema";

type Status = "idle" | "submitting" | "success" | "error";

/** Rustige nieuwsbriefinschrijving: max. een mail per maand, expliciete toestemming. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const emailId = useId();
  const consentId = useId();
  const statusId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    setStatus("submitting");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: hasConsent, website }),
      });
      const body = (await response.json().catch(() => null)) as NewsletterApiResponse | null;
      if (!response.ok || !body?.success) throw new Error(body && !body.success ? body.error : "Inschrijven lukt nu even niet.");
      setStatus("success");
      setMessage("Bijna klaar: check je inbox en bevestig je inschrijving via de link in de mail.");
    } catch (caught) {
      setStatus("error");
      setMessage(caught instanceof Error ? caught.message : "Inschrijven lukt nu even niet.");
    }
  };

  if (status === "success") {
    return <p role="status" className="text-sm text-ink">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-describedby={statusId}>
      <label htmlFor={emailId} className="text-sm font-semibold text-ink">
        Herstel-tips en nieuwe programma&apos;s, max. een mail per maand
      </label>
      <div className="flex gap-2">
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jij@voorbeeld.nl"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting" || !hasConsent || !email}
          className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-medium text-on-ink transition-colors hover:bg-accent disabled:opacity-50"
        >
          {status === "submitting" ? "Bezig…" : "Inschrijven"}
        </button>
      </div>
      <div aria-hidden className="absolute left-[-9999px]">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor={consentId} className="flex cursor-pointer items-start gap-2.5 text-xs leading-snug text-ink-muted">
        <input
          id={consentId}
          type="checkbox"
          checked={hasConsent}
          onChange={(event) => setHasConsent(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--rv-color-accent)]"
        />
        <span>
          Ik wil de nieuwsbrief ontvangen en ga akkoord met het{" "}
          <Link href="/privacybeleid" className="underline underline-offset-2 hover:text-ink">privacybeleid</Link>. Uitschrijven kan altijd.
        </span>
      </label>
      <p id={statusId} role="status" className="min-h-4 text-xs text-danger">
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}
