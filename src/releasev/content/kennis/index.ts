/**
 * KENNISBANK — alle artikelen voor /kennis en /kennis/[slug].
 * Nieuw artikel: maak een bestand in deze map en voeg het toe aan KENNIS_ARTICLES.
 */
import { SITE } from "@rv/config/site";
import { estimateReadingMinutes } from "@rv/lib/reading-time";
import { foamRollenBasisgids } from "./foam-rollen-basisgids";
import { kuitenFoamRoller } from "./kuiten-foam-roller";
import { onderrugHeupenZitten } from "./onderrug-heupen-zitten";
import { schoudersBovenrugKracht } from "./schouders-bovenrug-kracht";
import { voetzolenBallen } from "./voetzolen-ballen";
import type { KennisArticle, KennisSection } from "./types";

export type { KennisArticle, KennisSection, KennisStep, KennisToolId, ProgramVariantId } from "./types";
export { KENNIS_TOOLS } from "./tools";
export { KENNIS_PUBLISHED } from "./meta";

/** Volgorde = volgorde op de overzichtspagina. De eerste is het uitgelichte artikel. */
export const KENNIS_ARTICLES: readonly KennisArticle[] = [
  foamRollenBasisgids,
  kuitenFoamRoller,
  onderrugHeupenZitten,
  schoudersBovenrugKracht,
  voetzolenBallen,
];

export const KENNIS_PAGE = {
  eyebrow: "Kennis",
  titleLines: ["Beter", "bewegen."],
  lead: "Praktische routines per lichaamsdeel, rustig uitgelegd door ons team van coaches. Geen beloftes, wel duidelijke stappen die je vandaag kunt doen.",
  description: `Kennisbank van ${SITE.brandName}: praktische foam-roller- en mobiliteitsroutines per lichaamsdeel voor hardlopers, kantoorwerkers en krachtsporters. Rustig uitgelegd, stap voor stap.`,
  authorLine: `Door het team van ${SITE.brandName} (o.l.v. ${SITE.trainer.name}, die zelf trainers opleidt)`,
  ctaTitle: "Alles uit deze artikelen zit in een kit.",
  ctaLead: "Vijf tools en het 14-dagenprogramma op video, in drie varianten.",
  ctaButton: "Bekijk de kit",
  toolsLabel: "Gebruikte tools",
  tocLabel: "In dit artikel",
  relatedLabel: "Verder lezen",
  variantLabel: "Uit het programma",
} as const;

export function getArticleBySlug(slug: string): KennisArticle | undefined {
  return KENNIS_ARTICLES.find((article) => article.slug === slug);
}

/** Gerelateerde artikelen in de volgorde van `related`; onbekende slugs worden overgeslagen. */
export function getRelatedArticles(article: KennisArticle): KennisArticle[] {
  return article.related
    .map((slug) => getArticleBySlug(slug))
    .filter((related): related is KennisArticle => related !== undefined && related.slug !== article.slug);
}

function sectionText(section: KennisSection): string[] {
  switch (section.kind) {
    case "text":
    case "caution":
      return [section.heading, ...section.paragraphs];
    case "steps":
      return [
        section.heading,
        section.intro ?? "",
        ...section.steps.flatMap((step) => [step.title, step.dose, step.text]),
        section.outro ?? "",
      ];
    case "mistakes":
      return [section.heading, ...section.items.flatMap((item) => [item.title, item.text])];
  }
}

/** Alle leesbare tekst van een artikel, voor de leestijd. */
export function getArticleText(article: KennisArticle): string[] {
  return [article.title, ...article.intro, ...article.sections.flatMap(sectionText), article.variant.text];
}

export function getReadingMinutes(article: KennisArticle): number {
  return estimateReadingMinutes(getArticleText(article));
}

/** h2-ankers voor de inhoudsopgave (inclusief het programmablok onderaan). */
export function getTableOfContents(article: KennisArticle): { id: string; label: string }[] {
  return [
    ...article.sections.map((section) => ({ id: section.id, label: section.heading })),
    { id: "programma", label: KENNIS_PAGE.variantLabel },
  ];
}
