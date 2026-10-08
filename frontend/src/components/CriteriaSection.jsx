import { useState } from 'react'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import Button from './ui/Button'
import Container from './ui/Container'
import SectionHeading, { Emphasis } from './ui/SectionHeading'
import { API_URL } from '../constants'
import { formatFcfa } from '../utils/format'
import { useReferenceLabel } from '../hooks/useReferenceLabel'
import { scrollToSection } from '../utils/scroll'

const PREVIEW_SIZE = 3

// Les quatre critères avancés que la recherche sait réellement appliquer.
const CRITERION_IDS = ['budget', 'exams', 'services', 'language']

function CriterionRow({ criterionId }) {
  const { t } = useTranslation('home')

  return (
    <li className="flex items-start gap-3 py-4">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
      </span>
      <span>
        <span className="block text-sm font-bold text-navy">{t(`criteria.${criterionId}.title`)}</span>
        <span className="block text-sm text-ink">{t(`criteria.${criterionId}.description`)}</span>
      </span>
    </li>
  )
}

function PreviewThumbnail({ institution }) {
  const [hasImageFailed, setHasImageFailed] = useState(false)

  if (!institution.cover_url || hasImageFailed) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-deep">
        <GraduationCap aria-hidden="true" className="size-6" />
      </span>
    )
  }

  return (
    <img
      src={`${API_URL}${institution.cover_url}`}
      alt=""
      loading="lazy"
      onError={() => setHasImageFailed(true)}
      className="size-14 shrink-0 rounded-control object-cover"
    />
  )
}

function PreviewRow({ institution, onView }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()

  return (
    <li>
      <button
        type="button"
        onClick={() => onView(institution.uuid)}
        className="group flex min-h-11 w-full cursor-pointer items-center gap-4 py-4 text-left"
      >
        <PreviewThumbnail institution={institution} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-navy transition-colors group-hover:text-primary">
            {institution.name}
          </span>
          <span className="block text-sm text-ink">
            {institution.city} · {translateReference('types', institution.type)}
          </span>
          {institution.min_tuition != null && (
            <span className="block text-xs tabular-nums text-ink-soft">
              {t('criteria.feesFrom', { amount: formatFcfa(institution.min_tuition) })}
            </span>
          )}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-primary"
        />
      </button>
    </li>
  )
}

// La liste de droite n'est pas un exemple inventé : ce sont les premiers
// établissements qui répondent à la recherche en cours.
function CriteriaSection({ institutions, onView }) {
  const { t } = useTranslation(['home', 'common'])
  const previewedInstitutions = institutions.slice(0, PREVIEW_SIZE)

  return (
    <section className="border-t border-line bg-paper py-16 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow={t('criteria.eyebrow')}
            title={<Trans t={t} i18nKey="criteria.title" components={{ emphasis: <Emphasis /> }} />}
            lead={t('criteria.lead')}
          />
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {CRITERION_IDS.map((criterionId) => (
              <CriterionRow key={criterionId} criterionId={criterionId} />
            ))}
          </ul>
          <Button className="group mt-8 rounded-full" onClick={() => scrollToSection('search')}>
            {t('criteria.action')}
            <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        {previewedInstitutions.length > 0 && (
          <div className="rounded-panel border border-line bg-surface p-5 shadow-raised sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-navy">{t('criteria.matching')}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-eyebrow text-ink-soft">
                  {t('criteria.live')}
                </p>
              </div>
              <p className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold tabular-nums text-primary-deep">
                {t('common:schoolCount', { count: institutions.length })}
              </p>
            </div>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {previewedInstitutions.map((institution) => (
                <PreviewRow key={institution.uuid} institution={institution} onView={onView} />
              ))}
            </ul>
            <a
              href="#results"
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-control text-sm font-semibold text-primary-deep transition-colors hover:text-primary"
            >
              {t('criteria.viewAll', { count: institutions.length })}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        )}
      </Container>
    </section>
  )
}

export default CriteriaSection
