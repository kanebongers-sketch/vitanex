'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HrPortaalRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/hr') }, [router])
  return null
}
