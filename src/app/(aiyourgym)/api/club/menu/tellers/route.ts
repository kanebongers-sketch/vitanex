import { NextResponse, type NextRequest } from 'next/server'
import { clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { ONDERDELEN, isZichtbaar } from '@/components/club/shell/onderdelen'
import { tellerRechten } from '@/lib/club/menu/tellers'
import { haalTellers } from '@/lib/club/menu/tellers-opslag'

// GET /api/club/menu/tellers?v=<vestiging>
// De tellers in het menu (open taken, te bellen, nieuwe leads) voor wie er
// binnen is. Iedereen die binnen is mag deze route (net als Hulp, zie
// beheerders/rechten.ts); de route telt alleen de onderdelen die deze persoon in
// het menu ziet (pakket afgenomen, onderdeel aan, recht via de rol) en alleen in
// een vestiging waar hij werkt. Zonder vestiging: geen tellers.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const vestiging = kiesUit(t.vestigingen, req.nextUrl.searchParams.get('v'))
  if (!vestiging) return clubJson({ tellers: {} })
  const zie = (sleutel: string) => {
    const o = ONDERDELEN.find((x) => x.sleutel === sleutel)
    return o !== undefined && isZichtbaar(o, t.organisatie.uit, t.onderdelen)
  }
  const tellers = await haalTellers({ admin: t.admin, userId: t.userId, vestiging, rechten: tellerRechten(zie), nu: new Date() })
  return clubJson({ tellers })
}
