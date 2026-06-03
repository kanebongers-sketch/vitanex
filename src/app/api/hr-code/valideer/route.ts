import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/hr-code/valideer?code=FIT-X2K
// Publiek endpoint – geen auth vereist.
// Retourneert bedrijfsnaam als de code geldig en actief is.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim()

  if (!code || !/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
    return NextResponse.json(
      { geldig: false, fout: 'Ongeldige code-opmaak. Gebruik formaat AAA-9A9 (bijv. FIT-X2K).' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('bedrijven')
    .select('id, naam, hr_code_actief')
    .eq('hr_code', code)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { geldig: false, fout: 'Onbekende HR code.' },
      { status: 404 }
    )
  }

  if (!data.hr_code_actief) {
    return NextResponse.json(
      { geldig: false, fout: 'Deze HR code is gedeactiveerd. Neem contact op met je HR-afdeling.' },
      { status: 410 }
    )
  }

  return NextResponse.json({
    geldig: true,
    bedrijf_id: data.id,
    bedrijfsnaam: data.naam,
  })
}
