import { useEffect, useState } from 'react'
import { ArrowLeft, CircleAlert, Heart, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import SelectionBar from '../components/compare/SelectionBar'
import Footer from '../components/Footer'
import Header from '../components/Header'
import InstitutionCard from '../components/InstitutionCard'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import StateMessage from '../components/ui/StateMessage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePublishedSchools } from '../hooks/usePublishedSchools'
import { useSchoolSelection } from '../hooks/useSchoolSelection'
import { navigateToComparison, navigateToSchool, navigateToSearchResults } from '../routes'
import { MAX_COMPARED_SCHOOLS, canCompare } from '../utils/comparison'

const PAGE_CLASSES = 'min-h-screen overflow-x-clip bg-paper font-sans text-ink'
const SEARCH_RESULTS_HASH = '#results'
const GRID_CLASSES = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'

function SavedSchoolsBody({ catalog, savedSchools }) {
  const { t } = useTranslation('compare')

  if (catalog.status === 'loading') {
    return (
      <div role="status" aria-busy="true" className={`animate-pulse ${GRID_CLASSES}`}>
        <span className="sr-only">{t('loading')}</span>
        <div className="h-96 rounded-panel bg-muted" />
        <div className="hidden h-96 rounded-panel bg-muted md:block" />
      </div>
    )
  }
  if (catalog.status === 'error') {
    return (
      <StateMessage
        tone="danger"
        icon={CircleAlert}
        title={t('errorTitle')}
        description={t('errorDescription')}
        actionLabel={t('retry')}
        onAction={catalog.retry}
      />
    )
  }
  if (savedSchools.length === 0) {
    return (
      <StateMessage
        icon={Heart}
        title={t('saved.emptyTitle')}
        description={t('saved.emptyDescription')}
        actionLabel={t('backToSearch')}
        onAction={navigateToSearchResults}
      />
    )
  }
  return (
    <div className={GRID_CLASSES}>
      {savedSchools.map((school) => (
        <InstitutionCard key={school.uuid} institution={school} onView={navigateToSchool} />
      ))}
    </div>
  )
}

// Comparer ses favoris est un geste voulu : il remplace la sélection en cours
// par cette liste, puis ouvre la comparaison. Au-delà de quatre favoris, le
// bouton disparaît : le visiteur choisit alors lesquels comparer sur les cartes.
function CompareSavedButton({ savedSchools }) {
  const { t } = useTranslation('compare')
  const { replaceCompared } = useSchoolSelection()
  const savedSchoolIds = savedSchools.map((school) => school.uuid)

  if (!canCompare(savedSchoolIds) || savedSchoolIds.length > MAX_COMPARED_SCHOOLS) return null

  const compareSavedSchools = () => {
    replaceCompared(savedSchoolIds)
    navigateToComparison(savedSchoolIds)
  }

  return (
    <Button onClick={compareSavedSchools}>
      <Scale aria-hidden="true" className="size-4" />
      {t('saved.compare')}
    </Button>
  )
}

// Favoris du visiteur, mémorisés sur son appareil. Un favori qui n'est plus
// publié est retiré de la liste, et la page le dit.
function SavedSchoolsPage() {
  const { t } = useTranslation('compare')
  useDocumentTitle(t('saved.title'))
  const { savedIds, replaceSaved } = useSchoolSelection()
  const catalog = usePublishedSchools()
  const [removedCount, setRemovedCount] = useState(0)
  const savedSchools = catalog.schools.filter((school) => savedIds.includes(school.uuid))
  const isLoaded = catalog.status === 'success'
  const unavailableCount = isLoaded ? savedIds.length - savedSchools.length : 0
  const availableIdsKey = savedSchools.map((school) => school.uuid).join(',')

  useEffect(() => {
    if (unavailableCount === 0) return
    setRemovedCount(unavailableCount)
    replaceSaved(availableIdsKey ? availableIdsKey.split(',') : [])
  }, [unavailableCount, availableIdsKey, replaceSaved])

  return (
    <div className={PAGE_CLASSES}>
      <Header />
      <main>
        <Container className="py-12 sm:py-16">
          <a
            href={SEARCH_RESULTS_HASH}
            className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-primary-deep hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t('backToSearch')}
          </a>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              as="h1"
              eyebrow={t('saved.eyebrow')}
              title={t('saved.heading')}
              lead={t('saved.lead')}
            />
            <CompareSavedButton savedSchools={savedSchools} />
          </div>
          {removedCount > 0 && (
            <p
              role="status"
              className="mt-6 rounded-control border border-warning bg-warning-soft px-4 py-3 text-sm text-warning"
            >
              {t('saved.unavailable', { count: removedCount })}
            </p>
          )}
          <div className="mt-10">
            <SavedSchoolsBody catalog={catalog} savedSchools={savedSchools} />
          </div>
        </Container>
      </main>
      <Footer />
      <SelectionBar schools={catalog.schools} />
    </div>
  )
}

export default SavedSchoolsPage
