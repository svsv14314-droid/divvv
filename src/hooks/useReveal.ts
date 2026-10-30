import { useEffect, type RefObject } from 'react'

/**
 * Stands in for AOS / framer-motion `whileInView`: every `[data-reveal]` inside
 * the root gets `data-revealed` the first time it scrolls into view, and the
 * transition itself lives in index.css. Reveals only ever play once.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>, rootMargin = '0px 0px -12% 0px') {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (root.hasAttribute('data-reveal')) targets.push(root)

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.setAttribute('data-revealed', ''))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-revealed', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef, rootMargin])
}
