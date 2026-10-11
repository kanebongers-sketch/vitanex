import type { FaqItem } from "@rv/lib/commerce/types";
import { cn } from "@rv/lib/cn";

interface FaqProps {
  items: readonly FaqItem[];
  className?: string;
}

/** Toegankelijke FAQ op basis van <details>: werkt zonder JavaScript en met toetsenbord. */
export function Faq({ items, className }: FaqProps) {
  return (
    <div className={cn("border-b border-line", className)}>
      {items.map((item) => (
        <details key={item.question} className="faq-item group border-t border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left outline-offset-4 sm:py-7">
            <span className="font-display text-lg font-bold leading-snug transition-colors duration-300 group-hover:text-ink-soft sm:text-xl">
              {item.question}
            </span>
            <span
              aria-hidden
              className="faq-icon flex size-6 shrink-0 items-center justify-center text-ink-muted transition-[transform,color] duration-500 ease-calm group-hover:text-accent group-open:text-accent"
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M8 1.5v13M1.5 8h13" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="max-w-[38rem] pb-8 pr-12 leading-relaxed text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
