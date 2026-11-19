// ─── Club: wachtwoord vergeten, gekoppeld aan de echte opslag (SERVER-ONLY) ──
// Geeft verwerkVergeten de bestaande functies mee: dezelfde zoekfuncties als
// het inloggen, dezelfde eenmalige codes als de uitnodiging van een beheerder
// en van een medewerker, en dezelfde Resend-afzender als de uitnodigingsmail.
//
// Bewust zonder controle op het adres van de sportschool (hostPastBij): het
// antwoord is toch altijd hetzelfde, de mail gaat alleen naar het adres van het
// account zelf en de link wijst altijd naar de eigen sportschool.

import type { SupabaseClient } from '@supabase/supabase-js'
import { mailAfzender } from '@/lib/aiyourgym/config'
import { subdomeinenActief } from '@/lib/aiyourgym/schakelaar'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { beheerderLinkPad, type Beheerder } from '@/lib/club/beheerders/beheerder'
import { vindBeheerderOpEmail, vraagBeheerderReset } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { aygUrl, sportschoolUrl } from '@/lib/club/kern/subdomein'
import { magMedewerkerBinnen, uitnodigingPad } from '@/lib/club/medewerker-login/medewerker-login'
import { vindMedewerkerOpEmail, vraagMedewerkerReset, type MedewerkerMetToegang } from '@/lib/club/medewerker-login/opslag'
import { stuurClubMail } from '@/lib/club/medewerker-login/uitnodig-mail'
import { vindPlatformOpEmail } from '@/lib/club/platform-login/opslag'
import { haalEigenOrganisatie } from '@/lib/club/toegang'
import { VERGETEN_ROUTE, type Kandidaat } from './regels'
import { verwerkVergeten, type VergetenDeps, type VergetenUitkomst } from './verwerk'

interface BeheerderKandidaat extends Kandidaat {
  bron: Beheerder
}

interface MedewerkerKandidaat extends Kandidaat {
  bron: MedewerkerMetToegang
}

function alsBeheerder(b: Beheerder | null): BeheerderKandidaat | null {
  return b && { naam: b.naam, email: b.email, organisatieId: b.organisatieId, actief: b.actief, heeftWachtwoord: b.wachtwoordHash !== null, bron: b }
}

function alsMedewerker(m: MedewerkerMetToegang | null): MedewerkerKandidaat | null {
  return m && {
    naam: m.medewerker.naam,
    email: m.toegang.email,
    organisatieId: m.toegang.userId,
    actief: magMedewerkerBinnen(m.toegang, m.medewerker),
    heeftWachtwoord: m.toegang.wachtwoordHash !== null,
    bron: m,
  }
}

function echteDeps(admin: SupabaseClient, nu: Date): VergetenDeps<BeheerderKandidaat, MedewerkerKandidaat> {
  return {
    mailKlaar: () => mailAfzender() !== null,
    isGeremd: (rem, email) => isGeremd(rem, email),
    isPlatform: async (email) => (await vindPlatformOpEmail(admin, email)) !== null,
    // Met de eigen login van sportscholen uit kan alleen het master account inloggen.
    vindBeheerder: async (email) => (CLUB_EIGEN_LOGIN ? alsBeheerder(await vindBeheerderOpEmail(admin, email)) : null),
    vindMedewerker: async (email) => (CLUB_EIGEN_LOGIN ? alsMedewerker(await vindMedewerkerOpEmail(admin, email)) : null),
    sportschool: async (organisatieId) => (await haalEigenOrganisatie(admin, organisatieId)).organisatie,
    linkBeheerder: async (b) => {
      const code = await vraagBeheerderReset(admin, b.bron, nu)
      return code ? { pad: beheerderLinkPad(code) } : null
    },
    linkMedewerker: async (m) => {
      const token = await vraagMedewerkerReset(admin, m.bron, nu)
      return token ? { pad: uitnodigingPad(token) } : null
    },
    url: (slug, pad) => (slug ? sportschoolUrl(slug, subdomeinenActief(), pad) : aygUrl(pad)),
    stuurMail: (naar, onderwerp, tekst) => stuurClubMail(naar, onderwerp, tekst, 'nieuwe link na wachtwoord vergeten'),
    meld: (reden) => meldFout({ fout: reden, route: VERGETEN_ROUTE, methode: 'POST', soort: 'route' }, admin),
  }
}

/** Zoekt het account bij dit adres en mailt een verse link. Gooit nooit: een fout wordt gemeld, zonder persoonsgegevens. */
export async function vraagNieuweLinkAan(admin: SupabaseClient, email: string, taal: Taal, nu: Date): Promise<VergetenUitkomst> {
  try {
    return await verwerkVergeten(email, taal, echteDeps(admin, nu))
  } catch (fout) {
    await meldFout({ fout, route: VERGETEN_ROUTE, methode: 'POST', soort: 'route' }, admin)
    return 'db'
  }
}
