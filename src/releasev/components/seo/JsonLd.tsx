/**
 * Rendert schema.org JSON-LD. `<` wordt ge-escaped zodat data nooit
 * uit de script-tag kan breken (XSS-bescherming).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
