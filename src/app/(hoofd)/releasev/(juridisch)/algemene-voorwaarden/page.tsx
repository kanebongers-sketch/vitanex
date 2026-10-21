import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@rv/components/legal/LegalPage";
import { ALGEMENE_VOORWAARDEN } from "@rv/content/legal/algemene-voorwaarden";

export const metadata: Metadata = legalMetadata(ALGEMENE_VOORWAARDEN);

export default function AlgemeneVoorwaardenPage() {
  return <LegalPage document={ALGEMENE_VOORWAARDEN} />;
}
