import Link from "next/link";

export interface Crumb {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: readonly Crumb[];
}

/** Zichtbare kruimelpad-navigatie; het laatste item is de huidige pagina. */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Kruimelpad">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-line">
                  /
                </span>
              )}
              {isCurrent ? (
                <span aria-current="page" className="truncate text-ink-soft">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="link-underline transition-colors hover:text-ink">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
