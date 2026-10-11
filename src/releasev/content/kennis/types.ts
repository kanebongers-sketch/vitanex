/**
 * KENNIS — types voor de kennisbank (/kennis).
 * Huisregels: geen medische claims, geen verzonnen cijfers, studies of quotes.
 * Algemene richtlijnen altijd voorzichtig formuleren ("veel mensen vinden…").
 */
import type { SiteImage } from "@rv/config/images";

export type KennisToolId = "foam-roller" | "lacrosse-bal" | "spiky-bal" | "duobal" | "stretchband";

export type ProgramVariantId = "kantoorwerkers" | "hardlopers" | "krachtsporters";

export interface KennisStep {
  title: string;
  tool: KennisToolId;
  /** Duur of herhalingen, bijv. "60 sec per been" */
  dose: string;
  text: string;
}

interface SectionBase {
  /** Anker-id voor de inhoudsopgave */
  id: string;
  heading: string;
}

export type KennisSection =
  | (SectionBase & { kind: "text"; paragraphs: readonly string[] })
  | (SectionBase & { kind: "steps"; intro?: string; steps: readonly KennisStep[]; outro?: string })
  | (SectionBase & { kind: "mistakes"; items: readonly { title: string; text: string }[] })
  | (SectionBase & { kind: "caution"; paragraphs: readonly string[] });

export interface KennisArticle {
  slug: string;
  title: string;
  /** Meta description (±150 tekens) */
  description: string;
  /** Lichaamszone of thema, getoond als eyebrow */
  zone: string;
  /** Voor wie het artikel vooral bedoeld is */
  audience: string;
  image: SiteImage;
  /** ISO-datum (YYYY-MM-DD) */
  datePublished: string;
  dateModified?: string;
  intro: readonly string[];
  sections: readonly KennisSection[];
  tools: readonly KennisToolId[];
  /** Variant uit het programma; zonder id verwijst het blok naar alle varianten */
  variant: { id?: ProgramVariantId; text: string };
  related: readonly string[];
}
