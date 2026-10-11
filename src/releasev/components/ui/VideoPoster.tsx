import Image from "next/image";
import type { SiteImage } from "@rv/config/images";
import { cn } from "@rv/lib/cn";

interface VideoPosterProps {
  /** Posterfoto uit IMAGES */
  image: SiteImage;
  /** Welke video hier moet komen, bijv. "Voorbeeldsessie hardlopers (dag 6)" */
  label: string;
  /** CSS aspect-ratio, bijv. "16/9" */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Foto met play-knop als tijdelijke stand-in voor een video.
 * Vervangen: zet hier een <video> of een (pas na klik geladen) Vimeo/YouTube-embed.
 */
export function VideoPoster({
  image,
  label,
  ratio = "16/9",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className,
}: VideoPosterProps) {
  return (
    <figure
      className={cn("group relative isolate w-full max-w-full overflow-hidden rounded-card bg-surface", className)}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="-z-10 object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas/80 via-canvas/10 to-transparent" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/30 bg-canvas/40 text-ink backdrop-blur-md transition-transform duration-500 ease-calm group-hover:scale-110"
      >
        <svg viewBox="0 0 16 16" className="ml-0.5 size-5" fill="currentColor">
          <path d="M4 2.5v11l9-5.5z" />
        </svg>
      </span>
      <figcaption className="absolute inset-x-4 bottom-4 flex items-center gap-2 text-xs font-medium text-ink">
        <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-on-ink">
          Video volgt
        </span>
        <span className="truncate text-ink-soft">{label}</span>
      </figcaption>
    </figure>
  );
}
