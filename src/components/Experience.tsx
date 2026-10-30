import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { EDUCATION, EXPERIENCE } from '../data/profile'
import SectionHead from './SectionHead'
import './Experience.css'

const Experience = () => {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section id="experience" className="experience" ref={sectionRef}>
      <div className="experience__inner">
        <SectionHead
          index="03"
          label="Experience"
          title="Where I’ve made things move."
          highlight="move."
          lede="An advertising agency, a real estate developer, a technology company, and a year of freelance 2D/3D animation."
        />

        <ol className="experience__list">
          {EXPERIENCE.map((role, index) => (
            <li
              key={`${role.company}-${role.period}`}
              className="experience__role"
              data-reveal="up"
              style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}
            >
              <span className="experience__node" aria-hidden="true" />
              <article className="experience__card" data-spotlight>
                <header className="experience__head">
                  <div>
                    <span className="experience__period">{role.period}</span>
                    <h3>{role.title}</h3>
                    <p className="experience__company">
                      {role.company} <span>· {role.location}</span>
                    </p>
                  </div>
                  <span className="experience__index" aria-hidden="true">
                    {String(EXPERIENCE.length - index).padStart(2, '0')}
                  </span>
                </header>
                <ul className="experience__points">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <div className="experience__education" data-reveal="up">
          <h3 className="experience__subhead">Education</h3>
          <div className="experience__degrees">
            {EDUCATION.map((item) => (
              <article key={item.degree} className="experience__degree" data-spotlight>
                <span className="experience__period">{item.period}</span>
                <h4>{item.degree}</h4>
                <p>
                  {item.school} · {item.location}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Experience
