// ─── LifeOS — inbox-triage: de classificatie ────────────────────────────────
// PUUR. Geen fetch, geen DB, geen secrets. Metadata in → een oordeel met een
// reden uit. Daarom volledig testbaar zonder Gmail-account, en dat is precies
// waarom dit een eigen bestand is.
//
// EEN REGEL, GEEN MODEL.
// De verleiding is om hier een LLM op te zetten. Niet doen. Dit ding beslist wat
// je NIET ziet, en een model dat het meestal goed doet, filtert soms stil iets
// belangrijks weg — zonder dat je ooit merkt dát het iets wegliet. Een regel die
// je kunt uitlezen is dan beter dan een model dat gemiddeld beter scoort: je kunt
// 'm nalezen, testen, en corrigeren als hij ernaast zit. `reden` is verplicht om
// dezelfde reden: een oordeel zonder onderbouwing is niet te controleren.
//
// DE BIAS STAAT BEWUST OP TONEN.
// Fout-positief = je ziet een regel die je niet nodig had: één blik, klaar.
// Fout-negatief = je mist iets dat iets van je vroeg, en je komt er nooit achter.
// Die twee kosten niet hetzelfde. Elke twijfel valt daarom uit op `true`, en de
// negatieve regels hieronder zijn expres nauw: ze vuren alleen op signalen die
// de afzender zélf meestuurt (afmeldlink, Precedence, no-reply-adres), niet op
// een inschatting van de inhoud.

/**
 * Wat we van één mail weten. Nadrukkelijk: géén body, géén snippet, géén
 * bijlagen. Alleen wat er nodig is om te bepalen of iets iets van je vraagt.
 *
 * Dit is de hele invoer van de classificatie. Staat het hier niet in, dan speelt
 * het geen rol in het oordeel — en dat is te controleren door dit type te lezen.
 */
export interface MailMeta {
  /** Gmail's message-id. Genoeg om een link naar Gmail te bouwen. */
  id: string
  /**
   * Gmail's thread-id: het gesprek waar dit bericht bij hoort.
   *
   * Nodig zodat een concept-antwoord ÓNDER het gesprek belandt in plaats van los
   * in je concepten te zweven. Leeg (`''`) betekent "onbekend" — dan wordt het
   * concept gewoon los aangemaakt (zie `concept/route.ts`), nooit een fout.
   */
  threadId: string
  /** Weergavenaam uit `From`, als de afzender er een meestuurde. */
  afzenderNaam: string | null
  /** Adres uit `From`. Nodig voor de no-reply-regel. */
  afzenderAdres: string | null
  onderwerp: string | null
  ontvangenOp: Date
  /**
   * Staat mijn adres in `To`? Cc en Bcc tellen niet mee.
   *
   * Dat onderscheid is het halve punt van triage: in de cc gezet worden is
   * "ter kennisgeving", in de aan staan is "aan jou".
   *
   * ⚠️  BEKEND GAT — ALIASSEN. Dit vergelijkt met het primaire adres uit
   *     `users.getProfile`. Komt je post binnen op een alias of een doorgestuurd
   *     adres (`info@eigendomein.nl` → `jij@gmail.com`), dan staat dát adres in
   *     `To`, valt `aanMij` op false, en verdwijnt je échte post als "cc". Precies
   *     het stille fout-negatief waar deze hele module voor waakt.
   *
   *     Niet opgelost omdat het niet te testen viel zonder Gmail-account, en een
   *     ongeteste fix hier is erger dan een gedocumenteerd gat. De weg vooruit:
   *     Gmail's zoekoperator `to:me` kent je aliassen wél (dan verhuist deze regel
   *     naar de query in `gmail.ts`, en verliest hij zijn testbaarheid), of
   *     `settings.sendAs.list` — maar dat kost de scope `gmail.settings.basic`
   *     erbij, en die vragen we bewust niet aan.
   *
   *     Controleer dit als eerste zodra er een echt account is: kijk of je gewone
   *     post in de kaart verschijnt, niet alleen of de kaart iets toont.
   */
  aanMij: boolean
  /** `List-Unsubscribe`-header aanwezig — de handtekening van een nieuwsbrief. */
  heeftAfmeldlink: boolean
  /** `Precedence`-header, kleingemaakt. Bulk-verzenders zetten hier `bulk` of `list`. */
  precedence: string | null
  /** Gmail-labels, bv. `CATEGORY_PROMOTIONS`, `UNREAD`, `INBOX`. */
  labels: readonly string[]
}

export interface Classificatie {
  vraagtActie: boolean
  /** Waaróm. Verplicht: Kane moet een oordeel kunnen narekenen. */
  reden: string
}

/**
 * Afzenders waar je per definitie niet op kunt antwoorden.
 *
 * Bewust een korte, letterlijke lijst op het lokale deel (vóór de @). `notifications@`
 * en `updates@` staan er expres NIET in: daar komt een review-verzoek of een
 * "je vlucht is verplaatst" ook vandaan, en die wil je wél zien. Zie de bias
 * hierboven — deze lijst mag alleen groeien met adressen die écht doodlopen.
 */
const NO_REPLY = /^(no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer[-_.]?daemon|postmaster|bounces?)$/i

