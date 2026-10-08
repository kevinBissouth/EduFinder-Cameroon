import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Container from './ui/Container'
import SectionHeading from './ui/SectionHeading'

function DestinationTile({ city, largestSchoolCount, isActive, onToggle }) {
  const { t } = useTranslation()
  const sharePercent = (city.count / largestSchoolCount) * 100

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onToggle(city.id)}
      className={`group relative flex h-44 w-full cursor-pointer flex-col justify-between overflow-hidden rounded-panel bg-linear-to-br from-navy from-55% to-primary-deep p-5 text-left shadow-soft transition-shadow hover:shadow-raised ${
        isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
      }`}
    >
      <span aria-hidden="true" className="absolute -right-8 -top-8 size-28 rounded-full border border-white/10" />
      <span aria-hidden="true" className="absolute -right-16 -top-16 size-44 rounded-full border border-white/10" />
      <span className="relative flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
          {t('common:schoolCount', { count: city.count })}
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 text-on-navy-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
        />
      </span>
      <span className="relative">
        <span className="block font-display text-2xl leading-tight text-white">{city.name}</span>
        {/* Barre de proportion : part de cette ville face à la plus fournie. */}
        <span aria-hidden="true" className="mt-3 block h-1 rounded-full bg-white/15">
          <span className="block h-1 rounded-full bg-accent" style={{ width: `${sharePercent}%` }} />
        </span>
      </span>
    </button>
  )
}

// Les villes qui comptent le plus d'établissements publiés : un clic applique
// le filtre ville, un second clic le retire.
function PopularDestinations({ cities, activeCityId, onToggleCity }) {
  const { t } = useTranslation('home')
  if (cities.length === 0) return null

  const largestSchoolCount = Math.max(...cities.map((city) => city.count))

  return (
    <section id="destinations" className="scroll-mt-20 border-t border-line bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('destinations.eyebrow')}
          title={t('destinations.title')}
          lead={t('destinations.lead')}
        />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {cities.map((city) => (
            <li key={city.id}>
              <DestinationTile
                city={city}
                largestSchoolCount={largestSchoolCount}
                isActive={String(city.id) === String(activeCityId)}
                onToggle={onToggleCity}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export default PopularDestinations
