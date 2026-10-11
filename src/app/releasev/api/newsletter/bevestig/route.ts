import { NextResponse } from "next/server";
import { SITE } from "@rv/config/site";
import { addNewsletterContact } from "@rv/lib/email";
import { getSigningSecret, readConfirmToken } from "@rv/lib/newsletter";

/** Bevestigingslink uit de double-opt-in-mail. Stuurt altijd door naar /nieuwsbrief met een status. */
export async function GET(request: Request) {
  const redirect = (status: "bevestigd" | "ongeldig" | "fout") =>
    NextResponse.redirect(`${SITE.url}/nieuwsbrief?status=${status}`, { status: 303 });

  const secret = getSigningSecret();
  const email = secret ? readConfirmToken(new URL(request.url).searchParams.get("token"), secret) : null;
  if (!email) return redirect("ongeldig");

  try {
    await addNewsletterContact(email);
    return redirect("bevestigd");
  } catch (error) {
    console.error("[api/newsletter/bevestig] Toevoegen mislukt", error instanceof Error ? error.message : error);
    return redirect("fout");
  }
}
