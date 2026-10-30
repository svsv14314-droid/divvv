import { PROFILE } from '../data/profile'
import './Footer.css'

const NAV = [
  { label: 'Profile', href: '#intro' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Work', href: '#projects' },
  { label: 'Toolkit', href: '#skills' },
  { label: 'Contact', href: '#contact' },
] as const

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__row">
          <div className="footer__col">
            <span className="footer__label">Disciplines</span>
            <p>3D modeling &amp; animation</p>
            <p>Motion graphics &amp; video</p>
            <p>Brand &amp; graphic design</p>
          </div>

          <nav className="footer__col" aria-label="Footer">
            <span className="footer__label">Index</span>
            {NAV.map(({ label, href }) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
          </nav>

          <div className="footer__col">
            <span className="footer__label">Contact</span>
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a href={PROFILE.phoneHref}>{PROFILE.phone}</a>
            <a href={PROFILE.links.resume} download>
              Resume (PDF)
            </a>
          </div>

          <div className="footer__col">
            <span className="footer__label">Location</span>
            <p>{PROFILE.location}</p>
            <p>{PROFILE.availability}</p>
          </div>
        </div>

        <div className="footer__wordmark" aria-hidden="true">
          {PROFILE.name}
        </div>

        <div className="footer__base">
          <span>
            &copy; {year} {PROFILE.name}
          </span>
          <span>{PROFILE.tagline}</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
