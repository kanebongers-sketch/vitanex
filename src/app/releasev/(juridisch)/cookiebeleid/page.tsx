import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@rv/components/legal/LegalPage";
import { COOKIEBELEID } from "@rv/content/legal/cookiebeleid";

export const metadata: Metadata = legalMetadata(COOKIEBELEID);

export default function CookiebeleidPage() {
  return <LegalPage document={COOKIEBELEID} />;
}
