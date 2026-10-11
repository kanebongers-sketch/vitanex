import Image from "next/image";
import Link from "next/link";
import { KENNIS_PAGE, type KennisArticle } from "@rv/content/kennis";
import { PROGRAM_HERO, PROGRAM_VARIANTS } from "@rv/content/programma";
import { ARTICLE_H2_CLASS } from "./ArticleSections";

interface VariantNoteProps {
  variant: KennisArticle["variant"];
}

/** Verwijzing naar de bijpassende variant van het 14-dagenprogramma. */
export function VariantNote({ variant }: VariantNoteProps) {
  const match = variant.id ? PROGRAM_VARIANTS.find((item) => item.id === variant.id) : undefined;
  const href = match ? `/programma#${match.id}` : "/programma";
  const image = match?.image ?? PROGRAM_HERO.image;
  const name = match ? `Variant ${match.index} · ${match.name}` : "Alle drie de varianten";

  return (
    <section aria-labelledby="programma" className="mt-14 sm:mt-16">
      <h2 id="programma" className={ARTICLE_H2_CLASS}>
        {KENNIS_PAGE.variantLabel}
      </h2>
      <div className="group relative mt-6 grid overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-[11rem_1fr]">
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto">
          <Image
            src={image.src}
            alt=""
            fill
            sizes="(min-width: 640px) 11rem, 100vw"
            className="object-cover grayscale transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
          />
        </div>
        <div className="p-6 sm:p-7">
          <p className="text-eyebrow font-semibold uppercase text-accent">{name}</p>
          <p className="mt-3">{variant.text}</p>
          <Link
            href={href}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink after:absolute after:inset-0 hover:text-accent"
          >
            Bekijk het programma
            <span aria-hidden className="transition-transform duration-300 ease-calm group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
