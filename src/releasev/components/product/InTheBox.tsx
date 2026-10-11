import Link from "next/link";
import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";

interface InTheBoxProps {
  /** Namen van de onderdelen, uit product.contents */
  items: readonly string[];
  className?: string;
}

/**
 * Compacte "In de doos"-lijst plus een laagdrempelige link voor vragen.
 * Maakt de waarde van €69 concreet op het beslismoment.
 */
export function InTheBox({ items, className }: InTheBoxProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <h2 className="text-eyebrow font-semibold uppercase text-ink-muted">In de doos</h2>
        <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-ink-soft sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-ink-muted">
        Vragen over de kit?{" "}
        <Link href="/contact" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-accent">
          Stel ze aan ons team
        </Link>
        . {SITE.contact.responseTime}
      </p>
    </div>
  );
}
