import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Footer from '../components/Footer'
import Header from '../components/Header'
import Container from '../components/ui/Container'
import { SITE_PUBLISHER } from '../constants'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { HOME_PATH } from '../routes'
import { formatShortDate } from '../utils/format'

// Date de la dernière relecture des textes : à avancer quand ils changent.
const LAST_UPDATED_ON = '2026-10-09'

// Les deux pages légales ont la même forme, seules leurs sections changent.
// L'ordre des sections est celui de la lecture ; leurs textes sont dans
// l'espace « legal » des traductions.
const LEGAL_DOCUMENTS = {
  notice: ['publisher', 'hosting', 'content', 'independence', 'report', 'rights'],
  privacy: ['summary', 'device', 'counters', 'contact', 'thirdParties', 'accounts', 'rights'],
}

function LegalSection({ documentKey, sectionId }) {
  const { t } = useTranslation('legal')
  const sectionKey = `${documentKey}.sections.${sectionId}`

  return (
    <section className="border-t border-line py-8">
      <h2 className="font-display text-2xl text-navy">{t(`${sectionKey}.title`)}</h2>
      {/* Un saut de ligne double dans le texte sépare deux paragraphes. */}
      <p className="mt-3 whitespace-pre-line text-pretty text-base text-ink">
        {t(`${sectionKey}.body`, { publisher: SITE_PUBLISHER.name, email: SITE_PUBLISHER.email })}
      </p>
    </section>
  )
}

// Mentions légales ou confidentialité, selon documentKey.
function LegalPage({ documentKey }) {
  const { t } = useTranslation('legal')
  useDocumentTitle(t(`${documentKey}.title`))

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <Header />
      <main>
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            <a
              href={HOME_PATH}
              className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-primary-deep hover:text-primary"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('backToHome')}
            </a>
            <h1 className="mt-4 text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl">
              {t(`${documentKey}.title`)}
            </h1>
            <p className="mt-4 text-pretty text-lg text-ink">{t(`${documentKey}.lead`)}</p>
            <p className="mb-8 mt-2 text-sm text-ink-soft">
              {t('updated', { date: formatShortDate(LAST_UPDATED_ON) })}
            </p>
            {LEGAL_DOCUMENTS[documentKey].map((sectionId) => (
              <LegalSection key={sectionId} documentKey={documentKey} sectionId={sectionId} />
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}

export default LegalPage
