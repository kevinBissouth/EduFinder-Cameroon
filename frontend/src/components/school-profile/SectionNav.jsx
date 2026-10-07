import Container from '../ui/Container'
import { useActiveSection } from '../../hooks/useActiveSection'
import { scrollToSection } from '../../utils/scroll'

// Onglets collants vers les sections de la fiche. Ce sont des boutons et non
// des liens : le routage du site passe par le « # » de l'adresse, et un lien
// d'ancre ferait quitter la fiche.
function SectionNav({ sections }) {
  const activeSectionId = useActiveSection(sections.map((section) => section.id))

  return (
    <nav
      aria-label="Sections of this profile"
      className="sticky top-16 z-40 border-b border-line bg-surface/95 backdrop-blur-md lg:top-20"
    >
      <Container>
        <ul className="-mx-3 flex gap-1 overflow-x-auto">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId
            return (
              <li key={section.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => scrollToSection(section.id)}
                  className={`h-12 cursor-pointer whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'border-primary text-primary-deep'
                      : 'border-transparent text-ink-soft hover:text-navy'
                  }`}
                >
                  {section.label}
                </button>
              </li>
            )
          })}
        </ul>
      </Container>
    </nav>
  )
}

export default SectionNav
