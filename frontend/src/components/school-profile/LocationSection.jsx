import { lazy, Suspense } from 'react'
import { MapPin } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import ContactCard from './ContactCard'
import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

// La carte embarque sa bibliothèque (Leaflet) : elle est chargée à part, quand
// une fiche l'affiche, pour ne pas peser sur le premier affichage du site.
const SchoolMap = lazy(() => import('./SchoolMap'))

// Pendant le chargement, un bloc de la taille de la carte tient sa place :
// le contact à côté ne saute pas quand elle arrive.
function MapPlaceholder() {
  return <div aria-hidden="true" className="h-80 w-full animate-pulse rounded-panel bg-muted" />
}

// Une école sans coordonnées précises n'a pas de carte : on la situe alors
// par sa ville et sa région.
function LocationSection({ institution }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const hasCoordinates = institution.latitude != null && institution.longitude != null
  const place = [
    institution.address,
    institution.city,
    translateReference('regions', institution.region),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section id="contact" className="scroll-mt-36 border-t border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow={t('location.eyebrow')}
          title={<Trans t={t} i18nKey="location.title" components={{ emphasis: <Emphasis /> }} />}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
          {hasCoordinates ? (
            <Suspense fallback={<MapPlaceholder />}>
              <SchoolMap latitude={institution.latitude} longitude={institution.longitude} />
            </Suspense>
          ) : (
            <p className="flex h-full min-h-40 items-center gap-3 rounded-panel border border-line bg-paper p-6 text-base text-ink">
              <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary" />
              {t('location.noPosition', { place })}
            </p>
          )}
          <div className="self-start">
            <ContactCard institution={institution} />
          </div>
        </div>
      </Container>
    </section>
  )
}

export default LocationSection
