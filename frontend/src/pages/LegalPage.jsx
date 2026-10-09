import {
  BarChart3,
  Building2,
  Check,
  Copyright,
  Flag,
  Globe,
  KeyRound,
  Mail,
  MessageCircle,
  Scale,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  UserRoundCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Footer from '../components/Footer'
import Header from '../components/Header'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { SITE_PUBLISHER } from '../constants'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { LEGAL_NOTICE_PATH, PRIVACY_PATH } from '../routes'
import { formatShortDate } from '../utils/format'

// Date de la dernière relecture des textes : à avancer quand ils changent.
const LAST_UPDATED_ON = '2026-10-09'

// Les deux pages légales ont la même forme, seul leur contenu change. L'ordre
// des sections est celui de la lecture ; leurs textes sont dans l'espace
// « legal » des traductions.
const LEGAL_DOCUMENTS = {
  notice: {
    path: LEGAL_NOTICE_PATH,
    icon: Scale,
    highlights: ['independent', 'reviewed', 'reportable'],
    sections: [
      { id: 'publisher', icon: UserRound },
      { id: 'hosting', icon: Server },
      { id: 'content', icon: Building2 },
      { id: 'independence', icon: Scale },
      { id: 'report', icon: Flag },
      { id: 'rights', icon: Copyright },
    ],
  },
  privacy: {
    path: PRIVACY_PATH,
    icon: ShieldCheck,
    highlights: ['noAccount', 'noAdvertising', 'noTracker'],
    sections: [
      { id: 'summary', icon: Sparkles },
      { id: 'device', icon: Smartphone },
      { id: 'counters', icon: BarChart3 },
      { id: 'contact', icon: MessageCircle },
      { id: 'thirdParties', icon: Globe },
      { id: 'accounts', icon: KeyRound },
      { id: 'rights', icon: UserRoundCheck },
    ],
  },
}
const DOCUMENT_KEYS = Object.keys(LEGAL_DOCUMENTS)

// Passage d'un document à l'autre, en haut de page : on voit qu'il y en a
// deux et lequel on lit.
function DocumentSwitch({ activeDocumentKey }) {
  const { t } = useTranslation('legal')

  return (
    <nav aria-label={t('documents')} className="inline-flex rounded-full border border-line bg-surface p-1 shadow-soft">
      {DOCUMENT_KEYS.map((documentKey) => {
        const isActive = documentKey === activeDocumentKey
        return (
          <a
            key={documentKey}
            href={LEGAL_DOCUMENTS[documentKey].path}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
              isActive ? 'bg-navy text-white' : 'text-navy hover:text-primary-deep'
            }`}
          >
            {t(`${documentKey}.title`)}
          </a>
        )
      })}
    </nav>
  )
}

function Highlights({ documentKey }) {
  const { t } = useTranslation('legal')

  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-3">
      {LEGAL_DOCUMENTS[documentKey].highlights.map((highlightId) => (
        <li
          key={highlightId}
          className="flex items-center gap-3 rounded-control border border-line bg-surface p-4 text-sm font-semibold text-navy shadow-soft"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
            <Check aria-hidden="true" className="size-4" />
          </span>
          {t(`${documentKey}.highlights.${highlightId}`)}
        </li>
      ))}
    </ul>
  )
}

function DocumentHero({ documentKey }) {
  const { t } = useTranslation('legal')
  const DocumentIcon = LEGAL_DOCUMENTS[documentKey].icon

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-primary-soft/70 to-surface">
      <span aria-hidden="true" className="absolute -right-24 -top-24 size-96 rounded-full bg-violet/25 blur-3xl" />
      <span aria-hidden="true" className="absolute -left-32 top-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
      <Container className="relative py-10 sm:py-14">
        <DocumentSwitch activeDocumentKey={documentKey} />
        <div className="mt-8 flex items-start gap-4 sm:gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-panel bg-linear-to-br from-primary to-violet-deep text-white shadow-glow max-sm:hidden">
            <DocumentIcon aria-hidden="true" className="size-7" />
          </span>
          <div>
            <h1 className="text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl">
              {t(`${documentKey}.title`)}
            </h1>
            <p className="mt-4 max-w-[60ch] text-pretty text-lg text-ink">{t(`${documentKey}.lead`)}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {t('updated', { date: formatShortDate(LAST_UPDATED_ON) })}
            </p>
          </div>
        </div>
        <Highlights documentKey={documentKey} />
      </Container>
    </section>
  )
}

// Sommaire, visible sur grand écran seulement : il reste à l'écran pendant
// la lecture. Chaque lien est une ancre de la page en cours.
function SectionsOutline({ documentKey }) {
  const { t } = useTranslation('legal')

  return (
    <nav aria-label={t('onThisPage')} className="sticky top-28 hidden self-start lg:block">
      <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-deep">{t('onThisPage')}</p>
      <ul className="mt-3 border-l border-line">
        {LEGAL_DOCUMENTS[documentKey].sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="-ml-px flex min-h-10 items-center border-l-2 border-transparent pl-4 text-sm text-ink transition-colors hover:border-primary hover:text-primary-deep"
            >
              {t(`${documentKey}.sections.${section.id}.title`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function LegalSection({ documentKey, section }) {
  const { t } = useTranslation('legal')
  const sectionKey = `${documentKey}.sections.${section.id}`

  return (
    <section
      id={section.id}
      className="scroll-mt-28 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-deep">
          <section.icon aria-hidden="true" className="size-5" />
        </span>
        <h2 className="font-display text-2xl text-navy">{t(`${sectionKey}.title`)}</h2>
      </div>
      {/* Un saut de ligne double dans le texte sépare deux paragraphes. */}
      <p className="mt-4 whitespace-pre-line text-pretty text-base text-ink">
        {t(`${sectionKey}.body`, { publisher: SITE_PUBLISHER.name, email: SITE_PUBLISHER.email })}
      </p>
    </section>
  )
}

function PublisherContact() {
  const { t } = useTranslation('legal')

  return (
    <aside className="relative overflow-hidden rounded-panel bg-navy p-6 [--focus-ring:var(--color-accent)] sm:p-8">
      <span
        aria-hidden="true"
        className="absolute -right-16 -top-16 size-56 rounded-full bg-radial from-primary/30 to-transparent to-70%"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">{t('contact.title')}</h2>
          <p className="mt-2 text-sm text-on-navy-soft">{t('contact.lead')}</p>
        </div>
        <Button as="a" href={`mailto:${SITE_PUBLISHER.email}`} variant="accent" className="rounded-full max-sm:w-full">
          <Mail aria-hidden="true" className="size-4" />
          {t('contact.action')}
        </Button>
      </div>
    </aside>
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
        <DocumentHero documentKey={documentKey} />
        <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <SectionsOutline documentKey={documentKey} />
          <div className="grid max-w-3xl gap-5">
            {LEGAL_DOCUMENTS[documentKey].sections.map((section) => (
              <LegalSection key={section.id} documentKey={documentKey} section={section} />
            ))}
            <PublisherContact />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}

export default LegalPage
