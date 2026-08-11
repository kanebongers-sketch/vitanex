import { redirect } from 'next/navigation'

// Samengevouwen in de mentale kern /welzijn (stemming + energie + stress + trends
// + Vita op één plek). Deze route leidt door zodat oude links blijven werken.
export default function Page() {
  redirect('/welzijn')
}
