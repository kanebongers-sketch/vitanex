import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@rv/components/legal/LegalPage";
import { PRIVACYBELEID } from "@rv/content/legal/privacybeleid";

export const metadata: Metadata = legalMetadata(PRIVACYBELEID);

export default function PrivacybeleidPage() {
  return <LegalPage document={PRIVACYBELEID} />;
}
