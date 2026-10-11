import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_NAV, SITE } from "@rv/config/site";
import { Eyebrow } from "@rv/components/ui/Eyebrow";

/**
 * Gedeelde opmaak voor juridische pagina's. De teksten staan in
 * src/content/legal/*.ts als gestructureerde data (geen HTML-strings),
 * zodat alles veilig en consistent wordt gerenderd.
 */
export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "definitions"; items: readonly { term: string; description: string }[] }
  | { kind: "form"; title: string; lines: readonly string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  path: string;
  title: string;
  description: string;
  intro: string;
  updated: string;
  sections: readonly LegalSection[];
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "definitions":
      return (
        <dl className="divide-y divide-line border-y border-line">
          {block.items.map((item) => (
            <div key={item.term} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="font-medium text-ink">{item.term}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      );
    case "form":
      return (
        <figure className="rounded-card border border-dashed border-ink/25 bg-surface p-6 sm:p-8">
          <figcaption className="font-display text-xl font-bold text-ink">{block.title}</figcaption>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            {block.lines.map((line, i) => (
              <p key={`${i}-${line}`}>{line}</p>
            ))}
          </div>
        </figure>
      );
  }
}

function ConceptNotice({ updated }: { updated: string }) {
  return (
    <div role="note" className="mt-10 flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft px-5 py-4 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-3">
        <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
        <span>
          <strong className="font-semibold">Concepttekst.</strong> Laat deze tekst controleren door een jurist voordat de webshop live gaat.
        </span>
      </p>
      <p className="shrink-0 text-ink-soft">Laatst bijgewerkt: {updated}</p>
    </div>
  );
}

function TableOfContents({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <nav aria-label="Inhoudsopgave" className="text-sm">
      <p className="text-eyebrow font-semibold uppercase text-ink-muted">Inhoud</p>
      <ol className="mt-4 border-l border-line">
        {sections.map((section, i) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-ink-soft transition-colors duration-300 hover:border-accent hover:text-ink">
              <span className="w-5 shrink-0 font-display text-xs font-bold leading-5 tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RelatedLinks({ currentPath }: { currentPath: string }) {
  return (
    <nav aria-label="Overige juridische informatie" className="mt-10 border-t border-line pt-6 text-sm">
      <ul className="space-y-2">
        {LEGAL_NAV.filter((item) => item.href !== currentPath).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="link-underline text-ink-soft hover:text-ink">{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <article aria-labelledby="juridisch-titel">
      <header className="max-w-4xl border-b border-line pb-12">
        <Eyebrow>{`Juridisch · ${SITE.brandName}`}</Eyebrow>
        <h1 id="juridisch-titel" className="mt-6 font-display text-display-lg uppercase">{document.title}</h1>
        <p className="mt-6 max-w-prose text-lead text-ink-soft">{document.intro}</p>
        <ConceptNotice updated={document.updated} />
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <TableOfContents sections={document.sections} />
            <RelatedLinks currentPath={document.path} />
          </div>
        </aside>
        <div className="max-w-prose space-y-16 lg:col-span-8 lg:col-start-5">
          {document.sections.map((section, i) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titel`} className="scroll-mt-28">
              <h2 id={`${section.id}-titel`} className="flex items-baseline gap-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="font-display text-sm font-bold tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <div className="mt-6 space-y-5 leading-[1.75] text-ink-soft">
                {section.blocks.map((block, j) => (
                  <Block key={`${section.id}-${j}`} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

/** Bouwt de metadata voor een juridische pagina op uit het document. */
export function legalMetadata(document: LegalDocument): Metadata {
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: document.path },
  };
}
