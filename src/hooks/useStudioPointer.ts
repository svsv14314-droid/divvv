import { useEffect } from 'react'

/** Max tilt, in degrees, for [data-tilt] cards. */
const TILT = 6
/** How far [data-magnetic] buttons lean toward the cursor, as a share of the offset. */
const PULL = 0.28

/**
 * One delegated pointer listener for the whole page:
 * - [data-spotlight] gets --mx/--my so a soft light follows the cursor
 * - [data-tilt] leans in 3D toward the cursor
 * - [data-magnetic] drifts toward the cursor
 * Touch and reduced-motion users get none of it.
 */
export function useStudioPointer() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tilted: HTMLElement | null = null
    let magnet: HTMLElement | null = null

    const release = (el: HTMLElement | null) => {
      if (el) el.style.transform = ''
    }

    // Pointer events can fire several times per frame; only the latest one
    // matters, so the layout reads and style writes run once per frame.
    let pending: PointerEvent | null = null
    let frame: number | null = null

    const apply = () => {
      frame = null
      const event = pending
      pending = null
      if (!event) return
      const target = event.target instanceof Element ? event.target : null

      const lit = target?.closest<HTMLElement>('[data-spotlight]')
      if (lit) {
        const rect = lit.getBoundingClientRect()
        lit.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        lit.style.setProperty('--my', `${event.clientY - rect.top}px`)
      }

      const tilt = target?.closest<HTMLElement>('[data-tilt]') ?? null
      if (tilt !== tilted) {
        release(tilted)
        tilted = tilt
      }
      if (tilt) {
        const rect = tilt.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        tilt.style.transform = `perspective(1000px) rotateX(${(-y * TILT).toFixed(2)}deg) rotateY(${(x * TILT).toFixed(2)}deg)`
      }

      const pull = target?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (pull !== magnet) {
        release(magnet)
        magnet = pull
      }
      if (pull) {
        const rect = pull.getBoundingClientRect()
        const dx = event.clientX - (rect.left + rect.width / 2)
        const dy = event.clientY - (rect.top + rect.height / 2)
        pull.style.transform = `translate(${(dx * PULL).toFixed(1)}px, ${(dy * PULL).toFixed(1)}px)`
      }
    }

    const onMove = (event: PointerEvent) => {
      pending = event
      if (frame === null) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      release(tilted)
      release(magnet)
      tilted = null
      magnet = null
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
}
