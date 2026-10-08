import { Bookmark, Scale, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Container from './ui/Container'

// Les trois étapes se suivent réellement, d'où la ligne qui les relie et
// leur numéro.
const STEPS = [
  { id: 'search', icon: Search },
  { id: 'compare', icon: Scale },
  { id: 'decide', icon: Bookmark },
]

// Ligne ondulée qui relie les trois étapes, visible à partir de la tablette.
// Elle passe du bleu au violet, les deux couleurs du dégradé de la marque.
function WavyLine() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 64"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 hidden h-16 w-full md:block"
    >
      <defs>
        <linearGradient id="steps-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className="[stop-color:var(--color-primary)]" />
          <stop offset="1" className="[stop-color:var(--color-violet)]" />
        </linearGradient>
      </defs>
      <path
        d="M0 36 C 150 22, 250 24, 400 36 S 650 48, 800 32 S 1050 28, 1200 24"
        fill="none"
        stroke="url(#steps-line)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Sur mobile, un filet vertical relie chaque pastille à la suivante : il
// joue le rôle de la ligne ondulée, réservée aux écrans plus larges.
function Step({ step, position }) {
  const { t } = useTranslation('home')

  return (
    <li className="relative flex gap-5 pb-8 last:pb-0 md:flex-col md:items-center md:gap-0 md:pb-0 md:text-center">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-8 top-16 w-px bg-line [li:last-child>&]:hidden md:hidden"
      />
      <span className="relative flex size-16 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-navy shadow-soft">
        <step.icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <div className="md:mt-5">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-deep">
          {t('steps.position', { position })}
        </p>
        <h3 className="mt-1 font-display text-2xl text-navy">{t(`steps.${step.id}.title`)}</h3>
        <p className="mt-2 max-w-xs text-balance text-sm text-ink">{t(`steps.${step.id}.description`)}</p>
      </div>
    </li>
  )
}

function HeroSteps() {
  const { t } = useTranslation('home')

  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-surface pb-16 pt-4 sm:pb-20 md:pt-0">
      <Container>
        <h2 className="sr-only">{t('steps.heading')}</h2>
        <div className="relative">
          <WavyLine />
          <ol className="relative grid md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <Step key={step.id} step={step} position={index + 1} />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

export default HeroSteps
