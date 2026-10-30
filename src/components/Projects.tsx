import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { projectHref } from '../hooks/useHashRoute'
import { PROJECTS, coverFor } from '../data/projects'
import { ArrowIcon } from './Icons'
import SectionHead from './SectionHead'
import './Projects.css'

const Projects = () => {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section id="projects" className="projects" ref={sectionRef}>
      <div className="projects__inner">
        <SectionHead
          index="04"
          label="Selected work"
          title="Selected work across six disciplines."
          highlight="work"
          lede="From character animation to brand identity. Each case covers the brief, what was delivered, the pipeline and the tools."
        />

        <div className="projects__grid">
          {PROJECTS.map((project, index) => (
            <article
              key={project.slug}
              className={`projects__card projects__card--${index + 1}`}
              data-reveal="up"
              style={{ '--delay': `${(index % 2) * 90}ms` } as React.CSSProperties}
            >
              <div className="projects__tilt" data-tilt>
                <div className="projects__media">
                  <img src={coverFor(project.slug)} alt="" loading="lazy" />
                </div>
                <div className="projects__shade" aria-hidden="true" />

                <span className="projects__number">{project.number}</span>

                <div className="projects__body">
                  <span className="projects__domain">
                    {project.domain} · {project.brief.period}
                  </span>
                  <h3>
                    {/* Stretched link: the whole card opens the case study. */}
                    <a className="projects__main-link" href={projectHref(project.slug)}>
                      {project.name}
                    </a>
                  </h3>
                  <p className="projects__tagline">{project.tagline}</p>
                  <span className="projects__tools">
                    {project.tools.map((tool) => tool.replace('Adobe ', '').replace('Autodesk ', '')).join(' · ')}
                  </span>
                </div>

                <span className="projects__go" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="projects__note">
          Covers are 3D title cards rendered for this site. Reels and stills for each case are on the way.
        </p>
      </div>
    </section>
  )
}

export default Projects
