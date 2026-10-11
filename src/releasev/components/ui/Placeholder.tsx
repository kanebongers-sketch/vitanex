import Image from "next/image";
import { useId } from "react";
import { cn } from "@rv/lib/cn";

interface PlaceholderProps {
  /** Wat hier moet komen, bijv. "Productfoto: foam roller close-up" */
  label: string;
  /** Alt-tekst; wordt gebruikt voor de echte afbeelding en voor de placeholder */
  alt: string;
  kind?: "foto" | "video";
  /** Pad naar echte afbeelding in /public. Zodra ingevuld verdwijnt de placeholder */
  src?: string;
  /** CSS aspect-ratio, bijv. "4/5" of "16/9" */
  ratio?: string;
  tone?: "light" | "dark";
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * Neutrale, duidelijk gemarkeerde placeholder voor beeld en video.
 * Vervangen: geef een `src` mee (foto in /public/images) en de echte foto
 * wordt via next/image geoptimaliseerd geladen (AVIF/WebP, lazy).
 */
export function Placeholder({
  label,
  alt,
  kind = "foto",
  src,
  ratio = "4/5",
  tone = "light",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  className,
}: PlaceholderProps) {
  const patternId = useId();

  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-card", className)} style={{ aspectRatio: ratio }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const isDark = tone === "dark";

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "grain relative flex flex-col justify-between overflow-hidden rounded-card p-5",
        isDark ? "bg-ink-raised text-on-ink-muted" : "bg-surface-strong text-ink-muted",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <svg aria-hidden className="absolute inset-0 size-full opacity-[0.35]" preserveAspectRatio="none">
        <defs>
          <pattern id={patternId} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      <span
        className={cn(
          "relative inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]",
          isDark ? "bg-on-ink/10 text-on-ink" : "bg-canvas/80 text-ink",
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
        Placeholder · {kind}
      </span>

      {kind === "video" && (
        <span
          aria-hidden
          className={cn(
            "relative mx-auto flex size-16 items-center justify-center rounded-full border backdrop-blur-sm",
            isDark ? "border-on-ink/30 bg-on-ink/10" : "border-ink/20 bg-canvas/60",
          )}
        >
          <svg viewBox="0 0 16 16" className="ml-1 size-5" fill="currentColor">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        </span>
      )}

      <span className="relative max-w-[28ch] text-sm leading-snug">Vervang door: {label}</span>
    </div>
  );
}
