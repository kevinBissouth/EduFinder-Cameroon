import { ArrowRight } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Container from '../ui/Container'
import { Emphasis } from '../ui/SectionHeading'

// Panneau de fin de fiche : il ramène vers la liste pour continuer à comparer.
function ProfileCta() {
  const { t } = useTranslation('profile')

  return (
    <section className="bg-paper py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-panel bg-navy px-6 py-12 [--focus-ring:var(--color-accent)] sm:px-12 sm:py-16">
          <span
            aria-hidden="true"
            className="absolute -right-24 -top-24 size-80 rounded-full bg-radial from-primary/30 to-transparent to-70%"
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance font-display text-3xl leading-display tracking-tight text-white sm:text-5xl">
                <Trans t={t} i18nKey="cta.title" components={{ emphasis: <Emphasis /> }} />
              </h2>
              <p className="mt-5 text-pretty text-base text-on-navy-soft sm:text-lg">
                {t('cta.lead')}
              </p>
            </div>
            <Button as="a" href="#results" size="lg" className="group self-start rounded-full lg:self-auto">
              {t('cta.action')}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default ProfileCta
