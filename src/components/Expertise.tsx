import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { CAPABILITIES } from '../data/profile'
import type { ProjectIcon } from '../data/projects'
import { ProjectGlyph } from './Icons'
import SectionHead from './SectionHead'
import './Expertise.css'

/** Icon per capability, in CAPABILITIES order. */
const ICONS: ProjectIcon[] = ['cube', 'character', 'film', 'brand']

const Expertise = () => {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section id="expertise" className="expertise" ref={sectionRef}>
      <div className="expertise__inner">
        <SectionHead
          index="05"
          label="Capabilities"
          title="From first sketch to final render."
          highlight="final render."
          lede="Four disciplines, each backed by client and studio work on the resume."
        />

        <ol className="expertise__list">
          {CAPABILITIES.map((capability, index) => (
            <li
              key={capability.number}
              className="expertise__item"
              data-reveal="up"
              style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}
            >
              <article className="expertise__card" data-tilt data-spotlight>
                <div className="expertise__top">
                  <span className="expertise__icon">
                    <ProjectGlyph icon={ICONS[index]} />
                  </span>
                  <span className="expertise__number">{capability.number}</span>
                </div>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default Expertise
