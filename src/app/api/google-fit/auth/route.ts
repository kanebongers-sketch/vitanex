import { NextResponse } from 'next/server'

/**
 * Google Fit koppelen kan niet meer: Google stopt met de Google Fit-API's.
 * Op Android loopt alles via Health Connect (zie /koppelingen). Wie Google Fit
 * al gekoppeld had, kan hem op /koppelingen nog ontkoppelen; de callback- en
 * sync-route blijven daarom (voorlopig) bestaan.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Google Fit koppelen kan niet meer. Gebruik Health Connect op je Android-telefoon.' },
    { status: 410 },
  )
}
