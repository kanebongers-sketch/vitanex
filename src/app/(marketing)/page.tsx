import Nav from '@/components/marketing/landing/Nav'
import Hero from '@/components/marketing/landing/Hero'
import Manifest from '@/components/marketing/landing/Manifest'
import BrainScroll from '@/components/marketing/landing/BrainScroll'
import HowItWorks from '@/components/marketing/landing/HowItWorks'
import AppShowcase from '@/components/marketing/landing/AppShowcase'
import Cta from '@/components/marketing/landing/Cta'
import Footer from '@/components/marketing/landing/Footer'
import { COLORS } from '@/components/marketing/theme'

export default function MarketingPage() {
  return (
    <div style={{ background: COLORS.navy, color: COLORS.ink, minHeight: '100vh', flex: '1 0 auto', overflowX: 'clip' }}>
      <Nav />
      <main>
        <Hero />
        <Manifest />
        <BrainScroll />
        <HowItWorks />
        <AppShowcase />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
