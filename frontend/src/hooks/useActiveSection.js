import { useEffect, useState } from 'react'

// Bande de l'écran dans laquelle une section est considérée comme « en cours
// de lecture » : sous l'en-tête et les onglets collants, dans le tiers haut.
const READING_BAND_MARGIN = '-25% 0px -65% 0px'

// Identifiant de la section actuellement lue, pour surligner son onglet.
export function useActiveSection(sectionIds) {
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0])
  const watchedIds = sectionIds.join(',')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const readSection = entries.find((entry) => entry.isIntersecting)
        if (readSection) setActiveSectionId(readSection.target.id)
      },
      { rootMargin: READING_BAND_MARGIN },
    )
    watchedIds
      .split(',')
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean)
      .forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [watchedIds])

  return activeSectionId
}
