import { useState } from 'react'
import { ArrowUpRight, Check, Mail, MapPin, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Container from '../ui/Container'
import { Emphasis, Eyebrow } from '../ui/SectionHeading'
import { buildContactHref, splitLastWord, toExternalUrl } from './helpers'
import { CompareToggle, SaveToggle } from '../compare/SchoolToggles'
import { API_URL } from '../../constants'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { trackInstitutionEvent } from '../../utils/tracking'
import { useLinkCopy } from '../../hooks/useLinkCopy'


function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Le dernier mot du nom est mis en italique bleu, comme un mot d'accroche.
function ProfileTitle({ name }) {
  const { leadingWords, lastWord } = splitLastWord(name)

  return (
    <h1 className="mt-5 text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl">
      {leadingWords} <Emphasis>{lastWord}</Emphasis>
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

// Le message « lien copié » s'affiche dans une bulle au-dessus du bouton : en
// ligne, il poussait les autres boutons. La bulle reste dans la page même
// vide, pour que les lecteurs d'écran annoncent son texte quand il arrive.
function ShareButton() {
  const { t } = useTranslation('profile')
  const { copyStatus, copyCurrentLink } = useLinkCopy()

  const statusMessages = {
    idle: '',
    copied: t('hero.linkCopied'),
    failed: t('hero.copyFailed'),
  }

  return (
    <div className="relative sm:flex-1">
      <button
        type="button"
        aria-label={t('hero.copyLink')}
        title={t('hero.copyLink')}
        onClick={copyCurrentLink}
        className="flex h-11 w-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-navy transition hover:border-primary hover:text-primary-deep active:scale-95 sm:w-full"
      >
        {copyStatus === 'copied' ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Share2 aria-hidden="true" className="size-4" />
        )}
      </button>
      <p
        role="status"
        className="absolute bottom-full right-0 mb-2 animate-menu-drop whitespace-nowrap rounded-control bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-raised empty:hidden"
      >
        {statusMessages[copyStatus]}
      </p>
    </div>
  )
}

// Sur téléphone un lien prend toute la largeur ; au-delà il tient dans sa
// colonne de la grille des actions.
const LINK_CLASSES = 'rounded-full max-sm:col-span-2'

// Contacter est l'action principale de la fiche. Sans courriel ni téléphone
// publié, le bouton n'existe pas.
function ContactLink({ institution }) {
  const { t } = useTranslation('profile')
  const contactHref = buildContactHref(institution)
  if (!contactHref) return null

  return (
    <Button
      as="a"
      href={contactHref}
      className={LINK_CLASSES}
      onClick={() => trackInstitutionEvent(institution.uuid, 'inquiry')}
    >
      <Mail aria-hidden="true" className="size-4" />
      {t('hero.contact')}
    </Button>
  )
}

// Le lien vers le site fait quitter la fiche : il passe au second plan.
function WebsiteLink({ institution }) {
  const { t } = useTranslation('profile')
  const websiteUrl = toExternalUrl(institution.website)
  if (!websiteUrl) return null

  return (
    <Button
      as="a"
      href={websiteUrl}
      variant="secondary"
      className={LINK_CLASSES}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('hero.visitWebsite')}
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </Button>
  )
}

// Une grille de deux colonnes : les liens vers l'établissement sur la
// première ligne, les outils du visiteur (comparer, garder, partager) sur la
// seconde. « Comparer » commence toujours la première colonne, sous
// « Contacter » : les deux boutons ont ainsi la même largeur, celle du plus
// long. Le cœur et le partage s'élargissent pour couvrir ensemble la seconde
// colonne. S'il manque un lien, ou les deux, la grille se resserre sans trou.
function ProfileActions({ institution }) {
  return (
    <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[auto_auto] sm:justify-start">
      <ContactLink institution={institution} />
      <WebsiteLink institution={institution} />
      <CompareToggle schoolId={institution.uuid} className="col-start-1" />
      <div className="flex items-center gap-3">
        <SaveToggle schoolId={institution.uuid} className="sm:flex-1" />
        <ShareButton />
      </div>
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
