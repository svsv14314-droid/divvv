import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import { SKILL_GROUPS } from '../data/profile'
import type { Pose, Shading } from '../three/figure'
import SectionHead from './SectionHead'
import Viewport3D from './Viewport3D'
import './Skills.css'

/** Which pass the viewport shows for each group, in SKILL_GROUPS order. */
const PASSES: { shading: Shading; pose: Pose; stage: string; mode: string }[] = [
  { shading: 'wireframe', pose: 'walking', stage: 'Modeling', mode: 'Wireframe' },
  { shading: 'clay', pose: 'walking', stage: 'Animation', mode: 'Clay' },
  { shading: 'render', pose: 'walking', stage: 'Motion', mode: 'Final render' },
  { shading: 'render', pose: 'leaning', stage: 'Design', mode: 'Final render' },
  { shading: 'clay', pose: 'leaning', stage: 'Campaign', mode: 'Clay' },
  { shading: 'wireframe', pose: 'leaning', stage: 'Character', mode: 'Wireframe' },
]

const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  useReveal(sectionRef)
  const pass = PASSES[active]

  return (
    <section id="skills" className="skills" ref={sectionRef}>
      <div className="skills__inner">
        <SectionHead
          index="06"
          label="Toolkit"
          title="The toolkit behind every frame."
          highlight="every frame."
          lede="Click a discipline: the viewport switches to the pass that goes with it."
        />

        <div className="skills__layout">
          <figure className="skills__model" data-reveal="up">
            <div className="skills__frame">
              {/* Keyed so each pass mounts fresh and fades in. */}
              <Viewport3D
                key={`${pass.shading}-${pass.pose}`}
                shading={pass.shading}
                pose={pass.pose}
                stage={pass.stage}
                mode={pass.mode}
                className="skills__viewport"
              />
            </div>
            <figcaption className="fig-caption">
              <span>Fig. 03</span> {pass.mode} pass of the {pass.pose} pose. Drag to orbit.
            </figcaption>
          </figure>

          <div className="skills__groups" role="tablist" aria-label="Skill groups" aria-orientation="vertical">
            {SKILL_GROUPS.map((group, index) => {
              const selected = index === active
              return (
                <div
                  key={group.category}
                  className="skills__group"
                  data-active={selected}
                  data-reveal="up"
                  style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    role="tab"
                    id={`skills-tab-${index}`}
                    aria-selected={selected}
                    aria-controls={`skills-panel-${index}`}
                    className="skills__tab"
                    onClick={() => setActive(index)}
                  >
                    <span className="skills__index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="skills__name">{group.category}</span>
                    <span className="skills__count">{group.skills.length}</span>
                  </button>
                  <div
                    className="skills__panel"
                    role="tabpanel"
                    id={`skills-panel-${index}`}
                    aria-labelledby={`skills-tab-${index}`}
                    hidden={!selected}
                  >
                    <ul>
                      {group.skills.map((skill) => (
                        <li key={skill}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
