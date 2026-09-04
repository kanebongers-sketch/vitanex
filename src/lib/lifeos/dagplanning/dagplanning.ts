// ─── LifeOS — dagplanning-mail (puur) ───────────────────────────────────────
// Bouwt de ochtendmail met je dag uit de agenda. Geen fetch, geen DB: items in →
// onderwerp/HTML/tekst uit, zodat de opmaak zonder mailserver testbaar is.
//
// Tijden worden expliciet in Europe/Amsterdam geformatteerd, niet in de tijdzone
// van de server: een mail die "07:00" hoort te zeggen mag niet "05:00" worden
// omdat de host in UTC draait.

const TIJDZONE = 'Europe/Amsterdam'

export interface DagItem {
  startOp: Date
  /** null = duur onbekend (dan tonen we alleen de starttijd). */
  eindOp: Date | null
  titel: string
  heleDag: boolean
  /** True voor de zelf-ingeplande sport/wandel-blokken — die krijgen een accent. */
  beweging?: boolean
}

/** Eén open taak voor de to-do-sectie in de mail. */
export interface DagTodo {
  titel: string
  /** Staat in de top-3 van vandaag — krijgt een accent. */
  top3: boolean
  /** Gepland voor vandaag. */
  vandaag: boolean
}

export interface DagplanningMail {
  onderwerp: string
  html: string
  tekst: string
}

function tijd(d: Date): string {
  return d.toLocaleTimeString('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit' })
}

function datumLang(d: Date): string {
  return d.toLocaleDateString('nl-NL', { timeZone: TIJDZONE, weekday: 'long', day: 'numeric', month: 'long' })
}

/** HH:MM–HH:MM, of alleen de start als het eind onbekend is. "Hele dag" apart. */
function tijdvak(item: DagItem): string {
  if (item.heleDag) return 'Hele dag'
  const start = tijd(item.startOp)
  return item.eindOp ? `${start}–${tijd(item.eindOp)}` : start
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Chronologisch: hele-dag-items eerst, daarna op starttijd. */
function gesorteerd(items: readonly DagItem[]): DagItem[] {
  return [...items].sort((a, b) => {
    if (a.heleDag !== b.heleDag) return a.heleDag ? -1 : 1
    return a.startOp.getTime() - b.startOp.getTime()
  })
}

export function bouwDagplanningMail(
  dag: Date,
  items: readonly DagItem[],
  todos: readonly DagTodo[] = [],
): DagplanningMail {
  const datum = datumLang(dag)
  const rijen = gesorteerd(items)

  const onderwerp =
    rijen.length === 0
      ? `Je dag — ${datum} (rustige dag)`
      : `Je dag — ${datum} · ${rijen.length} ${rijen.length === 1 ? 'blok' : 'blokken'}`

  // ── Tekst (plain) ──
  const tekstRegels = rijen.length
    ? rijen.map((i) => `${tijdvak(i)}  ${i.titel}${i.beweging ? '  (ingepland)' : ''}`)
    : ['Je agenda is vandaag leeg — mooie ruimte.']
  const tekstTodos = todos.length
    ? ['', 'JE TO-DO’S', ...todos.map((t) => `- ${t.titel}${t.top3 ? '  ★' : t.vandaag ? '  (vandaag)' : ''}`)]
    : ['', 'Geen open taken op je lijst.']
  const tekst = [
    `Je dag — ${datum}`,
    '',
    ...tekstRegels,
    ...tekstTodos,
    '',
    'Sport en wandeling zijn automatisch ingepland.',
  ].join('\n')

  // ── HTML ── (inline styles: mailclients negeren <style>-blokken vaak)
  const rijHtml = rijen.length
    ? rijen
        .map((i) => {
          const accent = i.beweging ? 'color:#0a7c8a;font-weight:600;' : 'color:#0b1b3a;'
          const merk = i.beweging ? ' <span style="color:#0a7c8a;">•</span>' : ''
          return `<tr>
            <td style="padding:8px 12px 8px 0;white-space:nowrap;color:#5b6b86;font-variant-numeric:tabular-nums;vertical-align:top;">${escape(tijdvak(i))}</td>
            <td style="padding:8px 0;${accent}">${escape(i.titel)}${merk}</td>
          </tr>`
        })
        .join('')
    : `<tr><td colspan="2" style="padding:8px 0;color:#5b6b86;">Je agenda is vandaag leeg — mooie ruimte.</td></tr>`

  // ── To-do-sectie ──
  const todoLijst = todos.length
    ? `<ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;">${todos
        .map((t) => {
          const accent = t.top3 ? 'color:#0a7c8a;font-weight:600;' : 'color:#0b1b3a;'
          const merk = t.top3 ? ' <span style="color:#0a7c8a;">★</span>' : t.vandaag ? ' <span style="color:#8a97ad;font-size:12px;">· vandaag</span>' : ''
          return `<li style="${accent}">${escape(t.titel)}${merk}</li>`
        })
        .join('')}</ul>`
    : `<p style="margin:6px 0 0;font-size:14px;color:#5b6b86;">Geen open taken op je lijst.</p>`

  const todoHtml = `
    <h2 style="margin:24px 0 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b86;">Je to-do’s</h2>
    ${todoLijst}`

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0b1b3a;">
    <p style="margin:0 0 2px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b86;">Je dagplanning</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#0b1b3a;">${escape(datum)}</h1>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">${rijHtml}</table>
    ${todoHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#8a97ad;">Sport (90 min, incl. reistijd) en een wandeling (60 min) zijn automatisch in je agenda gezet.</p>
  </div>`

  return { onderwerp, html, tekst }
}
