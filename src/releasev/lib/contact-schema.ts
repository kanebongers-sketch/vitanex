import { z } from "zod";

/**
 * Gedeeld validatieschema voor het contactformulier.
 * Wordt gebruikt in de browser (directe feedback) en in /api/contact
 * (de server vertrouwt nooit alleen op client-side validatie).
 */
export const CONTACT_SUBJECTS = [
  { value: "bestelling", label: "Vraag over een bestelling" },
  { value: "retour", label: "Retour of herroeping" },
  { value: "programma", label: "Het videoprogramma" },
  { value: "anders", label: "Iets anders" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

const SUBJECT_VALUES = CONTACT_SUBJECTS.map((subject) => subject.value) as [ContactSubject, ...ContactSubject[]];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Vul je naam in (minimaal 2 tekens)." })
    .max(100, { error: "Je naam mag maximaal 100 tekens zijn." }),
  email: z
    .string()
    .trim()
    .max(200, { error: "Je e-mailadres is te lang." })
    .pipe(z.email({ error: "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl." })),
  subject: z.enum(SUBJECT_VALUES, { error: "Kies een onderwerp." }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Je bericht is wat kort. Schrijf minimaal 10 tekens." })
    .max(5000, { error: "Je bericht mag maximaal 5000 tekens zijn." }),
  /** Honeypot: onzichtbaar voor mensen. Ingevuld = vrijwel zeker een bot. */
  website: z.string().max(500).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = "name" | "email" | "subject" | "message";
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

/** Zet zod-fouten om naar een leesbare melding per veld. */
export function getContactFieldErrors(values: unknown): ContactFieldErrors {
  const result = contactSchema.safeParse(values);
  if (result.success) return {};
  const fieldErrors = z.flattenError(result.error).fieldErrors;
  return {
    name: fieldErrors.name?.[0],
    email: fieldErrors.email?.[0],
    subject: fieldErrors.subject?.[0],
    message: fieldErrors.message?.[0],
  };
}

export interface ContactApiResponse {
  success: boolean;
  error?: string;
}
