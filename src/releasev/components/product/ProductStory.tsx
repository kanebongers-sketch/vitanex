import Image from "next/image";
import { IMAGES } from "@rv/config/images";
import { SITE } from "@rv/config/site";
import { COMPARISON, CREDENTIALS_STRIP, SYSTEM_BLOCK, type ComparisonValue } from "@rv/content/product-page";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { cn } from "@rv/lib/cn";

/** "Kit + programma = een systeem": beeld links, drie genummerde pijlers met dunne lijnen. */
export function SystemPillars() {
  return (
    <section aria-labelledby="systeem" className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col lg:col-span-5">
        <Eyebrow index="03">{SYSTEM_BLOCK.eyebrow}</Eyebrow>
        <h2 id="systeem" className="mt-5 font-display text-display-lg uppercase text-balance">
          {SYSTEM_BLOCK.title}
        </h2>
        <p className="mt-6 max-w-[34rem] text-ink-soft leading-relaxed">{SYSTEM_BLOCK.lead}</p>
        <div className="group relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-card bg-surface lg:block">
          <Image
            src={IMAGES.stretchBw.src}
            alt={IMAGES.stretchBw.alt}
            fill
            sizes="40vw"
            className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
          />
        </div>
      </div>

      <ol className="flex flex-col border-t border-line lg:col-span-7 lg:self-end">
        {SYSTEM_BLOCK.pillars.map((pillar, index) => (
          <Reveal
            as="li"
            key={pillar.title}
            delay={index * 0.08}
            className="grid grid-cols-[4.5rem_1fr] gap-x-4 border-b border-line py-8 sm:grid-cols-[7rem_1fr] sm:py-10"
          >
            <span
              aria-hidden
              className={cn(
                "font-display text-5xl font-extrabold leading-none tracking-tight tabular-nums sm:text-6xl",
                index === 1 ? "text-accent" : "text-ink-muted/50",
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-3">
              <h3 className="font-display text-2xl leading-tight sm:text-3xl">{pillar.title}</h3>
              <p className="max-w-[34rem] text-ink-soft leading-relaxed">{pillar.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
      <CredentialsStrip />
    </section>
  );
}

/** Compacte "Ontwikkeld door"-strip met de feiten uit SITE.trainer.credentials. */
function CredentialsStrip() {
  return (
    <div className="grid gap-6 lg:col-span-12 lg:grid-cols-12 lg:gap-16 lg:border-t lg:border-line lg:pt-8">
      <div className="flex flex-col gap-2 lg:col-span-5">
        <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {CREDENTIALS_STRIP.label}
        </p>
        <p className="max-w-[26rem] text-sm leading-relaxed text-ink-soft">{SITE.trainer.role}</p>
      </div>
      <ul className="grid grid-cols-3 lg:col-span-7">
        {SITE.trainer.credentials.map((credential, index) => (
          <li key={credential.label} className={cn("flex min-w-0 flex-col gap-1.5 pr-2", index > 0 && "border-l border-line pl-3 sm:pl-6")}>
            <span className="font-display text-xl font-extrabold leading-none tracking-tight sm:text-4xl">{credential.value}</span>
            <span className="text-xs leading-snug text-ink-muted sm:text-sm">{credential.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const VALUE_LABEL: Record<ComparisonValue, string> = { ja: "Ja", nee: "Nee", deels: "Deels" };

function ValueMark({ value, isHighlight }: { value: ComparisonValue; isHighlight: boolean }) {
  if (value === "ja") {
    return (
      <svg
        viewBox="0 0 16 16"
        className={cn("mx-auto size-5", isHighlight ? "text-on-ink" : "text-ink-soft")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        role="img"
        aria-label={VALUE_LABEL.ja}
      >
        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (value === "nee") {
    return (
      <span className="text-ink-muted">
        <span aria-hidden>×</span>
        <span className="sr-only">{VALUE_LABEL.nee}</span>
      </span>
    );
  }
  return <span className={cn("text-xs font-medium", isHighlight ? "text-on-ink-muted" : "text-ink-muted")}>{VALUE_LABEL.deels}</span>;
}

/** Kwalitatieve vergelijking zonder merknamen of prijzen van anderen. Past op 375px zonder scroll. */
export function Comparison() {
  const lastRow = COMPARISON.rows.length - 1;
  return (
    <section aria-labelledby="vergelijk" className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-4">
        <Eyebrow index="04">{COMPARISON.eyebrow}</Eyebrow>
        <h2 id="vergelijk" className="mt-5 font-display text-display-lg uppercase">
          {COMPARISON.title}
        </h2>
        <p className="mt-6 max-w-[24rem] text-ink-soft leading-relaxed">
          {COMPARISON.lead}
        </p>
      </div>
      <div className="lg:col-span-8">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs sm:text-sm">
          <caption className="sr-only">Vergelijking van deze kit met losse tools en zelf online zoeken</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[40%] pb-4">
                <span className="sr-only">Kenmerk</span>
              </th>
              {COMPARISON.columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "px-1 pb-4 pt-5 text-center align-bottom font-semibold leading-tight sm:px-3",
                    index === 0 ? "rounded-t-card bg-ink font-display text-sm uppercase text-on-ink sm:text-base" : "text-ink-muted",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row, rowIndex) => (
              <tr key={row.label}>
                <th scope="row" className="border-t border-line py-4 pr-3 font-normal leading-snug text-ink sm:py-5 sm:pr-6">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={COMPARISON.columns[index]}
                    className={cn(
                      "px-1 py-4 text-center sm:px-3 sm:py-5",
                      index === 0 ? "border-t border-on-ink/10 bg-ink" : "border-t border-line",
                      index === 0 && rowIndex === lastRow && "rounded-b-card",
                    )}
                  >
                    <ValueMark value={value} isHighlight={index === 0} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
