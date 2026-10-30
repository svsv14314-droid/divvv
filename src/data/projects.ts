/**
 * Selected work, grouped by practice area. Sources, per the brief:
 * - Every line comes from Divyansh_Tandon_Resume.pdf; nothing is invented.
 * - The resume carries no project links or reels, so each case shows a
 *   [SAMPLES NEEDED] slot naming what to add; the same list lives in
 *   ITEMS_NEEDED.md.
 */

export type ProjectIcon = 'cube' | 'character' | 'film' | 'brand' | 'building' | 'layers'

export type Project = {
  slug: string
  number: string
  name: string
  domain: string
  icon: ProjectIcon
  tagline: string
  brief: {
    client: string
    role: string
    period: string
    summary: string
  }
  deliverables: string[]
  /** Pipeline stages, in the order the work moves through them. */
  process: string[]
  tools: string[]
  outcomes: string[]
  /** What Divyansh needs to supply to fill the showcase. */
  samplesNeeded: string[]
}

export const PROJECTS: Project[] = [
  {
    slug: 'character-animation',
    number: '01',
    name: 'Character & 3D Animation',
    domain: 'Animation',
    icon: 'character',
    tagline: '2D and 3D character animation for promotional videos and social content, delivered directly to clients.',
    brief: {
      client: 'Freelance clients',
      role: 'Junior 2D/3D Animator',
      period: 'Jan 2025 – Jan 2026',
      summary:
        'Clients needed promotional and social videos that moved: characters with personality, motion graphics that carry a message, and 3D shots built to their creative requirements.',
    },
    deliverables: [
      '2D animation and character animation for promotional videos and social media content.',
      '3D animation built on his own character, hard-surface, and environment assets.',
      'Motion graphics packaged for social formats.',
    ],
    process: ['Brief & references', 'Storyboard', 'Model & rig', 'Keyframe blocking', 'Polish & facial', 'Render & edit'],
    tools: ['Autodesk Maya', 'Blender', 'Adobe After Effects', 'Adobe Premiere Pro'],
    outcomes: [
      'Animations delivered against each client’s creative and project requirements.',
      'Direct client collaboration from brief to final render.',
    ],
    samplesNeeded: ['Character animation reel (30–60 s)', 'Two or three shot breakdowns: blocking → polish'],
  },
  {
    slug: '3d-modeling',
    number: '02',
    name: '3D Modeling & Sculpting',
    domain: '3D modeling',
    icon: 'cube',
    tagline: 'Characters, hard-surface props, and environments, modeled and sculpted for animation.',
    brief: {
      client: 'Freelance clients · Origins Advertising',
      role: '3D Modeller',
      period: 'Mar 2024 – Jan 2026',
      summary:
        'Animation projects needed production-ready assets: characters that deform cleanly, hard-surface props with crisp edges, and environments to stage the action in.',
    },
    deliverables: [
      'Character models for animation projects.',
      'Hard-surface and product models.',
      'Environment and interior assets.',
    ],
    process: ['Reference & blockout', 'Base mesh', 'Sculpt detail', 'Retopology', 'UVs & texture', 'Look-dev render'],
    tools: ['Autodesk Maya', '3ds Max', 'ZBrush', 'Blender'],
    outcomes: ['Asset library spanning character, hard-surface, organic, product, and interior work.'],
    samplesNeeded: ['Turntables (wireframe + clay + final) of 3–4 models', 'One environment still'],
  },
  {
    slug: 'motion-graphics-video',
    number: '03',
    name: 'Motion Graphics & Video',
    domain: 'Motion design',
    icon: 'film',
    tagline: 'Promotional, corporate, and social videos with motion graphics that carry the story.',
    brief: {
      client: 'Gencosys · Meradoor · Origins',
      role: 'Graphic Designer & Video Editor',
      period: 'Mar 2024 – Present',
      summary:
        'Brands needed video that holds attention on social feeds and in presentations, with motion graphics that make the message land.',
    },
    deliverables: [
      'Promotional, corporate, and social media video edits.',
      'Motion graphics and animated visuals for digital content.',
      'Real estate promotional videos for project launches.',
    ],
    process: ['Concept', 'Storyboard', 'Design frames', 'Animate', 'Edit & sound', 'Deliver per platform'],
    tools: ['Adobe After Effects', 'Cinema 4D', 'Adobe Premiere Pro'],
    outcomes: [
      'Stronger visual storytelling and audience engagement on client video.',
      'Full production lifecycle owned from concept to final delivery.',
    ],
    samplesNeeded: ['Motion reel', 'Two finished promos (one corporate, one real estate)'],
  },
  {
    slug: 'brand-social-creative',
    number: '04',
    name: 'Brand & Social Creative',
    domain: 'Graphic design',
    icon: 'layers',
    tagline: 'Platform-specific creatives for Instagram, Facebook, LinkedIn, YouTube, and email, across many industries.',
    brief: {
      client: 'Gencosys Technologies clients',
      role: 'Graphic Designer & Video Editor',
      period: 'Apr 2026 – Present',
      summary:
        'Clients across several industries needed a steady stream of on-brand visuals, sized and styled for each platform, under real deadlines.',
    },
    deliverables: [
      'Social media creatives, posters, brochures, postcards, and banners.',
      'Digital advertisements for clients across multiple industries.',
      'Creatives optimised per platform: Instagram, Facebook, LinkedIn, YouTube, and email.',
    ],
    process: ['Brief', 'Moodboard', 'Layout & type', 'Design', 'Client feedback', 'Platform exports'],
    tools: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign'],
    outcomes: [
      'Brand-focused content that improved digital presence and customer engagement.',
      'Several projects handled at once, on deadline and to quality standards.',
    ],
    samplesNeeded: ['A grid of 6–9 social creatives', 'One brochure or poster spread'],
  },
  {
    slug: 'real-estate-campaigns',
    number: '05',
    name: 'Real Estate Campaigns',
    domain: 'Campaign design',
    icon: 'building',
    tagline: 'Launch creatives, property imagery, and promo films for real estate projects, in print and digital.',
    brief: {
      client: 'Meradoor Builders Pvt. Ltd.',
      role: 'Graphic Designer & Video Editor',
      period: 'Feb 2026 – Apr 2026',
      summary:
        'Project launches needed brand-consistent marketing across banners, brochures, social, and video, and property images that sell the space.',
    },
    deliverables: [
      'Marketing banners, promotional and social media creatives.',
      'Edited property images and promotional graphics for ads and brochures.',
      'Promotional videos and motion graphics for brand promotion.',
    ],
    process: ['Launch brief', 'Key visual', 'Property retouch', 'Campaign set', 'Promo video', 'Print & digital'],
    tools: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe After Effects', 'Adobe Premiere Pro'],
    outcomes: ['Brand-consistent design material for project launches, built with the marketing team.'],
    samplesNeeded: ['Campaign key visual + banner set', 'Before/after property retouch', 'Promo video'],
  },
  {
    slug: 'brand-identity-print',
    number: '06',
    name: 'Brand Identity & Print',
    domain: 'Branding',
    icon: 'brand',
    tagline: 'Logos, brand visuals, and magazine layouts built on composition, typography, and color.',
    brief: {
      client: 'Origins Advertising Pvt. Ltd.',
      role: 'Graphic Designer | 3D Modeller',
      period: 'Mar 2024 – Dec 2024',
      summary:
        'Agency clients needed identities and print work that matched their brand strategy, from logo to magazine page.',
    },
    deliverables: [
      'Logos, banners, and brand visuals aligned with brand identity and marketing strategy.',
      'Edited magazine photos and page layouts for print and digital media.',
      'Marketing creatives and promotional graphics.',
    ],
    process: ['Strategy', 'Sketches', 'Logo & system', 'Layouts', 'Photo edit', 'Print-ready files'],
    tools: ['Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign'],
    outcomes: ['High-quality visual presentation across print and digital media.'],
    samplesNeeded: ['Two logo identities with usage', 'A magazine spread'],
  },
]

export const projectBySlug = (slug: string) => PROJECTS.find((project) => project.slug === slug)

/** 3D title card rendered by scripts/renderCovers.ts. */
export const coverFor = (slug: string) => `/covers/${slug}.webp`
