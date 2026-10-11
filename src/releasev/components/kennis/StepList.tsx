import type { KennisStep } from "@rv/content/kennis";
import { ToolChip } from "./ToolChip";

interface StepListProps {
  steps: readonly KennisStep[];
}

/** Genummerde stappen als blokken met dunne lijnen en grote cijfers. */
export function StepList({ steps }: StepListProps) {
  return (
    <ol className="mt-8 border-b border-line">
      {steps.map((step, index) => (
        <li key={step.title} className="grid grid-cols-[3.25rem_1fr] gap-x-4 border-t border-line py-7 sm:grid-cols-[4.5rem_1fr] sm:gap-x-6">
          <span aria-hidden className="font-display text-4xl font-extrabold leading-none tracking-tight text-ink-muted sm:text-5xl">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-snug sm:text-2xl">
              <span className="sr-only">Stap {index + 1}: </span>
              {step.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-surface-strong px-3 py-1.5 text-xs font-semibold text-ink">
                <span className="sr-only">Duur: </span>
                {step.dose}
              </span>
              <ToolChip tool={step.tool} />
            </div>
            <p className="mt-4 text-ink-soft">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
