import { MapPin } from 'lucide-react'

import ContactCard from './ContactCard'
import SchoolMap from './SchoolMap'
import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'

// Une école sans coordonnées précises n'a pas de carte : on la situe alors
// par sa ville et sa région.
function LocationSection({ institution }) {
  const hasCoordinates = institution.latitude != null && institution.longitude != null
  const place = [institution.address, institution.city, institution.region].filter(Boolean).join(', ')

  return (
    <section id="contact" className="scroll-mt-36 border-t border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow="Location and contact"
          title={
            <>
              Find the school and <Emphasis>get in touch.</Emphasis>
            </>
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
          {hasCoordinates ? (
            <SchoolMap latitude={institution.latitude} longitude={institution.longitude} />
          ) : (
            <p className="flex h-full min-h-40 items-center gap-3 rounded-panel border border-line bg-paper p-6 text-base text-ink">
              <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary" />
              {place}. This school has not published a precise position yet.
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
