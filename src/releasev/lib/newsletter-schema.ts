import { z } from "zod";

/** Gedeeld tussen formulier en API: e-mail, expliciete toestemming en een honeypot. */
export const newsletterSchema = z.object({
  email: z.email({ error: "Vul een geldig e-mailadres in." }).max(254),
  consent: z.literal(true, { error: "Geef toestemming om je in te schrijven." }),
  website: z.string().max(0).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type NewsletterApiResponse = { success: true } | { success: false; error: string };
