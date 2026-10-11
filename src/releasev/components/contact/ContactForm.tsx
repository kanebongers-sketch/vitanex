"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@rv/components/ui/Button";
import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";
import {
  CONTACT_SUBJECTS,
  getContactFieldErrors,
  type ContactApiResponse,
  type ContactField,
  type ContactFieldErrors,
} from "@rv/lib/contact-schema";

type Status = "idle" | "submitting" | "success" | "error";

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

const EMPTY_VALUES: FormValues = { name: "", email: "", subject: "", message: "", website: "" };
const FIELD_ORDER: readonly ContactField[] = ["name", "email", "subject", "message"];
const GENERIC_ERROR = `Er ging iets mis bij het versturen. Probeer het opnieuw of mail ons via ${SITE.contact.email}.`;

/** Onderlijn-velden op donker: de lijn wordt licht bij hover en oranje bij focus. */
const inputClasses =
  "mt-1 block w-full rounded-none border-0 border-b bg-transparent px-0 py-3 text-lg text-ink [color-scheme:dark] transition-[border-color,box-shadow] duration-300 ease-calm placeholder:text-ink-muted/70 hover:border-ink-soft focus:border-accent focus:shadow-[0_1px_0_0_var(--rv-color-accent)] focus:outline-none focus-visible:outline-none";

async function postMessage(values: FormValues): Promise<ContactApiResponse> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const body = (await response.json().catch(() => null)) as ContactApiResponse | null;
  if (!response.ok || !body?.success) {
    return { success: false, error: body?.error ?? GENERIC_ERROR };
  }
  return { success: true };
}

interface FieldProps {
  id: ContactField;
  label: string;
  error?: string;
  hint?: string;
  children: (describedBy: string | undefined, hasError: boolean) => ReactNode;
}

function Field({ id, label, error, hint, children }: FieldProps) {
  const errorId = `${id}-fout`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="text-eyebrow font-semibold uppercase text-ink-muted">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-2 text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {children(describedBy, Boolean(error))}
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-sm text-danger">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
}

function useContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...values, [event.target.name]: event.target.value };
    setValues(next);
    if (hasTriedSubmit) setErrors(getContactFieldErrors(next));
  };

  const focusFirstError = (fieldErrors: ContactFieldErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setHasTriedSubmit(true);
    const fieldErrors = getContactFieldErrors(values);
    setErrors(fieldErrors);
    if (Object.values(fieldErrors).some(Boolean)) {
      focusFirstError(fieldErrors);
      return;
    }
    setStatus("submitting");
    setServerError(null);
    try {
      const result = await postMessage(values);
      setStatus(result.success ? "success" : "error");
      setServerError(result.success ? null : (result.error ?? GENERIC_ERROR));
    } catch {
      setStatus("error");
      setServerError(GENERIC_ERROR);
    }
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setHasTriedSubmit(false);
    setStatus("idle");
  };

  return { formRef, values, errors, status, serverError, onChange, onSubmit, reset };
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <m.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="rounded-card border border-line bg-surface p-8 sm:p-10"
    >
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-success text-on-ink">
        <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="mt-6 font-display text-display-md uppercase focus:outline-none">Dank je, je bericht is binnen.</h2>
      <p className="mt-4 max-w-prose text-ink-soft">{SITE.contact.responseTime} Je ontvangt ons antwoord op het e-mailadres dat je hebt ingevuld.</p>
      <Button variant="secondary" className="mt-8" onClick={onReset}>
        Nog een bericht sturen
      </Button>
    </m.div>
  );
}

type FormApi = ReturnType<typeof useContactForm>;

function fieldClass(hasError: boolean, extra?: string) {
  return cn(inputClasses, extra, hasError ? "border-danger" : "border-line");
}

function TextFields({ values, errors, onChange }: Pick<FormApi, "values" | "errors" | "onChange">) {
  return (
    <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
      <Field id="name" label="Naam" error={errors.name}>
        {(describedBy, hasError) => (
          <input id="name" name="name" type="text" autoComplete="name" required value={values.name} onChange={onChange} aria-invalid={hasError} aria-describedby={describedBy} className={fieldClass(hasError)} />
        )}
      </Field>
      <Field id="email" label="E-mailadres" error={errors.email}>
        {(describedBy, hasError) => (
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required value={values.email} onChange={onChange} aria-invalid={hasError} aria-describedby={describedBy} className={fieldClass(hasError)} />
        )}
      </Field>
    </div>
  );
}

function MessageFields({ values, errors, onChange }: Pick<FormApi, "values" | "errors" | "onChange">) {
  return (
    <>
      <Field id="subject" label="Onderwerp" error={errors.subject}>
        {(describedBy, hasError) => (
          <select id="subject" name="subject" required value={values.subject} onChange={onChange} aria-invalid={hasError} aria-describedby={describedBy} className={fieldClass(hasError)}>
            <option value="" disabled className="bg-surface text-ink-muted">Kies een onderwerp</option>
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value} className="bg-surface text-ink">{subject.label}</option>
            ))}
          </select>
        )}
      </Field>
      <Field id="message" label="Bericht" error={errors.message} hint="Noem bij een vraag over je bestelling ook je bestelnummer.">
        {(describedBy, hasError) => (
          <textarea id="message" name="message" rows={5} required value={values.message} onChange={onChange} aria-invalid={hasError} aria-describedby={describedBy} className={fieldClass(hasError, "resize-y")} />
        )}
      </Field>
      {/* Honeypot: verborgen voor bezoekers en screenreaders. Bots vullen dit vaak wel in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website (niet invullen)</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange} />
      </div>
    </>
  );
}

function SubmitRow({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <div className="flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[22rem] text-xs leading-relaxed text-ink-muted">
        We gebruiken je gegevens alleen om je vraag te beantwoorden. Lees ons{" "}
        <Link href="/privacybeleid" className="text-ink-soft underline underline-offset-2 transition-colors hover:text-ink">privacybeleid</Link>.
      </p>
      <Button type="submit" size="lg" withArrow aria-disabled={isSubmitting} aria-busy={isSubmitting} className="shrink-0">
        {isSubmitting ? "Versturen…" : "Verstuur bericht"}
      </Button>
    </div>
  );
}

export function ContactForm() {
  const form = useContactForm();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {form.status === "success" ? (
        <SuccessMessage onReset={form.reset} />
      ) : (
        <m.form key="form" ref={form.formRef} noValidate onSubmit={form.onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative grid gap-10" aria-label="Contactformulier">
          <TextFields values={form.values} errors={form.errors} onChange={form.onChange} />
          <MessageFields values={form.values} errors={form.errors} onChange={form.onChange} />
          {form.status === "error" && form.serverError && (
            <p role="alert" className="rounded-card border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
              {form.serverError}
            </p>
          )}
          <SubmitRow isSubmitting={form.status === "submitting"} />
        </m.form>
      )}
    </AnimatePresence>
  );
}
