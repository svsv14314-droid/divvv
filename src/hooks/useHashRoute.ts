import { useEffect, useState } from 'react'

export type Route = { view: 'home'; section: string | null } | { view: 'project'; slug: string }

const PROJECT_PREFIX = '#/projects/'

export const projectHref = (slug: string) => `${PROJECT_PREFIX}${slug}`

/**
 * Hash routing without a router dependency, so the site still deploys as
 * static files (GitHub Pages included). `#/projects/<slug>` is a project page;
 * any other hash (`#about`, `#contact`) is a section anchor on the home page.
 */
function parse(hash: string): Route {
  if (hash.startsWith(PROJECT_PREFIX)) {
    return { view: 'project', slug: decodeURIComponent(hash.slice(PROJECT_PREFIX.length)) }
  }
  return { view: 'home', section: hash.length > 1 ? hash.slice(1) : null }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))

  useEffect(() => {
    const handleChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', handleChange)
    return () => window.removeEventListener('hashchange', handleChange)
  }, [])

  return route
}
