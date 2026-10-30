/**
 * Everything personal on the site, in one place. Source:
 * - Divyansh_Tandon_Resume.pdf in "Divyansh Tandon Portfolio/" (role, summary,
 *   experience, education, skills, contact)
 * No profile links (LinkedIn, Behance, ArtStation, showreel) were supplied, so
 * none are shown; ITEMS_NEEDED.md lists what to send.
 */

export const PROFILE = {
  name: 'Divyansh Tandon',
  firstName: 'Divyansh',
  lastName: 'Tandon',
  initials: 'DT',
  title: '3D Animator',
  tagline: '3D Animator · Graphic Designer',
  location: 'Lucknow, India',
  availability: 'Open to studio & freelance work',
  // The resume prints "dtandon2682gmail.com"; the missing @ is restored here.
  email: 'dtandon2682@gmail.com',
  phone: '+91 93352 80347',
  phoneHref: 'tel:+919335280347',
  links: {
    resume: '/resume/Divyansh_Tandon_Resume.pdf',
  },
} as const

export const POSITIONING = {
  statement:
    'Creative 3D Animator and Graphic Designer specializing in 2D/3D animation, character animation, motion design, and visual branding. I work across Blender, Autodesk Maya, ZBrush, and the Adobe Creative Suite, and care most about visual storytelling and detail-driven design.',
} as const

/** Evidence strip on Home. Every figure is counted from the resume. */
export const HIGHLIGHTS = [
  { value: '2.5+ yrs', label: 'of professional design, motion and 3D work since March 2024', source: 'Resume timeline' },
  { value: '4', label: 'roles across advertising, real estate, tech and freelance animation', source: 'Experience' },
  { value: '10+', label: 'production tools, from Maya, ZBrush and 3ds Max to After Effects', source: 'Skills' },
  { value: '2D + 3D', label: 'animation: keyframe, facial, body mechanics, mocap cleanup', source: 'Skills' },
] as const

export const CORE_SKILLS = [
  'Autodesk Maya',
  'Blender',
  'ZBrush',
  '3ds Max',
  'Cinema 4D',
  'Character animation',
  'Motion graphics',
  'After Effects',
  'Premiere Pro',
  'Photoshop',
  'Illustrator',
  'Brand visuals',
] as const

export const SUMMARY =
  'Trained in 3D animation at the Zee Institute of Creative Arts, I build characters, hard-surface and environment assets, animate them, and carry the same eye into brand work: social creatives, campaigns, print layouts, and promotional video. Every project runs the full lifecycle with me, from concept and storyboard to modeling, animation, edit, and final delivery.'

export type Role = {
  title: string
  company: string
  location: string
  period: string
  points: string[]
}

export const EXPERIENCE: Role[] = [
  {
    title: 'Graphic Designer & Video Editor',
    company: 'Gencosys Technologies (P) Ltd.',
    location: 'Lucknow, India',
    period: 'Apr 2026 – Present',
    points: [
      'Designing social media creatives, posters, brochures, postcards, banners, and digital advertisements for clients across multiple industries.',
      'Creating motion graphics and editing promotional, corporate, and social media videos that sharpen storytelling and audience engagement.',
      'Running the end-to-end creative lifecycle, from concept development and storyboarding to design, video edit, and final delivery.',
      'Building platform-specific creatives for Instagram, Facebook, LinkedIn, YouTube, and email campaigns, while handling several projects at once against deadlines and feedback cycles.',
    ],
  },
  {
    title: 'Graphic Designer & Video Editor',
    company: 'Meradoor Builders Private Limited',
    location: 'Lucknow, India',
    period: 'Feb 2026 – Apr 2026',
    points: [
      'Designed marketing banners, promotional creatives, and social media visuals for real estate projects across digital and print campaigns.',
      'Created and edited property images and promotional graphics for advertisements, brochures, and social media.',
      'Produced and edited promotional videos and motion graphics for real estate marketing and brand promotion, working with marketing teams on brand-consistent launch material.',
    ],
  },
  {
    title: 'Junior 2D/3D Animator',
    company: 'Freelance',
    location: 'Remote',
    period: 'Jan 2025 – Jan 2026',
    points: [
      'Created 2D animation, motion graphics, and character animation for promotional videos and social media content.',
      'Produced 3D animations and models, including character, hard-surface, and environment assets for animation projects.',
      'Worked directly with clients to deliver high-quality animation and design against creative and project requirements.',
    ],
  },
  {
    title: 'Graphic Designer | 3D Modeller',
    company: 'Origins Advertising Private Limited',
    location: 'Lucknow, India',
    period: 'Mar 2024 – Dec 2024',
    points: [
      'Designed logos, banners, and brand visuals aligned with brand identity and marketing strategy.',
      'Created and edited magazine photos and layouts for print and digital media.',
      'Developed marketing creatives using strong composition, typography, and color theory, and produced motion graphics and edited promotional video.',
    ],
  },
]

export const EDUCATION = [
  {
    degree: 'Certificate Course in 3D Animation',
    school: 'Zee Institute of Creative Arts',
    location: 'Lucknow, India',
    period: 'May 2023 – Present',
  },
  {
    degree: 'Bachelor of Business Administration',
    school: 'University of Lucknow',
    location: 'Lucknow, India',
    period: 'Aug 2021 – Jul 2024',
  },
] as const

export const SKILL_GROUPS = [
  {
    category: '3D Modeling & Sculpt',
    skills: ['Autodesk Maya', 'Blender', '3ds Max', 'ZBrush', 'Hard surface', 'Organic', 'Product', 'Interior'],
  },
  {
    category: 'Animation',
    skills: ['Keyframe', 'Object animation', 'Facial animation', 'Body mechanics', 'Motion-capture cleanup', 'Character animation', '2D animation'],
  },
  {
    category: 'Motion & Video',
    skills: ['Adobe After Effects', 'Cinema 4D (motion graphics)', 'Adobe Premiere Pro', 'Video editing', 'Storyboarding'],
  },
  {
    category: 'Graphic Design',
    skills: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Typography', 'Color theory', 'Layout design'],
  },
  {
    category: 'Brand & Campaigns',
    skills: ['Brand identity', 'Logos', 'Social media creatives', 'Print collateral', 'Digital advertising', 'Platform-specific formats'],
  },
  {
    category: 'Character Design',
    skills: ['Character designing', 'Character modeling', 'Environment assets', 'Visual storytelling'],
  },
] as const

/** Capability areas, each backed by resume lines. */
export const CAPABILITIES = [
  {
    number: '01',
    title: '3D Modeling & Sculpting',
    text: 'Character, hard-surface, organic, product, and interior models in Maya, Blender, 3ds Max, and ZBrush, built for animation as a freelance animator and 3D modeller at Origins Advertising.',
  },
  {
    number: '02',
    title: 'Character & 2D/3D Animation',
    text: 'Keyframe, facial, and body-mechanics animation plus motion-capture cleanup, delivered as character animation for promotional and social content.',
  },
  {
    number: '03',
    title: 'Motion Graphics & Video',
    text: 'After Effects and Cinema 4D motion graphics, Premiere Pro edits for promotional, corporate, and real estate campaigns at Gencosys, Meradoor, and Origins.',
  },
  {
    number: '04',
    title: 'Brand & Graphic Design',
    text: 'Logos, brand visuals, posters, brochures, magazine layouts, and platform-specific social creatives, grounded in typography, composition, and color theory.',
  },
] as const
