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
    <div data-mf-landing style={{ background: COLORS.navy, color: COLORS.ink, minHeight: '100vh', flex: '1 0 auto', overflowX: 'clip' }}>
      <style>{`
        [data-mf-landing] a:focus-visible,
        [data-mf-landing] button:focus-visible {
          outline: 2px solid ${COLORS.cyan};
          outline-offset: 3px;
          border-radius: 6px;
        }
        [data-mf-landing] footer a { transition: color .15s ease; }
        [data-mf-landing] footer a:hover { color: ${COLORS.ink}; }
      `}</style>
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
