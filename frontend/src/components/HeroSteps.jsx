// Trio « Search · Compare · Shortlist » répliqué sur worldschoolfinder.com :
// mêmes icônes SVG (tracés copiés au chemin près), même disposition desktop
// trois colonnes alignées gauche/centre/droite avec courbe de liaison animée,
// même liste verticale bordée sur mobile. Couleurs transposées en vert/or.
import { useInView } from '../hooks/useInView'

const INK = '#081220'
const ACCENT_GREEN = '#2ec27e'
const GOLD = '#f2c14e'
const SOFT_MINT = '#dff0e8'

const STEPS = [
  {
    label: 'Search',
    description: 'Explore schools that fit your needs',
    halo: ACCENT_GREEN,
    icon: (
      <>
        <path d="M16.2 29.4C12.1 26.3 10.6 20.8 12.8 16.1C15.3 10.8 21.6 8.5 26.9 11C30.6 12.7 32.9 16.2 33.2 19.9" stroke={INK} />
        <path d="M29.2 29.2L38 38" stroke={INK} />
        <path d="M16.2 21.1C16.2 18.2 18.5 15.9 21.4 15.9" stroke={ACCENT_GREEN} />
        <path d="M34.1 11.3L35.4 14.2L38.3 15.5L35.4 16.8L34.1 19.7L32.8 16.8L29.9 15.5L32.8 14.2Z" stroke={GOLD} />
      </>
    ),
  },
  {
    label: 'Compare',
    description: 'Compare side by side with clarity',
    halo: GOLD,
    icon: (
      <>
        <path d="M24 12.5V37.2M18.3 37.2H29.7M13.4 16.5H22M26 16.5H34.6M24 12.5V16.5" stroke={INK} />
        <path d="M9.3 28.4C10.5 31.4 12.2 32.9 14.3 32.9C16.4 32.9 18.1 31.4 19.3 28.4" stroke={ACCENT_GREEN} />
        <path d="M28.7 28.4C29.9 31.4 31.6 32.9 33.7 32.9C35.8 32.9 37.5 31.4 38.7 28.4" stroke={GOLD} />
      </>
    ),
  },
  {
    label: 'Shortlist',
    description: 'Save your favourites and decide together',
    halo: ACCENT_GREEN,
    icon: (
      <>
        <path d="M14.4 22.2V13.6C14.4 11.5 16.1 9.8 18.2 9.8H29.8C31.9 9.8 33.6 11.5 33.6 13.6V22.2M33.6 27V38.2H14.4V27" stroke={INK} />
        <path d="M24 15.6V27.4" stroke={ACCENT_GREEN} />
        <path d="M20.7 33.6L24 31.2L27.3 33.6L24 35.3Z" fill={SOFT_MINT} />
      </>
    ),
  },
]

function StepBadge({ step, started, index }) {
  return (
    <span
      className={`relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full border bg-white transition-all duration-500 ease-out ${
        started ? 'scale-100' : 'scale-95'
      }`}
      style={{
        borderColor: `${step.halo}66`,
        boxShadow: `0 0 12px ${step.halo}3d`,
        transitionDelay: `${index * 160}ms`,
      }}
    >
      {/* Halo discret : simple voile teinté, sans éclat excessif */}
      <span
        aria-hidden="true"
        className="absolute -inset-2 rounded-full"
        style={{ background: `${step.halo}1a`, filter: 'blur(6px)' }}
      />
      <span
        aria-hidden="true"
        className="absolute -inset-[4px] rounded-full border"
        style={{ borderColor: `${step.halo}40` }}
      />
      <svg
        viewBox="0 0 48 48"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-9"
        aria-hidden="true"
      >
        {step.icon}
      </svg>
    </span>
  )
}

export default function HeroSteps() {
  const [ref, inView] = useInView(0.3)

  return (
    <section ref={ref} className="border-y border-[#e7ece9] bg-white py-10 sm:py-12">
      <style>{`@keyframes hero-steps-trail-drift{from{stroke-dashoffset:0}to{stroke-dashoffset:-104}} .hero-steps-trail{animation:hero-steps-trail-drift 4.5s linear infinite}`}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop : badges reliés par une courbe animée, textes alignés */}
        <div className="relative hidden md:block">
          <svg
            viewBox="0 0 1200 96"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-[8%] top-7 h-16 w-[84%] overflow-visible"
            aria-hidden="true"
          >
            {/* Vague régulière : départ visible, traverse les centres des trois
                badges (y=50), fin nette après le troisième. */}
            <path
              d="M -30 14 C 4 40, 12 50, 36 50 C 150 50, 240 -2, 350 6 C 450 13, 500 50, 600 50 C 700 50, 756 -4, 872 -2 C 972 0, 1010 44, 1064 50 C 1110 55, 1160 40, 1196 28"
              fill="none"
              stroke={SOFT_MINT}
              strokeWidth="2"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={inView ? 0 : 1}
              style={{ transition: 'stroke-dashoffset 1.3s ease-out' }}
            />
            {/* … puis un flux pointillé la parcourt en continu */}
            <path
              d="M -30 14 C 4 40, 12 50, 36 50 C 150 50, 240 -2, 350 6 C 450 13, 500 50, 600 50 C 700 50, 756 -4, 872 -2 C 972 0, 1010 44, 1064 50 C 1110 55, 1160 40, 1196 28"
              fill="none"
              stroke={ACCENT_GREEN}
              strokeOpacity="0.45"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="1 12"
              className="hero-steps-trail motion-reduce:animate-none"
            />
          </svg>

          <div className="grid grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.label}
                className={`flex flex-col gap-4 ${
                  index === 0
                    ? 'items-start pl-[8%]'
                    : index === 1
                      ? 'items-center text-center'
                      : 'items-end pr-[6%] text-right'
                }`}
              >
                <StepBadge step={step} started={inView} index={index} />
                <span
                  className={`block text-sm font-bold text-[#081220] transition-transform duration-500 ${
                    inView ? 'translate-y-0' : 'translate-y-2'
                  }`}
                  style={{ transitionDelay: `${200 + index * 160}ms` }}
                >
                  {step.label}
                </span>
                <span
                  className={`mt-1 block max-w-45 text-[13px] leading-relaxed text-[#5b6670] transition-transform duration-500 ${
                    inView ? 'translate-y-0' : 'translate-y-2'
                  }`}
                  style={{ transitionDelay: `${280 + index * 160}ms` }}
                >
                  {step.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile : liste verticale bordée, comme l'original */}
        <ol className="space-y-6 border-l border-[#e7ece9] pl-5 md:hidden">
          {STEPS.map((step, index) => (
            <li
              key={step.label}
              className={`flex items-start gap-4 transition-transform duration-500 ease-out ${
                inView ? 'translate-y-0' : 'translate-y-2'
              }`}
              style={{ transitionDelay: `${index * 140}ms` }}
            >
              <StepBadge step={step} started={inView} index={index} />
              <span>
                <span className="block text-sm font-bold text-[#081220]">{step.label}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[#5b6670]">
                  {step.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
