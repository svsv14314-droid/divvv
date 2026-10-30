import './Marquee.css'

const ROW_A = ['3D Animation', 'Character Design', 'Motion Graphics', 'Hard-surface Modeling', 'ZBrush Sculpting']
const ROW_B = ['Brand Identity', 'Social Creatives', 'Video Editing', 'Facial Animation', 'Look-dev & Render']

const Row = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => (
  <div className={`marquee__row${reverse ? ' marquee__row--reverse' : ''}`}>
    {/* Two copies so the loop seam lands exactly at -50%. */}
    {[0, 1].map((copy) => (
      <div className="marquee__track" key={copy} aria-hidden={copy === 1}>
        {items.map((item, i) => (
          <span key={item} className={i % 2 ? 'marquee__item marquee__item--outline' : 'marquee__item'}>
            {item}
            <svg className="marquee__star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
            </svg>
          </span>
        ))}
      </div>
    ))}
  </div>
)

/** Kinetic band of disciplines between the light hero and the dark studio. */
const Marquee = () => (
  <section className="marquee" aria-label="Disciplines">
    <Row items={ROW_A} />
    <Row items={ROW_B} reverse />
  </section>
)

export default Marquee
