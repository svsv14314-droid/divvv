import type { ProjectIcon } from '../data/projects'

type IconProps = { className?: string }

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Line glyphs for the work covers — one per discipline. */
const PROJECT_PATHS: Record<ProjectIcon, React.ReactNode> = {
  cube: (
    <>
      <path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" />
      <path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5" />
    </>
  ),
  character: (
    <>
      <circle cx="12" cy="6.5" r="2.6" />
      <path d="M12 9.1v5.4M12 14.5l-3 5.5M12 14.5l3 5.5M7 11.2l5-1.2 5 1.2" />
    </>
  ),
  film: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 9h17M7.5 5.5l1.5 3.5M12 5.5l1.5 3.5M16.5 5.5l1.5 3.5" />
      <path d="M10.5 12v4l3.5-2z" />
    </>
  ),
  brand: (
    <>
      <path d="M5 19l3.2-1 9.6-9.6a1.8 1.8 0 0 0-2.6-2.6L5.6 15.4z" />
      <path d="M14 7.2l2.6 2.6M4.5 20.5h15" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 20.5h15M6.5 20.5V8l6-3.5v16M12.5 9.5h5v11" />
      <path d="M8.8 10.5h1.4M8.8 13.5h1.4M8.8 16.5h1.4M14.8 13h1.4M14.8 16h1.4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4l8 4.2-8 4.2-8-4.2z" />
      <path d="M4 12.2l8 4.2 8-4.2M4 16l8 4.2 8-4.2" />
    </>
  ),
}

export const ProjectGlyph = ({ icon, className }: IconProps & { icon: ProjectIcon }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    {PROJECT_PATHS[icon]}
  </svg>
)

export const ArrowIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const ExternalIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </svg>
)

export const MailIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M4.5 7l7.5 6 7.5-6" />
  </svg>
)

export const ResumeIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8}>
    <path d="M7 3.5h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
    <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
  </svg>
)

export const PhoneIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8}>
    <path d="M6.6 3.8l2.6-.3 1.5 4-1.9 1.4a11 11 0 0 0 6.3 6.3l1.4-1.9 4 1.5-.3 2.6a2 2 0 0 1-2.1 1.8C10.5 18.8 5.2 13.5 4.8 5.9a2 2 0 0 1 1.8-2.1z" />
  </svg>
)

export const DownloadIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />
  </svg>
)
