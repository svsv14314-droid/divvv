import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import { PROFILE } from '../data/profile'
import { ArrowIcon, DownloadIcon, MailIcon, PhoneIcon } from './Icons'
import SectionHead from './SectionHead'
import Viewport3D from './Viewport3D'
import './Contact.css'

const COPIED_MS = 1800

const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  useReveal(sectionRef, '0px 0px -100px 0px')

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), COPIED_MS)
    } catch {
      window.location.href = `mailto:${PROFILE.email}`
    }
  }

  return (
    <section id="contact" className="contact" ref={sectionRef}>
      <div className="contact__glow" aria-hidden="true" />
      <div className="contact__inner">
        <SectionHead
          index="07"
          label="Contact"
          title="Let’s create something that moves people."
          highlight="moves people."
          lede={`Open to studio roles and freelance work in 3D animation, motion and design. Based in ${PROFILE.location}.`}
        />

        <div className="contact__grid">
          <figure className="contact__model" data-reveal="up">
            <div className="contact__frame">
              <Viewport3D shading="clay" pose="leaning" stage="Sculpt" mode="Clay" className="contact__viewport" />
            </div>
            <figcaption className="fig-caption">
              <span>Fig. 04</span> Clay pass of the leaning pose. Drag to orbit.
            </figcaption>
          </figure>

          <div className="contact__panel" data-reveal="up" style={{ '--delay': '120ms' } as React.CSSProperties}>
            <span className="contact__kicker">Drop a line</span>
            <a className="contact__email" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>

            <div className="contact__actions">
              <a className="btn btn--primary" href={`mailto:${PROFILE.email}`} data-magnetic>
                <MailIcon />
                Start a project
              </a>
              <button type="button" className="btn" onClick={copyEmail} data-magnetic>
                {copied ? 'Copied ✓' : 'Copy email'}
              </button>
            </div>

            <ul className="contact__channels">
              <li>
                <a className="contact__channel" href={PROFILE.phoneHref} data-spotlight>
                  <PhoneIcon className="contact__channel-icon" />
                  <span>
                    <small>Phone</small>
                    {PROFILE.phone}
                  </span>
                  <ArrowIcon className="contact__channel-arrow" />
                </a>
              </li>
              <li>
                <a className="contact__channel" href={PROFILE.links.resume} download data-spotlight>
                  <DownloadIcon className="contact__channel-icon" />
                  <span>
                    <small>Resume</small>
                    Download PDF
                  </span>
                  <ArrowIcon className="contact__channel-arrow" />
                </a>
              </li>
            </ul>

            <p className="contact__status">
              <i aria-hidden="true" />
              Usually replies within a day · {PROFILE.location}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
