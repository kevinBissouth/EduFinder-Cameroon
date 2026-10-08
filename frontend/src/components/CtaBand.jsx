import { Search } from 'lucide-react'

import Button from './ui/Button'
import Container from './ui/Container'
import { scrollToSection } from '../utils/scroll'

// Le texte reste à gauche, sur la partie bleue du dégradé : le blanc ne
// serait pas lisible sur son extrémité violette.
function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-linear-to-r from-primary-deep via-primary via-60% to-violet [--focus-ring:var(--color-accent)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <path
          d="M0 120 C 240 60, 480 180, 760 130 S 1200 60, 1440 150"
          fill="none"
          className="stroke-white/25"
          strokeWidth="1.5"
          strokeDasharray="2 10"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Container className="relative flex flex-col gap-8 py-16 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-white">
            Not sure where to begin?
          </p>
          <h2 className="mt-4 text-balance font-display text-3xl leading-display tracking-tight text-white sm:text-5xl">
            Start with one simple search.
          </h2>
          <p className="mt-5 text-pretty text-base text-white sm:text-lg">
            Pick a city or a type of school, then compare what each one offers.
          </p>
        </div>
        <Button
          variant="inverse"
          size="lg"
          className="self-start rounded-full lg:self-auto"
          onClick={() => scrollToSection('search')}
        >
          <Search aria-hidden="true" className="size-4" />
          Find your school
        </Button>
      </Container>
    </section>
  )
}

export default CtaBand
