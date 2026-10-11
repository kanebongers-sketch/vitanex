import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { cn } from "@rv/lib/cn";
import type { SectionIntro } from "@rv/content/home";

interface SectionHeadingProps {
  id: string;
  intro: SectionIntro;
  tone?: "default" | "inverted";
  /** Grote statements in kapitalen */
  isStatement?: boolean;
  className?: string;
}

/** Genummerd sectiekopje: eyebrow, h2 en optionele lead. */
export function SectionHeading({ id, intro, tone = "default", isStatement = false, className }: SectionHeadingProps) {
  const isInverted = tone === "inverted";
  return (
    <div className={cn("max-w-3xl", className)}>
      <Eyebrow index={intro.index} tone={tone}>
        {intro.eyebrow}
      </Eyebrow>
      <h2 id={id} className={cn("mt-6 font-display text-display-lg text-balance", isStatement && "uppercase")}>
        {intro.title}
      </h2>
      {intro.lead && (
        <p className={cn("mt-6 max-w-[34rem] text-lead", isInverted ? "text-on-ink-muted" : "text-ink-soft")}>
          {intro.lead}
        </p>
      )}
    </div>
  );
}
