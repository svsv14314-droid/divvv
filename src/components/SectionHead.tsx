import type { ReactNode } from 'react'

type Props = {
  index: string
  label: string
  title: string
  /** Words of the title (space-separated) set in the accent gradient. */
  highlight?: string
  lede?: ReactNode
}

/**
 * The numbered header every section below the hero opens with: "02 / About"
 * in mono, then a large title whose words rise one by one when it scrolls
 * in. Styles live in index.css (.shead).
 */
const SectionHead = ({ index, label, title, highlight = '', lede }: Props) => {
  const accented = new Set(highlight.split(' ').filter(Boolean))
  const words = title.split(' ')

  return (
    <header className="shead" data-reveal="up">
      <div className="shead__meta">
        <span className="shead__index">{index}</span>
        <span>{label}</span>
      </div>
      <h2 className="shead__title" aria-label={title}>
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={`shead__word${accented.has(word) ? ' shead__word--hl' : ''}`}
            aria-hidden="true"
          >
            <span style={{ '--w': i } as React.CSSProperties}>{word}</span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h2>
      {lede && <p className="shead__lede">{lede}</p>}
    </header>
  )
}

export default SectionHead
