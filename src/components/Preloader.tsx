import { useEffect, useState } from 'react'
import { PROFILE } from '../data/profile'
import './Preloader.css'

/** Fill (1.6s after a 0.2s delay) plus a short beat before the shutter lifts. */
const HOLD_MS = 2200
/** Matches the shutter transition in Preloader.css. */
const EXIT_MS = 1200

type Phase = 'loading' | 'leaving' | 'done'

const Preloader = () => {
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const leave = window.setTimeout(() => setPhase('leaving'), reduced ? 300 : HOLD_MS)
    const done = window.setTimeout(() => setPhase('done'), (reduced ? 300 : HOLD_MS) + EXIT_MS)
    return () => {
      window.clearTimeout(leave)
      window.clearTimeout(done)
    }
  }, [])

  // Hold the page still while the curtain is down.
  useEffect(() => {
    if (phase !== 'loading') return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div className="preloader" data-phase={phase} aria-hidden="true">
      <div className="preloader__glow" />
      <div className="preloader__logo">
        <div className="preloader__ghost">
          {PROFILE.firstName}<span>.</span>
        </div>
        <div className="preloader__fill">
          {PROFILE.firstName}<span>.</span>
        </div>
      </div>
    </div>
  )
}

export default Preloader
