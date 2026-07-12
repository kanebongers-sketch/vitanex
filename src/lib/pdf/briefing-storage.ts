import { createClient } from '@supabase/supabase-js'

export async function uploadBriefingPDF(pdfBuffer: Buffer, datum: string): Promise<string> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fileName = `briefing-${datum}.pdf`

  const { error } = await db.storage
    .from('briefings')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload mislukt: ${error.message}`)

  const { data } = db.storage.from('briefings').getPublicUrl(fileName)
  return data.publicUrl
}
