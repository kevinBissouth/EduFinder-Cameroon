// « How it works » : trois étapes numérotées reliées par un rail pointillé,
// compteurs animés et carte « matches » à bordure dégradée + chiffre qui
// monte. Révélations en cascade au scroll (hook partagé useInView).
import { ArrowRightIcon, CheckIcon, GradCapIcon, SparkleIcon } from './icons'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'

function HowItWorks({ matchCount, hasFilters, onReset }) {
  const [sectionRef, sectionInView] = useInView(0.2)
  const displayedMatches = useCountUp(matchCount, sectionInView)

  const steps = [
    {
      title: 'Search & filter',
      text: 'Search by name, city, school type or language. Combine criteria freely.',
    },
    {
      title: 'Compare details',
      text: 'Check fees, payment installments, exam results, services and photos.',
    },
    {
      title: 'Contact & enroll',
      text: 'Use the official contacts to visit, ask questions and enroll.',
    },
  ]

  return (
    <section id="how-it-works" ref={sectionRef} className="scroll-mt-24 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-8 lg:py-20">
        {/* Colonne gauche : titre + étapes sur rail */}
        <div
          className={`transition-all duration-700 ease-out ${
            sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a5e3d]">
            How it works
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-[#081220] sm:text-5xl">
            From search to <em className="text-[#0d7a4f]">enrollment.</em>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#343a44]">
            Three simple steps between you and the right school.
          </p>

          <div className="relative mt-10 space-y-8 pl-1">
            {/* Rail pointillé vertical reliant les étapes */}
            <div
              aria-hidden="true"
              className="absolute bottom-6 left-[27px] top-6 w-px border-l border-dashed border-[#dcebe3]"
            />
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative flex items-start gap-5 transition-all duration-700 ease-out ${
                  sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                }`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d7a4f] to-[#d9a406] font-display text-xl font-bold text-white shadow-[0_10px_24px_rgba(10,94,61,0.28)]">
                  0{index + 1}
                </span>
                <div className="pt-1.5">
                  <p className="font-display text-lg font-bold text-[#081220]">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#4b5566]">{step.text}</p>
                </div>
                <CheckIcon className="ml-auto mt-3 hidden h-4 w-4 shrink-0 text-[#2ec27e] sm:block" />
              </div>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: 320, behavior: 'smooth' })}
            className="arrow-nudge group mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5"
          >
            <SparkleIcon />
            Start searching now
            <span className="arrow transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRightIcon />
            </span>
          </button>
        </div>

        {/* Colonne droite : carte matches à bordure dégradée */}
        <div
          className={`flex flex-col justify-center transition-all duration-700 ease-out delay-200 ${
            sectionInView ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'
          }`}
        >
          <div className="absolute-separator relative mx-auto w-full max-w-md">
            {/* Halo diffus derrière la carte */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(46,194,126,0.16), transparent 60%), radial-gradient(circle at 75% 80%, rgba(242,193,78,0.16), transparent 60%)',
              }}
            />

            {/* Bordure dégradée via double couche */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#2ec27e]/70 via-[#d9a406]/50 to-transparent p-px shadow-[0_22px_54px_rgba(8,18,32,0.10)]">
              <div className="rounded-[calc(1.5rem-1px)] bg-white p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d7a4f] to-[#d9a406] text-white shadow-[0_10px_24px_rgba(10,94,61,0.3)]">
                  <GradCapIcon className="h-8 w-8" />
                </div>
                <p className="mt-6 font-display text-5xl font-bold tabular-nums text-[#0d7a4f]">
                  {displayedMatches}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#98a2ac]">
                  {matchCount === 1 ? 'match found' : 'matches found'}
                </p>
                <p className="mx-auto mt-4 max-w-60 text-sm leading-relaxed text-[#4b5566]">
                  {hasFilters
                    ? 'Filtered by your current criteria.'
                    : 'Browse all published institutions.'}
                </p>

                <ul className="mx-auto mt-6 space-y-2 border-t border-dotted border-[#e7ece9] pt-5 text-left text-sm">
                  {['Live public database', 'Verified fees & results', 'Free to explore'].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2.5 text-[#343a44]">
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#e5f3ec] text-[#0d7a4f]">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        {item}
                      </li>
                    ),
                  )}
                </ul>

                <button
                  onClick={onReset}
                  className="mt-7 w-full rounded-xl bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5 hover:from-[#0a5e3d] hover:to-[#0d7a4f]"
                >
                  {hasFilters ? 'Reset filters' : 'Browse all'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
