import { useState } from 'react'
import { ArrowUpRight, Check, Mail, MapPin, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Container from '../ui/Container'
import { Emphasis, Eyebrow } from '../ui/SectionHeading'
import { buildContactHref, toExternalUrl } from './helpers'
import { API_URL } from '../../constants'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { trackInstitutionEvent } from '../../utils/tracking'

const COPY_FEEDBACK_MILLISECONDS = 2500

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Le dernier mot du nom est mis en italique bleu, comme un mot d'accroche.
// Un nom d'un seul mot reste entier, sans mise en avant.
function ProfileTitle({ name }) {
  const words = name.trim().split(/\s+/)
  const lastWord = words.pop()

  return (
    <h1 className="mt-5 text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl">
      {words.length > 0 ? (
        <>
          {words.join(' ')} <Emphasis>{lastWord}</Emphasis>
        </>
      ) : (
        lastWord
      )}
    </h1>
  )
}

function Breadcrumb({ institution }) {
  const { t } = useTranslation('profile')

  return (
    <nav aria-label={t('hero.breadcrumb')}>
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
        <li>
          <a href="#/" className="inline-flex min-h-11 items-center rounded-control transition-colors hover:text-primary-deep">
            {t('hero.schools')}
          </a>
        </li>
        <li aria-hidden="true">/</li>
        <li>{institution.city}</li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-semibold text-navy">
          {institution.name}
        </li>
      </ol>
    </nav>
  )
}

// Copie l'adresse de la fiche dans le presse-papiers et le confirme. Si le
// navigateur refuse, le bouton le dit au lieu d'échouer en silence.
function ShareButton() {
  const { t } = useTranslation('profile')
  const [copyStatus, setCopyStatus] = useState('idle')

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_MILLISECONDS)
  }

  const statusMessages = {
    idle: '',
    copied: t('hero.linkCopied'),
    failed: t('hero.copyFailed'),
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={t('hero.copyLink')}
        title={t('hero.copyLink')}
        onClick={copyProfileLink}
        className="flex size-11 cursor-pointer items-center justify-center rounded-button border border-line bg-surface text-navy transition-colors hover:border-primary hover:text-primary-deep"
      >
        {copyStatus === 'copied' ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Share2 aria-hidden="true" className="size-4" />
        )}
      </button>
      <p role="status" className="text-sm font-medium text-ink-soft">
        {statusMessages[copyStatus]}
      </p>
    </div>
  )
}

function ProfileActions({ institution }) {
  const { t } = useTranslation('profile')
  const websiteUrl = toExternalUrl(institution.website)
  const contactHref = buildContactHref(institution)

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {/* Contacter l'établissement est l'action principale : le lien vers
          son site fait quitter la fiche, il passe au second plan. */}
      {contactHref && (
        <Button
          as="a"
          href={contactHref}
          onClick={() => trackInstitutionEvent(institution.uuid, 'inquiry')}
        >
          <Mail aria-hidden="true" className="size-4" />
          {t('hero.contact')}
        </Button>
      )}
      {websiteUrl && (
        <Button
          as="a"
          href={websiteUrl}
          variant="secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('hero.visitWebsite')}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>
      )}
      <ShareButton />
    </div>
  )
}

// Sur téléphone et tablette, la photo occupe toute la largeur de l'écran, en
// rectangle ; un fondu vers la couleur de la page la raccorde au texte qui
// suit. Sans photo, rien ne s'affiche : le titre ouvre alors la page.
function MobileCover({ institution, photoUrl, onPhotoError }) {
  const { t } = useTranslation('profile')
  if (!photoUrl) return null

  return (
    <div className="relative h-60 sm:h-80 lg:hidden">
      <img
        src={photoUrl}
        alt={t('hero.photoAlt', { name: institution.name, city: institution.city })}
        onError={onPhotoError}
        className="size-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-surface to-transparent"
      />
    </div>
  )
}

// Sur grand écran, la photo est dans une forme de galet, entourée d'une
// orbite pointillée. Sans photo, la forme reste, en bleu nuit, avec le nom.
function ProfilePhoto({ institution, photoUrl, onPhotoError }) {
  const { t } = useTranslation('profile')

  return (
    <div className="relative mx-auto hidden aspect-5/4 w-full max-w-md lg:block">
      <span aria-hidden="true" className="absolute -inset-5 rounded-full border border-dashed border-line" />
      <span aria-hidden="true" className="absolute -top-6 left-1/2 size-3 rounded-full bg-violet" />
      <span aria-hidden="true" className="absolute -bottom-3 right-1/4 size-3 rounded-full bg-violet" />
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={t('hero.photoAlt', { name: institution.name, city: institution.city })}
          onError={onPhotoError}
          className="shape-blob relative size-full object-cover shadow-raised"
        />
      ) : (
        <div className="shape-blob relative flex size-full flex-col justify-center bg-navy px-12">
          <p className="text-2xl text-white">{institution.name}</p>
          <p className="text-2xl text-violet">{institution.city}</p>
        </div>
      )}
    </div>
  )
}

function ProfileHero({ institution, coverUrl }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const tags = [
    capitalize(translateReference('sectors', institution.sector)),
    translateReference('types', institution.type),
    translateReference('sections', institution.linguistic_section),
  ].filter(Boolean)
  const location = [institution.city, translateReference('regions', institution.region)]
    .filter(Boolean)
    .join(', ')
  // Une photo qui ne se charge pas est traitée comme une photo absente, pour
  // les deux mises en page à la fois.
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const photoUrl = coverUrl && !hasPhotoFailed ? `${API_URL}${coverUrl}` : null
  const photoProps = { institution, photoUrl, onPhotoError: () => setHasPhotoFailed(true) }

  return (
    <section className="bg-surface">
      <MobileCover {...photoProps} />
      <Container className="grid items-center gap-14 pb-14 pt-4 sm:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
        <div className="animate-settle">
          <Breadcrumb institution={institution} />
          <div className="mt-6">
            <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          </div>
          <ProfileTitle name={institution.name} />
          <p className="mt-5 flex items-center gap-2 text-base text-ink">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {location}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-navy">
                {tag}
              </li>
            ))}
          </ul>
          {institution.description && (
            <p className="mt-6 line-clamp-3 max-w-[60ch] text-pretty text-base text-ink">
              {institution.description}
            </p>
          )}
          <ProfileActions institution={institution} />
        </div>

        <ProfilePhoto {...photoProps} />
      </Container>
    </section>
  )
}

export default ProfileHero
