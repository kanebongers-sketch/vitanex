import Nav from '@/components/marketing/landing/Nav'
import Hero from '@/components/marketing/landing/Hero'
import Manifest from '@/components/marketing/landing/Manifest'
import Pillars from '@/components/marketing/landing/Pillars'
import HowItWorks from '@/components/marketing/landing/HowItWorks'
import AppShowcase from '@/components/marketing/landing/AppShowcase'
import Cta from '@/components/marketing/landing/Cta'
import Footer from '@/components/marketing/landing/Footer'
import { COLORS } from '@/components/marketing/theme'

export default function MarketingPage() {
  return (
    <div style={{ background: COLORS.navy, color: COLORS.ink, minHeight: '100vh', flex: '1 0 auto' }}>
      <Nav />
      <main>
        <Hero />
        <Manifest />
        <Pillars />
        <HowItWorks />
        <AppShowcase />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
