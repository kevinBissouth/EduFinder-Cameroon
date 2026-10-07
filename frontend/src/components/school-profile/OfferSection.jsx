import { Activity, BedDouble, BookOpen, Bus, FlaskConical, GraduationCap, Utensils, Wrench } from 'lucide-react'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'

// Icône d'un service déduite de son libellé, en français comme en anglais.
// La première règle qui reconnaît le libellé l'emporte.
const SERVICE_ICON_RULES = [
  { pattern: /biblioth|library/, icon: BookOpen },
  { pattern: /cantin|restaur|canteen/, icon: Utensils },
  { pattern: /internat|board|foyer|héberg/, icon: BedDouble },
  { pattern: /labor|labo|science|santé|health|hôpit/, icon: FlaskConical },
  { pattern: /sport/, icon: Activity },
  { pattern: /bus|transport/, icon: Bus },
  { pattern: /atelier|workshop/, icon: Wrench },
]

function findServiceIcon(serviceName) {
  const lowercaseName = serviceName.toLowerCase()
  return SERVICE_ICON_RULES.find((rule) => rule.pattern.test(lowercaseName))?.icon ?? GraduationCap
}

function ServiceRow({ service }) {
  const ServiceIcon = findServiceIcon(service.name)

  return (
    <li className="flex items-start gap-4 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-deep">
        <ServiceIcon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-navy">{service.name}</p>
        {service.description && <p className="text-sm text-ink">{service.description}</p>}
      </div>
    </li>
  )
}

function OfferSection({ programs, services }) {
  if (programs.length === 0 && services.length === 0) return null

  return (
    <section id="offer" className="scroll-mt-36 border-t border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow="Programs and services"
          title={
            <>
              The details that shape <Emphasis>daily</Emphasis> school life.
            </>
          }
        />
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {programs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-navy">Programs</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {programs.map((program) => (
                  <li key={program} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-navy">
                    {program}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {services.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-navy">Services on site</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {services.map((service) => (
                  <ServiceRow key={service.name} service={service} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export default OfferSection
