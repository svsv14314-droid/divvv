import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { EDUCATION, PROFILE, SUMMARY } from '../data/profile'
import SectionHead from './SectionHead'
import Viewport3D from './Viewport3D'
import './About.css'

const FACTS = [
  { label: 'Based in', value: PROFILE.location },
  { label: 'Training', value: `${EDUCATION[0].degree}, ${EDUCATION[0].school}` },
  { label: 'Degree', value: `${EDUCATION[1].degree}, ${EDUCATION[1].school}` },
  { label: 'Focus', value: 'Character animation, 3D modeling, motion design, brand visuals' },
  { label: 'Availability', value: PROFILE.availability },
] as const

const About = () => {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section id="about" className="about" ref={sectionRef}>
      <div className="about__inner">
        <SectionHead
          index="02"
          label="About"
          title={`Hi, I’m ${PROFILE.firstName}. I animate, model and design.`}
          highlight={`${PROFILE.firstName}.`}
        />

        <div className="about__grid">
          <figure className="about__model-col" data-reveal="up">
            <div className="about__frame">
              <Viewport3D shading="render" pose="leaning" stage="Look-dev" mode="Final render" className="about__viewport" />
            </div>
            <figcaption className="fig-caption">
              <span>Fig. 02</span> Final render pass, rebuilt in 3D from a photograph. Drag to orbit.
            </figcaption>
          </figure>

          <div className="about__content" data-reveal="up" style={{ '--delay': '120ms' } as React.CSSProperties}>
            <p className="about__text">{SUMMARY}</p>

            <dl className="about__facts">
              {FACTS.map(({ label, value }) => (
                <div key={label} data-spotlight>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
