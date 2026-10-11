import Link from "next/link";
import { PRODUCT_PATH } from "@rv/config/site";
import { KENNIS_TOOLS, type KennisToolId } from "@rv/content/kennis";
import { cn } from "@rv/lib/cn";

interface ToolChipProps {
  tool: KennisToolId;
  className?: string;
}

/** Tool uit de kit als chip; linkt naar de productpagina. */
export function ToolChip({ tool, className }: ToolChipProps) {
  return (
    <Link
      href={PRODUCT_PATH}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-medium text-ink transition-[background-color,color,border-color,transform] duration-300 ease-calm hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-on-ink",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {KENNIS_TOOLS[tool]}
    </Link>
  );
}

interface ToolChipsProps {
  tools: readonly KennisToolId[];
  label: string;
}

export function ToolChips({ tools, label }: ToolChipsProps) {
  return (
    <div>
      <p className="text-eyebrow font-semibold uppercase text-ink-muted">{label}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <li key={tool}>
            <ToolChip tool={tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}
