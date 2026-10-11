import { KENNIS_PAGE } from "@rv/content/kennis";

interface TableOfContentsProps {
  items: readonly { id: string; label: string }[];
}

/** Inhoudsopgave met ankerlinks naar de h2's van het artikel. */
export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav aria-labelledby="toc-titel">
      <p id="toc-titel" className="text-eyebrow font-semibold uppercase text-ink-muted">
        {KENNIS_PAGE.tocLabel}
      </p>
      <ol className="mt-4 border-t border-line">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-line">
            <a
              href={`#${item.id}`}
              className="group flex items-baseline gap-3 py-3 text-sm text-ink-soft transition-colors duration-300 hover:text-ink"
            >
              <span className="font-display text-xs text-ink-muted transition-colors group-hover:text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="transition-transform duration-300 ease-calm group-hover:translate-x-0.5">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
