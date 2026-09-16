import { Hero } from '@/sections/Hero'
import { Marquee } from '@/sections/Marquee'
import { Services } from '@/sections/Services'
import { BeforeAfter } from '@/sections/BeforeAfter'
import { Process } from '@/sections/Process'
import { PriceCalculator } from '@/sections/PriceCalculator'
import { Stats } from '@/sections/Stats'
import { Testimonials } from '@/sections/Testimonials'
import { FAQ } from '@/sections/FAQ'
import { CTA } from '@/sections/CTA'

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Services />
      <BeforeAfter />
      <Process />
      <PriceCalculator />
      <Stats />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  )
}
