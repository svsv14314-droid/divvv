import { useEffect, useRef } from 'react'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Intro from './components/Intro'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Expertise from './components/Expertise'
import Skills from './components/Skills'
import Contact from './components/Contact'
import ProjectPage from './components/ProjectPage'
import Footer from './components/Footer'
import { useHashRoute } from './hooks/useHashRoute'
import { useStudioPointer } from './hooks/useStudioPointer'
import { projectBySlug } from './data/projects'

function App() {
  const route = useHashRoute()
  useStudioPointer()
  const project = route.view === 'project' ? projectBySlug(route.slug) : undefined
  const showProject = Boolean(project)

  // Arriving on the home page from a project page (or on first load), the
  // target section has only just mounted, so jump to it explicitly. Within
  // the home page, the browser's own anchor scrolling handles it.
  const cameFromElsewhere = useRef(true)
  useEffect(() => {
    if (showProject) {
      cameFromElsewhere.current = true
      return
    }
    if (!cameFromElsewhere.current) return
    cameFromElsewhere.current = false

    // An unknown project slug falls back to the projects grid.
    const section = route.view === 'project' ? 'projects' : route.section
    const target = section ? document.getElementById(section) : null
    if (target) target.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route, showProject])

  return (
    <>
      <Preloader />
      <Navbar />

      {project ? (
        <main>
          <ProjectPage key={project.slug} project={project} />
        </main>
      ) : (
        <main id="top">
          <Hero />
          <Marquee />
          <Intro />
          <About />
          <Experience />
          <Projects />
          <Expertise />
          <Skills />
          <Contact />
        </main>
      )}

      <Footer />
    </>
  )
}

export default App