/**
 * Gmail-categorieën die geen actie zijn.
 *
 * `CATEGORY_UPDATES` ontbreekt met opzet: daar sorteert Gmail bevestigingen,
 * facturen en bezorgberichten in, en daar zit te vaak iets tussen dat wél iets
 * van je vraagt. Liever die categorie door de rest van de regels laten lopen dan
 * 'm in bulk wegfilteren.
 */
const STILLE_CATEGORIEEN: ReadonlyMap<string, string> = new Map([
  ['CATEGORY_PROMOTIONS', 'Gmail sorteerde dit onder Reclame.'],
  ['CATEGORY_SOCIAL', 'Gmail sorteerde dit onder Sociaal.'],
  ['CATEGORY_FORUMS', 'Gmail sorteerde dit onder Forums.'],
])

/** Precedence-waarden die "dit ging naar een lijst" betekenen. */
const BULK_PRECEDENCE: readonly string[] = ['bulk', 'list', 'junk', 'auto_reply']

function lokaalDeel(adres: string): string {
  const at = adres.lastIndexOf('@')
  return at === -1 ? adres : adres.slice(0, at)
}

/**
 * Vraagt deze mail iets van me?
 *
 * De volgorde is het ontwerp: eerst de signalen die de afzender zelf meestuurt
 * ("dit is massamail"), dan pas de vraag of het aan jou gericht is. Eerste
 * match wint, zodat het antwoord altijd één aanwijsbare reden heeft in plaats
 * van een score die uit vijf halve regels is opgeteld.
 */
export function classificeer(mail: MailMeta): Classificatie {
  // 1. Een afmeldlink zet je alleen op post die je aan veel mensen stuurt.
  //    Het sterkste "dit is geen persoonlijk bericht"-signaal dat er is, en hij
  //    komt van de verzender zelf — wij gokken niets.
  if (mail.heeftAfmeldlink) {
    return { vraagtActie: false, reden: 'Nieuwsbrief: er zit een afmeldlink in de headers.' }
  }

  // 2. Precedence: bulk/list — hetzelfde signaal, andere header.
  if (mail.precedence !== null && BULK_PRECEDENCE.includes(mail.precedence.toLowerCase())) {
    return { vraagtActie: false, reden: 'Bulkbericht: verstuurd aan een lijst, niet aan jou.' }
  }

  // 3. Gmail heeft 'm al gesorteerd. Dat oordeel overrulen we niet.
  for (const label of mail.labels) {
    const reden = STILLE_CATEGORIEEN.get(label)
    if (reden) return { vraagtActie: false, reden }
  }

  // 4. Een adres waar je niet op kunt antwoorden, kan niets van je vragen.
  if (mail.afzenderAdres !== null && NO_REPLY.test(lokaalDeel(mail.afzenderAdres))) {
    return { vraagtActie: false, reden: 'Afzender is een no-reply-adres: je kunt er niet op antwoorden.' }
  }

  // 5. Sta je niet in de `aan`, dan is dit ter kennisgeving. Dekt zowel de cc
  //    als de massaverzending zonder zichtbare geadresseerden — vandaar dat de
  //    reden niet hard "cc" beweert: we weten alleen dat jouw adres er niet in
  //    stond. Laatste negatieve regel; alles hierna is post van een mens, aan jou.
  if (!mail.aanMij) {
    return {
      vraagtActie: false,
      reden: 'Niet aan jou geadresseerd: je staat in de cc of het ging naar een lijst.',
    }
  }

  // 6. Een vraagteken in het onderwerp is geen sterker signaal dan regel 7 —
  //    beide zeggen "ja". Het levert alleen een preciezere reden op, en daar is
  //    `reden` voor.
  if (mail.onderwerp !== null && mail.onderwerp.includes('?')) {
    return { vraagtActie: true, reden: 'Er staat een vraag in het onderwerp.' }
  }

  // 7. Ongelezen, direct aan jou, geen enkel bulk-signaal. Dat is post.
  return { vraagtActie: true, reden: 'Direct aan jou geadresseerd.' }
}

/** Eén mail plus zijn oordeel. */
export interface BeoordeeldeMail {
  mail: MailMeta
  oordeel: Classificatie
}

export interface Triage {
  /** Hoeveel mails we bekeken hebben. De noemer — zie `InboxKaart`. */
  gescand: number
  /** Alleen wat iets van je vraagt, nieuwste eerst. */
  vraagtActie: BeoordeeldeMail[]
}

/**
 * De hele triage in één keer.
 *
 * `gescand` is geen statistiek maar een verantwoording: de UI toont "3 van de 47",
 * zodat zichtbaar is hoeveel er is weggefilterd. Een teller die alleen de
 * uitkomst laat zien, verbergt precies datgene waar je hem op zou willen
 * controleren.
 */
export function triageer(mails: readonly MailMeta[]): Triage {
  const vraagtActie = mails
    .map((mail): BeoordeeldeMail => ({ mail, oordeel: classificeer(mail) }))
    .filter((b) => b.oordeel.vraagtActie)
    .sort((a, b) => b.mail.ontvangenOp.getTime() - a.mail.ontvangenOp.getTime())

  return { gescand: mails.length, vraagtActie }
}
