'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/auth/auth-fetch'

// Downloadt één coachgesprek-verslag als pdf. Een gewone <a href> kan niet: de
// route wil het Bearer-token, dus ophalen via authFetch en als blob opslaan.

function bestandsnaamUit(kop: string | null): string {
  const match = kop?.match(/filename="([^"]+)"/)
  return match?.[1] ?? 'Coachgesprek.pdf'
}

export function VerslagDownload({ id }: { id: string }) {
  const [staat, setStaat] = useState<'rust' | 'bezig' | 'fout'>('rust')

  async function download() {
    setStaat('bezig')
    try {
      const antwoord = await authFetch(`/api/lifeos/pt-coaching/${encodeURIComponent(id)}/pdf`)
      if (!antwoord.ok) throw new Error(String(antwoord.status))
      const url = URL.createObjectURL(await antwoord.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = bestandsnaamUit(antwoord.headers.get('Content-Disposition'))
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStaat('rust')
    } catch {
      setStaat('fout')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={staat === 'bezig'}
      style={{
        appearance: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        font: 'inherit', color: staat === 'fout' ? 'var(--text-2)' : 'var(--brand)', textDecoration: 'underline',
      }}
    >
      {staat === 'bezig' ? 'pdf maken…' : staat === 'fout' ? 'pdf mislukt — opnieuw' : 'Download pdf'}
    </button>
  )
}
