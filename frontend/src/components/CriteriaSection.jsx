import { useState } from 'react'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'

import Button from './ui/Button'
import Container from './ui/Container'
import SectionHeading, { Emphasis } from './ui/SectionHeading'
import { API_URL } from '../constants'
import { formatFcfa } from '../utils/format'
import { scrollToSection } from '../utils/scroll'

const PREVIEW_SIZE = 3

// Les quatre critères avancés que la recherche sait réellement appliquer.
const CRITERIA = [
  { title: 'Yearly budget', description: 'Set the fee range that suits your family.' },
  { title: 'Exam results', description: 'Ask for a minimum pass rate, exam by exam.' },
  { title: 'Services', description: 'Canteen, boarding, transport and more.' },
  {
    title: 'Language and sector',
    description: 'Francophone, anglophone or bilingual, public or private.',
  },
]

function CriterionRow({ criterion }) {
  return (
    <li className="flex items-start gap-3 py-4">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
      </span>
      <span>
        <span className="block text-sm font-bold text-navy">{criterion.title}</span>
        <span className="block text-sm text-ink">{criterion.description}</span>
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
            {institution.city} · {institution.type}
          </span>
          {institution.min_tuition != null && (
            <span className="block text-xs tabular-nums text-ink-soft">
              From {formatFcfa(institution.min_tuition)} / year, as listed
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
  const previewedInstitutions = institutions.slice(0, PREVIEW_SIZE)

  return (
    <section className="border-t border-line bg-paper py-16 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Refine your search"
            title={
              <>
                Your family&apos;s criteria. Compared with <Emphasis>clarity.</Emphasis>
              </>
            }
            lead="Tell the search what matters most. It keeps only the schools that meet every criterion you set."
          />
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {CRITERIA.map((criterion) => (
              <CriterionRow key={criterion.title} criterion={criterion} />
            ))}
          </ul>
          <Button className="group mt-8 rounded-full" onClick={() => scrollToSection('search')}>
            Set your criteria
            <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        {previewedInstitutions.length > 0 && (
          <div className="rounded-panel border border-line bg-surface p-5 shadow-raised sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-navy">Matching your search</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-eyebrow text-ink-soft">
                  Live from the directory
                </p>
              </div>
              <p className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold tabular-nums text-primary-deep">
                {institutions.length} {institutions.length === 1 ? 'school' : 'schools'}
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
              View all {institutions.length} schools
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        )}
      </Container>
    </section>
  )
}

export default CriteriaSection
