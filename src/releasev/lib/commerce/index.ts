import { RECOVERY_KIT, RECOVERY_KIT_DUO } from "@rv/config/product";
import type { Product } from "./types";

/**
 * Commerce-laag. Alle pagina's halen productdata via deze functies op.
 * Overstappen naar Shopify headless? Vervang alleen de implementatie hieronder
 * door Storefront API-calls; de rest van de site blijft gelijk.
 */
const CATALOG: readonly Product[] = [RECOVERY_KIT, RECOVERY_KIT_DUO];

const isListed = (product: Product): boolean => product.isListed !== false;

/** Producten met een eigen productpagina (voor routes en sitemap). */
export function getAllProducts(): readonly Product[] {
  return CATALOG.filter(isListed);
}

export function getProductBySlug(slug: string): Product | undefined {
  return CATALOG.find((product) => isListed(product) && product.slug === slug);
}

/** Zoekt in de hele catalogus, inclusief pakketvarianten (winkelwagen, checkout). */
export function getProductById(id: string): Product | undefined {
  return CATALOG.find((product) => product.id === id);
}

export function getFeaturedProduct(): Product {
  return RECOVERY_KIT;
}

/** Basisproduct plus pakketvarianten, oplopend in aantal kits. */
export function getPacksFor(baseId: string): readonly Product[] {
  return CATALOG.filter((product) => product.id === baseId || product.packOf === baseId).sort(
    (a, b) => (a.packSize ?? 1) - (b.packSize ?? 1),
  );
}

export type { Product } from "./types";
