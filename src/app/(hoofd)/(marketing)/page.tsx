import LiquidMotion from '@/components/marketing/liquid/LiquidMotion'
import LiquidStyles from '@/components/marketing/liquid/LiquidStyles'
import LiquidHero from '@/components/marketing/liquid/LiquidHero'
import LiquidAbout from '@/components/marketing/liquid/LiquidAbout'
import BrainScroll from '@/components/marketing/landing/BrainScroll'
import LiquidFeature from '@/components/marketing/liquid/LiquidFeature'
import LiquidPhilosophy from '@/components/marketing/liquid/LiquidPhilosophy'
import LiquidServices from '@/components/marketing/liquid/LiquidServices'
import Footer from '@/components/marketing/landing/Footer'

export default function MarketingPage() {
  return (
    <div data-mf-liquid className="min-h-screen flex-[1_0_auto] font-grotesk" style={{ overflowX: 'clip' }}>
      <LiquidStyles />
      <LiquidMotion>
        <main>
          <LiquidHero />
          <LiquidAbout />
          <BrainScroll />
          <LiquidFeature />
          <LiquidPhilosophy />
          <LiquidServices />
        </main>
      </LiquidMotion>
      <Footer />
    </div>
  )
}
