import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from '@/components/theme'
import { Background } from '@/components/Background'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ChatWidget } from '@/components/ChatWidget'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { PageLoader } from '@/components/Loading'
import { AuthProvider } from '@/lib/auth'
import Home from '@/pages/Home'
import { Impressum, Datenschutz, NotFound } from '@/pages/Legal'

const Leistungen = lazy(() => import('@/pages/Leistungen'))
const Booking = lazy(() => import('@/pages/Booking'))
const Login = lazy(() => import('@/pages/Login'))
const Konto = lazy(() => import('@/pages/Konto'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Team = lazy(() => import('@/pages/Team'))

function Pages() {
  const loc = useLocation()
  const isDash = loc.pathname.startsWith('/dashboard')
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname.split('/')[1]} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <Suspense fallback={<PageLoader label="Seite wird geladen …" />}>
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/leistungen" element={<Leistungen />} />
              <Route path="/termin" element={<Booking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/konto" element={<Konto />} />
              <Route path="/team" element={<Team />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      {!isDash && <Footer />}
      <ChatWidget />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SmoothScroll>
            <Background />
            <Pages />
          </SmoothScroll>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
