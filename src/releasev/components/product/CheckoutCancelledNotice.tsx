"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Rustige melding na terugkeer uit Stripe zonder betaling (?checkout=geannuleerd).
 * Client-side zodat de productpagina statisch kan blijven.
 */
export function CheckoutCancelledNotice() {
  const searchParams = useSearchParams();
  const [isDismissed, setIsDismissed] = useState(false);
  if (searchParams.get("checkout") !== "geannuleerd" || isDismissed) return null;

  return (
    <div
      role="status"
      className="mb-8 flex items-start justify-between gap-4 rounded-card border border-line bg-accent-soft/60 px-5 py-4 text-sm text-ink"
    >
      <p>
        <span className="font-medium">De betaling is niet afgerond.</span>{" "}
        <span className="text-ink-soft">
          Er is niets afgeschreven en je winkelwagen staat nog klaar. Rond je bestelling af wanneer het jou uitkomt.
        </span>
      </p>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        aria-label="Melding sluiten"
        className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
