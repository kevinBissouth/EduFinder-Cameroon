import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Link2, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ComparedSchoolsStrip from '../components/compare/ComparedSchoolsStrip'
import ComparisonBoard from '../components/compare/ComparisonBoard'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import StateMessage from '../components/ui/StateMessage'
import { useComparedSchools } from '../hooks/useComparedSchools'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import useFiltersMeta from '../hooks/useFiltersMeta'
import { useLinkCopy } from '../hooks/useLinkCopy'
import { useSchoolSelection } from '../hooks/useSchoolSelection'
import { navigateToComparison, navigateToSearchResults } from '../routes'
import { canCompare, includesAllIds, isSameSelection } from '../utils/comparison'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

const PAGE_CLASSES = 'min-h-screen overflow-x-clip bg-paper font-sans text-ink'
const SEARCH_RESULTS_HASH = '#results'

// Le message a sa ligne réservée sous le bouton : il apparaît et disparaît
// sans déplacer le bouton ni le titre.
function CopyLinkButton() {
  const { t } = useTranslation('compare')
  const { copyStatus, copyCurrentLink } = useLinkCopy()
  const statusMessages = { idle: '', copied: t('linkCopied'), failed: t('copyFailed') }
  const CopyIcon = copyStatus === 'copied' ? Check : Link2

  return (
    <div>
      <Button variant="secondary" onClick={copyCurrentLink}>
        <CopyIcon aria-hidden="true" className="size-4" />
        {t('copyLink')}
      </Button>
      <p role="status" className="mt-1 min-h-5 text-sm font-medium text-ink-soft">
        {statusMessages[copyStatus]}
      </p>
    </div>
  )
}

function SharedSelectionNotice({ onKeep }) {
  const { t } = useTranslation('compare')

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-control border border-line bg-surface px-4 py-3">
      <p className="text-sm text-ink">{t('shared.notice')}</p>
      <Button variant="secondary" onClick={onKeep}>
        {t('shared.keep')}
      </Button>
    </div>
  )
}

function ComparisonSkeleton() {
  const { t } = useTranslation('compare')

  return (
    <div role="status" aria-busy="true" className="animate-pulse">
      <span className="sr-only">{t('loading')}</span>
      <div className="h-96 rounded-panel bg-muted" />
    </div>
  )
}

// Les états d'attente, de panne et de comparaison incomplète gardent la
// largeur de page ; la comparaison elle-même gère la sienne (ses onglets
// collants occupent toute la largeur de l'écran).
function ComparisonBody({ comparison, examAllowedTypes }) {
  const { t } = useTranslation('compare')

  if (comparison.status === 'loading') {
    return (
      <Container className="py-8 sm:py-12">
        <ComparisonSkeleton />
      </Container>
    )
  }
  if (comparison.status === 'error') {
    return (
      <Container className="py-8 sm:py-12">
        <StateMessage
          tone="danger"
          icon={CircleAlert}
          title={t('errorTitle')}
          description={t('errorDescription')}
          actionLabel={t('retry')}
          onAction={comparison.retry}
        />
      </Container>
    )
  }
  if (!canCompare(comparison.schools)) {
    const hasOneSchool = comparison.schools.length === 1
    return (
      <Container className="py-8 sm:py-12">
        <StateMessage
          icon={Scale}
          title={hasOneSchool ? t('needOneMoreTitle') : t('emptyTitle')}
          description={hasOneSchool ? t('needOneMoreDescription') : t('emptyDescription')}
          actionLabel={t('backToSearch')}
          onAction={navigateToSearchResults}
        />
      </Container>
    )
  }
  return <ComparisonBoard schools={comparison.schools} examAllowedTypes={examAllowedTypes} />
}

// Un lien reçu ne remplace pas la sélection du visiteur : il la garde tant
// qu'il ne choisit pas « Garder cette sélection ». La comparaison est la
// sienne si elle correspondait à sa sélection en arrivant ; retirer une
// colonne la laisse sienne (le lien n'en est plus qu'une partie), alors qu'un
// autre lien ouvert dans le même onglet apporte un établissement inconnu.
function useSelectionOwnership(schoolIds, comparison) {
  const { comparedIds, replaceCompared } = useSchoolSelection()
  const [ownedIds, setOwnedIds] = useState(() =>
    isSameSelection(schoolIds, comparedIds) ? schoolIds : null,
  )
  const isOwnSelection = ownedIds !== null && includesAllIds(ownedIds, schoolIds)
  const isLoaded = comparison.status === 'success'
  const loadedIdsKey = comparison.schools.map((school) => school.uuid).join(',')

  // La sélection mémorisée suit ce qui est réellement affiché : un
  // établissement retiré ou plus publié en sort.
  useEffect(() => {
    if (isLoaded && isOwnSelection) replaceCompared(loadedIdsKey ? loadedIdsKey.split(',') : [])
  }, [isLoaded, isOwnSelection, loadedIdsKey, replaceCompared])

  return { isOwnSelection, keepSelection: () => setOwnedIds(schoolIds) }
}

// Page de comparaison. Son adresse porte les identifiants : la copier suffit
// à partager la même comparaison.
function ComparePage({ schoolIds }) {
  const pageRef = useRef(null)
  useRevealOnScroll(pageRef)
  const { t } = useTranslation('compare')
  useDocumentTitle(t('title'))
  const { meta } = useFiltersMeta()
  const comparison = useComparedSchools(schoolIds)
  const { isOwnSelection, keepSelection } = useSelectionOwnership(schoolIds, comparison)
  const isLoaded = comparison.status === 'success'
  const isComparable = isLoaded && canCompare(comparison.schools)

  const removeSchool = (removedId) =>
    navigateToComparison(
      comparison.schools.map((school) => school.uuid).filter((schoolId) => schoolId !== removedId),
    )

  return (
    <div className={PAGE_CLASSES}>
      <Header />
      <main ref={pageRef}>
        {/* Le titre et les photos des établissements ouvrent la page sur un
            fond bleu très clair, les thèmes suivent. */}
        <section className="relative overflow-hidden bg-linear-to-b from-primary-soft/70 to-surface">
          {/* Deux halos flous, purement décoratifs, pour que le haut de page
              ne soit pas un simple aplat. */}
          <span
            aria-hidden="true"
            className="absolute -right-24 -top-24 size-96 rounded-full bg-violet/25 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute -left-32 top-1/2 size-96 rounded-full bg-primary/10 blur-3xl"
          />
          <Container className="relative pb-8 pt-6 sm:pb-12 sm:pt-10">
            <a
              href={SEARCH_RESULTS_HASH}
              className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-primary-deep hover:text-primary"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('backToSearch')}
            </a>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <SectionHeading
                as="h1"
                eyebrow={t('eyebrow')}
                title={t('heading')}
                lead={t('lead')}
              />
              {isComparable && <CopyLinkButton />}
            </div>
            {isComparable && !isOwnSelection && <SharedSelectionNotice onKeep={keepSelection} />}
            {isLoaded && comparison.missingCount > 0 && (
              <p
                role="status"
                className="mt-6 rounded-control border border-warning bg-warning-soft px-4 py-3 text-sm text-warning"
              >
                {t('unavailable', { count: comparison.missingCount })}
              </p>
            )}
            {isComparable && (
              <div className="mt-8 animate-settle">
                <ComparedSchoolsStrip schools={comparison.schools} onRemoveSchool={removeSchool} />
              </div>
            )}
          </Container>
        </section>
        <ComparisonBody comparison={comparison} examAllowedTypes={meta.exam_allowed_types} />
      </main>
      <Footer />
    </div>
  )
}

export default ComparePage
