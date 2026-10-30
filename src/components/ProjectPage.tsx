import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { projectHref } from '../hooks/useHashRoute'
import { PROJECTS, coverFor, type Project } from '../data/projects'
import { PROFILE } from '../data/profile'
import { ArrowIcon, DownloadIcon, MailIcon, ProjectGlyph } from './Icons'
import './ProjectPage.css'

const SectionHeading = ({ index, title }: { index: string; title: string }) => (
  <div className="project__heading">
    <span>{index}</span>
    <h2>{title}</h2>
  </div>
)

const ProjectPage = ({ project }: { project: Project }) => {
  const pageRef = useRef<HTMLElement>(null)
  useReveal(pageRef)

  const position = PROJECTS.findIndex((item) => item.slug === project.slug)
  const prev = PROJECTS[(position - 1 + PROJECTS.length) % PROJECTS.length]
  const next = PROJECTS[(position + 1) % PROJECTS.length]
  const enquiry = `mailto:${PROFILE.email}?subject=${encodeURIComponent(`${project.name} enquiry`)}`

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const previousTitle = document.title
    document.title = `${project.name} — ${PROFILE.name}`
    return () => {
      document.title = previousTitle
    }
  }, [project])

  return (
    // Keyed by slug in App so reveals replay when moving between projects.
    <article className="project" ref={pageRef}>
      <header className="project__hero">
        <div className="project__hero-inner">
          <a className="project__back" href="#projects">
            <ArrowIcon className="project__back-icon" />
            All work
          </a>

          <div className="project__hero-grid">
            <div data-reveal="up">
              <span className="project__eyebrow">
                Case {project.number} · {project.domain}
              </span>
              <h1 className="project__title">{project.name}</h1>
              <p className="project__tagline">{project.tagline}</p>

              <div className="project__links">
                <a className="btn btn--primary" href={enquiry} data-magnetic>
                  <MailIcon />
                  Start a similar project
                </a>
                <a className="btn" href={PROFILE.links.resume} download data-magnetic>
                  <DownloadIcon />
                  Resume
                </a>
              </div>
            </div>

            <div className="project__emblem" data-reveal="zoom" aria-hidden="true">
              <ProjectGlyph icon={project.icon} className="project__emblem-glyph" />
              <span>{project.number}</span>
            </div>
          </div>

          <figure className="project__cover" data-reveal="up">
            <img src={coverFor(project.slug)} alt="" />
            <figcaption>3D title card for this case</figcaption>
          </figure>
        </div>
      </header>

      <div className="project__body">
        {/* 01 — Brief */}
        <section className="project__section" data-reveal="up">
          <SectionHeading index="01" title="The brief" />
          <div className="project__split">
            <div>
              <h3 className="project__label">
                {project.brief.client} · {project.brief.period}
              </h3>
              <p className="project__lead">{project.brief.role}</p>
              <p className="project__text">{project.brief.summary}</p>
            </div>
            <div className="project__panel">
              <h3 className="project__label">What I delivered</h3>
              <ul className="project__list">
                {project.deliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 02 — Pipeline */}
        <section className="project__section" data-reveal="up">
          <SectionHeading index="02" title="Pipeline & tools" />

          <h3 className="project__label">How the work moves</h3>
          <ol className="project__flow">
            {project.process.map((stage, index) => (
              <li key={stage}>
                <span className="project__flow-index">{String(index + 1).padStart(2, '0')}</span>
                {stage}
              </li>
            ))}
          </ol>

          <h3 className="project__label">Tools</h3>
          <ul className="project__stack">
            {project.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>

        {/* 03 — Outcome & showcase */}
        <section className="project__section" data-reveal="up">
          <SectionHeading index="03" title="Outcome & showcase" />

          <h3 className="project__label">Outcome</h3>
          <ul className="project__list project__list--outcomes">
            {project.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>

          <h3 className="project__label">Reel & stills</h3>
          <div className="project__metrics">
            {project.samplesNeeded.map((sample) => (
              <div key={sample} className="project__metric" data-pending="">
                <span className="project__metric-needed">[SAMPLES NEEDED]</span>
                <span className="project__metric-label">{sample}</span>
                <span className="project__metric-note">Slot reserved for Divyansh’s own work.</span>
              </div>
            ))}
          </div>
        </section>

        {/* 04 — Contact */}
        <section className="project__section" data-reveal="up">
          <SectionHeading index="04" title="Work together" />
          <div className="project__link-cards">
            <a className="project__link-card" href={enquiry}>
              <MailIcon className="project__link-icon" />
              <span>
                <strong>Email Divyansh</strong>
                <small>{PROFILE.email}</small>
              </span>
            </a>
            <a className="project__link-card" href={PROFILE.links.resume} download>
              <DownloadIcon className="project__link-icon" />
              <span>
                <strong>Download resume</strong>
                <small>PDF · {PROFILE.tagline}</small>
              </span>
            </a>
          </div>
        </section>

        <nav className="project__pager" aria-label="More work">
          <a href={projectHref(prev.slug)} className="project__pager-link">
            <small>Previous</small>
            <span>{prev.name}</span>
          </a>
          <a href={projectHref(next.slug)} className="project__pager-link project__pager-link--next">
            <small>Next</small>
            <span>{next.name}</span>
          </a>
        </nav>
      </div>
    </article>
  )
}

export default ProjectPage
