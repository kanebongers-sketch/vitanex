import type { KennisSection } from "@rv/content/kennis";
import { StepList } from "./StepList";

interface ArticleSectionsProps {
  sections: readonly KennisSection[];
}

const H2 = "scroll-mt-28 font-display text-3xl font-bold leading-tight sm:text-4xl";

function SectionBody({ section }: { section: KennisSection }) {
  switch (section.kind) {
    case "text":
      return (
        <div className="mt-5 space-y-5">
          {section.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      );
    case "steps":
      return (
        <>
          {section.intro && <p className="mt-5">{section.intro}</p>}
          <StepList steps={section.steps} />
          {section.outro && <p className="mt-6">{section.outro}</p>}
        </>
      );
    case "mistakes":
      return (
        <ul className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
          {section.items.map((item) => (
            <li key={item.title} className="bg-canvas p-5 sm:p-6">
              <p className="flex items-start gap-3 font-semibold text-ink">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {item.title}
              </p>
              <p className="mt-2 pl-[1.125rem] text-sm">{item.text}</p>
            </li>
          ))}
        </ul>
      );
    case "caution":
      return (
        <div className="mt-6 rounded-card border border-line bg-surface p-6 sm:p-8">
          <div className="space-y-4">
            {section.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </div>
      );
  }
}

/** Rendert de getypeerde artikelsecties; elke sectie heeft een h2 met anker-id. */
export function ArticleSections({ sections }: ArticleSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="mt-14 first:mt-0 sm:mt-16">
          <h2 id={section.id} className={H2}>
            {section.kind === "caution" && (
              <span aria-hidden className="mr-3 inline-block size-2.5 rounded-full bg-accent align-middle" />
            )}
            {section.heading}
          </h2>
          <SectionBody section={section} />
        </section>
      ))}
    </>
  );
}

export const ARTICLE_H2_CLASS = H2;
