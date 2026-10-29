import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { maandNaam } from '@/lib/club/cijfers/maand'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { isRapport, RAPPORTEN } from '@/lib/club/rapporten/definities'
import { heeftVreemdeVestiging, isAlles, rapportKeuze, VESTIGINGEN_PARAM } from '@/lib/club/rapporten/keuze'
import { rapportBestand, rapportCsv } from '@/lib/club/rapporten/csv'
import { haalRapportTabel } from '@/lib/club/rapporten/haal'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kiesTaal, TAAL_COOKIE } from '@/lib/aiyourgym/taal/taal'
import { kolomIn } from '@/lib/aiyourgym/taal/woorden/club/rapporten'

// GET /api/club/rapporten/csv?rapport=<sleutel>&maand=YYYY-MM&vs=<vestiging>&vs=...|alle
//   Het rapport als CSV voor Excel NL (puntkomma, UTF-8 met BOM, dd-mm-jjjj).
//   Alleen eigen vestigingen; elke export komt in het logboek.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  // Dubbel slot naast magApi: zonder recht op Rapporten bestaat deze route niet.
  if (!magOnderdeel(t.onderdelen, 'rapporten')) return clubFout('Niet gevonden.', 404)
  const zoek = req.nextUrl.searchParams
  if (!isRapport(zoek.get('rapport'))) return clubFout('Onbekend rapport.', 400)
  const vs = zoek.getAll(VESTIGINGEN_PARAM)
  if (vs.length === 0 || heeftVreemdeVestiging(t.vestigingen, vs)) return clubFout('Onbekende vestiging.', 400)

  const keuze = rapportKeuze({ rapport: zoek.get('rapport'), maand: zoek.get('maand'), [VESTIGINGEN_PARAM]: vs }, t.vestigingen, null, dagSleutel(new Date()))
  const uitkomst = await haalRapportTabel(t.admin, t.userId, t.vestigingen, keuze)
  if (!uitkomst.ok) return clubFout(uitkomst.fout, 500)

  const alle = isAlles(keuze, t.vestigingen)
  const bestand = rapportBestand(keuze.rapport, keuze.maand, keuze.vestigingen, alle)
  const { tabel } = uitkomst
  // De kolomkoppen in de taal van de gebruiker (cookie van het verzoek zelf); de waarden blijven zoals ze zijn.
  const taal = kiesTaal(req.cookies.get(TAAL_COOKIE)?.value)
  await logActie(
    t,
    'rapport geexporteerd',
    `${RAPPORTEN[keuze.rapport].titel}, ${maandNaam(keuze.maand)}, ${tabel.rijen.length} rijen${alle ? ', alle vestigingen' : ''}`,
    keuze.vestigingen.length === 1 ? keuze.vestigingen[0] : null,
  )
  return new NextResponse(rapportCsv({ ...tabel, kolommen: tabel.kolommen.map((k) => kolomIn(k, taal)) }), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${bestand}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
      'X-Rapport-Rijen': String(tabel.rijen.length),
      'X-Rapport-Onvolledig': tabel.afgekapt || uitkomst.onvolledig ? '1' : '0',
    },
  })
}
