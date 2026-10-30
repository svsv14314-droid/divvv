import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { CORE_SKILLS, HIGHLIGHTS, POSITIONING, PROFILE } from '../data/profile'
import { ArrowIcon, DownloadIcon } from './Icons'
import ParallaxPhoto from './ParallaxPhoto'
import SectionHead from './SectionHead'
import './Intro.css'

const COUNT_MS = 1600

/**
 * Counts the leading number of each [data-count] element up from zero the
 * first time the list scrolls in ("2.5+ yrs" runs 0.0 → 2.5, then keeps its
 * suffix). Values without a leading number are left alone.
 */
function useCountUp(listRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const list = listRef.current
    if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = Array.from(list.querySelectorAll<HTMLElement>('[data-count]'))
    const parsed = items.map((el) => {
      const text = el.dataset.count ?? ''
      const match = text.match(/^(\d+(?:\.\d+)?)(.*)$/)
      return match ? { el, value: Number(match[1]), suffix: match[2], decimals: (match[1].split('.')[1] ?? '').length } : null
    })
    parsed.forEach((p) => p && (p.el.textContent = `${(0).toFixed(p.decimals)}${p.suffix}`))

    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_MS)
        const eased = 1 - Math.pow(1 - t, 4)
        parsed.forEach((p) => p && (p.el.textContent = `${(p.value * eased).toFixed(p.decimals)}${p.suffix}`))
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, { threshold: 0.4 })
    observer.observe(list)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [listRef])
}

const Intro = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLUListElement>(null)
  useReveal(sectionRef)
  useCountUp(statsRef)

  return (
    <section id="intro" className="intro" ref={sectionRef}>
      <div className="intro__glow" aria-hidden="true" />
      <div className="intro__inner">
        <SectionHead
          index="01"
          label="Profile"
          title="I bring characters, products and brands to life in 3D."
          highlight="3D."
        />

        <div className="intro__top">
          <div className="intro__lead" data-reveal="up">
            <p className="intro__statement">{POSITIONING.statement}</p>

            <div className="intro__links">
              <a className="btn btn--primary" href="#projects" data-magnetic>
                View selected work
                <ArrowIcon />
              </a>
              <a className="btn" href={PROFILE.links.resume} download data-magnetic>
                <DownloadIcon />
                Resume
              </a>
            </div>

            <dl className="intro__meta">
              <div>
                <dt>Based in</dt>
                <dd>{PROFILE.location}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                </dd>
              </div>
            </dl>
          </div>

          <figure className="intro__photo-col" data-reveal="up" style={{ '--delay': '120ms' } as React.CSSProperties}>
            <div className="intro__frame" data-tilt>
              <ParallaxPhoto
                className="intro__photo"
                src="/photos/desk.webp"
                depth="/photos/desk-depth.webp"
                alt={`${PROFILE.name} working at his desk`}
              />
              <span className="intro__badge">
                <i aria-hidden="true" />
                Available for work
              </span>
            </div>
            <figcaption className="fig-caption">
              <span>Fig. 01</span> At the desk in Lucknow. The photo has depth: move your cursor over it.
            </figcaption>
          </figure>
        </div>

        <ul className="intro__highlights" ref={statsRef}>
          {HIGHLIGHTS.map((item, index) => (
            <li
              key={item.label}
              className="intro__highlight"
              data-reveal="up"
              data-spotlight
              style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}
            >
              <span className="intro__value" data-count={item.value}>
                {item.value}
              </span>
              <span className="intro__label">{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="intro__skills" data-reveal="up">
          <span className="intro__skills-title">Core tools</span>
          <ul>
            {CORE_SKILLS.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Intro
