import { cn } from "@rv/lib/cn";
import { LOGO_TRANSFORM, LOGO_V_PATH, LOGO_VIEWBOX, LOGO_WORD_PATH } from "./logo-paths";

/**
 * Het RELEASE V-woordmerk als SVG. "RELEASE" volgt de tekstkleur (currentColor),
 * de V is altijd signaaloranje. Hoogte bepaal je met een klasse, bijv. `h-5`.
 */
export function Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={cn("block w-auto", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g transform={LOGO_TRANSFORM}>
        <path fill="currentColor" d={LOGO_WORD_PATH} />
        <path className="fill-accent" d={LOGO_V_PATH} />
      </g>
    </svg>
  );
}
