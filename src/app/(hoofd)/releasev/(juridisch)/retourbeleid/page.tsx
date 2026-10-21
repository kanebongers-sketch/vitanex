import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@rv/components/legal/LegalPage";
import { RETOURBELEID } from "@rv/content/legal/retourbeleid";

export const metadata: Metadata = legalMetadata(RETOURBELEID);

export default function RetourbeleidPage() {
  return <LegalPage document={RETOURBELEID} />;
}
