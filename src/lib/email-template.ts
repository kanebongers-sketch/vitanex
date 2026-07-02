// ─── MentaForce e-mail-huisstijl ──────────────────────────────────────────────
// Gedeelde HTML-helper voor alle transactionele e-mails (Resend).
//
// LET OP: e-mail-HTML ondersteunt geen CSS-variabelen of externe stylesheets.
// De letterlijke hexwaarden hieronder spiegelen daarom bewust de tokens uit
// src/components/marketing/theme.ts (COLORS.navyDeep #071228, COLORS.navy
// #0B1B3A, COLORS.cyan #00E5FF, COLORS.ink #EAF2FF). Wijzigt theme.ts, werk
// dan ook deze waarden bij.

export const EMAIL_KLEUREN = {
  navyDeep: '#071228',
  navy: '#0B1B3A',
  cyan: '#00E5FF',
  ink: '#EAF2FF',
  inkDim: 'rgba(234,242,255,0.72)',
  inkFaint: 'rgba(234,242,255,0.48)',
  line: 'rgba(234,242,255,0.14)',
} as const

interface EmailKnop {
  label: string
  url: string
}

/** Escapet HTML zodat gebruikersinvoer (namen, berichten) veilig in e-mail-HTML terechtkomt. */
export function escapeHtml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface EmailTemplateOpties {
  /** Binnenste HTML van de kaart (koppen, paragrafen). Stijl zelf met EMAIL_KLEUREN. */
  inhoudHtml: string
  /** Optionele primaire actieknop (cyan, onder de inhoud). */
  knop?: EmailKnop
  /** Maximale breedte van de kaart in px (standaard 480). */
  maxBreedte?: number
}

/** Rendert de primaire cyan actieknop; ook los bruikbaar binnen inhoudHtml. */
export function renderEmailKnop({ label, url }: EmailKnop): string {
  return `<a href="${url}"
    style="display:inline-block; margin-top:24px; background:${EMAIL_KLEUREN.cyan};
           color:${EMAIL_KLEUREN.navyDeep}; padding:13px 26px; border-radius:12px;
           text-decoration:none; font-size:14px; font-weight:600;">
    ${label}
  </a>`
}

/**
 * Rendert een e-mail in de MentaForce-huisstijl: navy achtergrond, het
 * MENTAFORCE-woordmerk met cyaan punt, een navy inhoudskaart en de vaste
 * footer 'MentaForce · Welzijnsplatform voor teams'.
 */
export function renderEmail({ inhoudHtml, knop, maxBreedte = 480 }: EmailTemplateOpties): string {
  const knopHtml = knop ? renderEmailKnop(knop) : ''

  return `
    <div style="background:${EMAIL_KLEUREN.navyDeep}; padding:40px 16px; font-family:'Space Grotesk', Arial, sans-serif;">
      <div style="max-width:${maxBreedte}px; margin:0 auto;">
        <p style="margin:0 0 20px; font-size:16px; font-weight:700; letter-spacing:0.14em; color:${EMAIL_KLEUREN.ink};">
          MENTAFORCE<span style="color:${EMAIL_KLEUREN.cyan};">.</span>
        </p>
        <div style="background:${EMAIL_KLEUREN.navy}; border:1px solid ${EMAIL_KLEUREN.line}; border-radius:16px; padding:32px;">
          ${inhoudHtml}
          ${knopHtml}
        </div>
        <p style="margin:24px 0 0; text-align:center; font-size:12px; color:${EMAIL_KLEUREN.inkFaint};">
          MentaForce · Welzijnsplatform voor teams
        </p>
      </div>
    </div>
  `
}
