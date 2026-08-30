// Section « The global picture » répliquée sur la construction exacte de
// worldschoolfinder.com : vagues de transition, texture ondulée en fond,
// rail de statistiques avec courbes décoratives et flux pointillé animé,
// donut de données calculé depuis nos niveaux réels avec pointeur, légende à
// lignes pointillées et table sr-only d'accessibilité.
// Animations : apparition en cascade au scroll, compteurs progressifs,
// rotation lente des arches pointillées, pulsation du pointeur.
// Fond vert sombre maison ; accents vert/or ; aucune donnée inventée.
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'

const ACCENT_GREEN = '#2ec27e'
const DEEP_GREEN = '#0a5e3d'
const GOLD = '#f2c14e'
const SOFT_MINT = '#dff0e8'
const SEGMENT_COLORS = [ACCENT_GREEN, GOLD, '#a7e3c6', '#ffe28a', '#cfd8d2']
// Dégradés de brillance appliqués aux arcs du donut (définis dans <defs>).
const GRADIENT_IDS = ['gp-green', 'gp-gold', 'gp-mint', 'gp-lgold', 'gp-grey']

function computeLevelBreakdown(establishments) {
  const counts = new Map()
  establishments.forEach((institution) => {
    const key = institution.type || 'Other'
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({
      label,
      count,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    }))
}

function polarPoint(radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return [240 + radius * Math.cos(rad), 240 + radius * Math.sin(rad)]
}

// Arc d'anneau façon worldschoolfinder : rayon 150, épaisseur 28, bouts ronds.
function donutArcPath(startDeg, endDeg, radius = 150) {
  const [x1, y1] = polarPoint(radius, startDeg)
  const [x2, y2] = polarPoint(radius, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`
}

// Statistique du rail : chiffre qui monte progressivement, révélation
// décalée ligne par ligne quand la section entre dans le viewport.
function RailStat({ value, label, coreColor, started, index }) {
  const displayed = useCountUp(value, started)

  return (
    <div
      className={`relative grid min-h-26 grid-cols-10 gap-5 transition-all duration-700 ease-out ${
        started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 130}ms` }}
    >
      <div className="relative flex justify-center pt-1.5">
        <span className="relative z-10 mt-2 flex size-7 items-center justify-center rounded-full">
          <span
            className="absolute -inset-1.5 rounded-full"
            style={{ background: `${GOLD}33` }}
          />
          <span className="absolute inset-1.5 rounded-full border border-[#dff0e8]/85" />
          <span className="size-2.5 rounded-full" style={{ background: coreColor }} />
        </span>
      </div>
      <div>
        <dd className="font-display text-xl leading-none text-white sm:text-2xl">
          <span className="tabular-nums">{displayed}</span>
        </dd>
        <dt className="mt-2 whitespace-nowrap text-sm font-semibold leading-6 text-[#dff0e8]">{label}</dt>
      </div>
    </div>
  )
}

export default function GlobalPicture({ establishments, cityCount, regionCount, examResultsCount, feePlansCount }) {
  const [sectionRef, sectionInView] = useInView(0.15)

  if (!establishments.length) return null

  const breakdown = computeLevelBreakdown(establishments)
  const topLevel = breakdown[0]
  const total = establishments.length

  // Arcs du donut : départ à midi, petite marge entre secteurs (comme chez eux).
  let cursor = -90
  const arcs = breakdown.map((level) => {
    const span = (level.count / total) * 360
    const path = donutArcPath(cursor, cursor + span)
    cursor += span
    return { ...level, path }
  })

  // Pointeur vers le niveau dominant : trait + pastille à l'extérieur de l'anneau.
  const midAngle = (-90 + ((topLevel.count / total) * 360) / 2)
  const [leaderX1, leaderY1] = polarPoint(184, midAngle)
  const [dotX, dotY] = polarPoint(196, midAngle)

  const reveal = (delayClass = '') =>
    `transition-all duration-700 ease-out ${
      sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
    } ${delayClass}`

  const railStats = [
    { value: establishments.length, label: 'Published establishments', coreColor: ACCENT_GREEN },
    { value: cityCount, label: 'Cities covered', coreColor: GOLD },
    { value: examResultsCount, label: 'Official exam results', coreColor: '#a7e3c6' },
    { value: feePlansCount, label: 'Fee plans published', coreColor: GOLD },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#07281d] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:min-h-150 lg:px-0 lg:pt-20 lg:pb-24"
    >
      {/* Flux du rail + rotation du reflet brillant sur l'anneau */}
      <style>{`@keyframes market-insights-trail-drift{from{stroke-dashoffset:0}to{stroke-dashoffset:-96}} .market-insights-trail{animation:market-insights-trail-drift 4s linear infinite}@keyframes gp-orbit{to{transform:rotate(360deg)}} .gp-orbit{animation:gp-orbit 7s linear infinite}`}</style>

      {/* Délimitations professionnelles haut/bas : longue ligne dorée
          légèrement épaisse, au lieu des vagues qui masquaient le contenu. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-transparent via-[#d9a406]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-gradient-to-r from-transparent via-[#d9a406]/70 to-transparent"
      />

      {/* Texture ondulée discrète sur tout le bandeau */}
      <div className="absolute inset-0 z-0">
        <svg
          viewBox="0 0 120 100"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none h-full w-full"
          aria-hidden="true"
        >
          <path d="M8 18 C28 12 46 26 62 20 C78 14 88 28 96 22" stroke={ACCENT_GREEN} strokeWidth="0.14" strokeOpacity="0.18" strokeLinecap="round" fill="none" />
          <path d="M4 42 C22 36 38 50 58 44 C74 40 88 52 98 46" stroke={GOLD} strokeWidth="0.14" strokeOpacity="0.16" strokeLinecap="round" fill="none" />
          <path d="M12 68 C30 62 48 76 66 70 C82 66 92 78 100 72" stroke={SOFT_MINT} strokeWidth="0.14" strokeOpacity="0.12" strokeLinecap="round" fill="none" />
          <path d="M18 88 C34 84 52 94 70 90 C84 86 94 94 104 90" stroke={ACCENT_GREEN} strokeWidth="0.12" strokeOpacity="0.12" strokeLinecap="round" fill="none" />
          <path d="M22 8 C40 20 36 40 52 52 C66 62 78 58 90 70" stroke={GOLD} strokeWidth="0.12" strokeOpacity="0.14" strokeLinecap="round" fill="none" />
          <path d="M70 8 C62 24 74 38 64 54 C56 68 68 80 60 94" stroke={SOFT_MINT} strokeWidth="0.12" strokeOpacity="0.10" strokeLinecap="round" fill="none" />
          <circle cx="22" cy="16" r="0.18" fill={ACCENT_GREEN} />
          <circle cx="62" cy="20" r="0.18" fill={ACCENT_GREEN} />
          <circle cx="96" cy="22" r="0.18" fill={SOFT_MINT} />
          <circle cx="30" cy="40" r="0.18" fill={GOLD} />
          <circle cx="74" cy="42" r="0.18" fill={GOLD} />
          <circle cx="52" cy="64" r="0.18" fill={SOFT_MINT} />
          <circle cx="88" cy="72" r="0.18" fill={ACCENT_GREEN} />
          <circle cx="36" cy="86" r="0.18" fill={GOLD} />
          <circle cx="70" cy="90" r="0.18" fill={SOFT_MINT} />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:min-h-150 lg:px-8">
        {/* En-tête pleine largeur, comme l'original */}
        <div className="w-full">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${reveal()}`} style={{ color: GOLD }}>
            The global picture
          </p>
          <h2 className={`mt-5 max-w-none font-display text-3xl leading-tight text-white md:text-4xl ${reveal('delay-100')}`}>
            Cameroonian education,
            <br />
            in numbers.
          </h2>
          <p className={`mt-3 text-sm leading-relaxed text-[#dff0e8]/80 ${reveal('delay-200')}`}>
            A clear picture for a confident choice.
          </p>
          <p className={`mt-3 max-w-5xl text-xs leading-5 text-[#dff0e8]/60 ${reveal('delay-300')}`}>
            EduFinder Cameroon focuses on the {regionCount} regions of Cameroon —
            every figure below is read live from our public database.
          </p>
        </div>

        <div className="mt-10 grid gap-14 lg:mt-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,0.9fr)_minmax(0,0.85fr)] lg:items-center lg:gap-10">
          {/* Colonne 1 : rail des statistiques + progression */}
          <div className={reveal()}>
            <dl className="relative space-y-7 pl-1">
              {/* Courbes décoratives derrière le rail, copiées de l'original ;
                  la trajectoire pointillée est animée (flux continu). */}
              <svg
                viewBox="0 0 120 560"
                className="pointer-events-none absolute -left-2 top-1 block h-[34rem] w-20 overflow-visible sm:-left-3 sm:w-28 lg:-left-4"
                aria-hidden="true"
              >
                <path d="M28 16 C10 72 51 115 25 174 C-6 242 58 290 31 356 C15 418 56 464 35 532" stroke={ACCENT_GREEN} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
                <path d="M44 54 C78 114 65 173 31 216 C0 256 15 307 57 333" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
                <path d="M26 174 C58 188 72 207 85 235" stroke={SOFT_MINT} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.18" fill="none" />
                <path d="M31 356 C62 338 76 304 90 272" stroke={SOFT_MINT} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.16" fill="none" />
                <path d="M35 532 C58 482 77 453 101 435" stroke={GOLD} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.22" fill="none" />
                <path
                  d="M28 16 C10 72 51 115 25 174 C-6 242 58 290 31 356 C15 418 56 464 35 532"
                  stroke={SOFT_MINT}
                  strokeDasharray="1 12"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeOpacity="0.28"
                  fill="none"
                  className="market-insights-trail"
                />
                <circle cx="40" cy="82" r="1.6" fill={SOFT_MINT} />
                <circle cx="22" cy="139" r="2" fill={ACCENT_GREEN} />
                <circle cx="56" cy="197" r="1.5" fill={GOLD} />
                <circle cx="19" cy="292" r="1.8" fill={SOFT_MINT} />
                <circle cx="68" cy="327" r="1.7" fill={ACCENT_GREEN} />
                <circle cx="45" cy="452" r="2" fill={GOLD} />
                <circle cx="30" cy="506" r="1.5" fill={SOFT_MINT} />
              </svg>

              {railStats.map((stat, index) => (
                <RailStat key={stat.label} {...stat} started={sectionInView} index={index} />
              ))}
            </dl>

            <p className="mt-8 pl-1 text-sm leading-6 text-[#dff0e8]/70">
              {total} published today
            </p>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group relative mt-10 inline-flex min-h-11 items-center gap-2 text-sm text-[#dff0e8] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec27e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07281d]"
            >
              <span className="relative font-semibold">
                Explore the schools
                <span className="absolute inset-x-0 -bottom-1 block border-b border-dotted border-[#dff0e8]/50" />
                <span className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-0 bg-[#dff0e8] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M3.25 8H12.5" />
                <path d="m8.75 4.25 3.75 3.75-3.75 3.75" />
              </svg>
            </button>
          </div>

          {/* Colonne 2 : grand radar carré + pointeur vers le niveau dominant */}
          <div className={`relative mx-auto flex w-full justify-center ${reveal('delay-150')}`}>
            <svg
              viewBox="0 0 480 480"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 overflow-visible opacity-60"
              aria-hidden="true"
            >
              <path d="M70 292 C122 96 362 20 500 154" stroke={DEEP_GREEN} strokeWidth="1.1" strokeOpacity="0.55" fill="none" />
              <path d="M58 332 C174 520 420 510 540 304" stroke={GOLD} strokeWidth="1" strokeOpacity="0.30" fill="none" />
            </svg>

            <div className="relative w-full">
              <div className="relative mx-auto aspect-square w-full max-w-120 text-[#dff0e8]">
                <svg
                  viewBox="0 0 480 480"
                  role="img"
                  aria-label="Distribution of published establishments by level"
                  className="absolute inset-0 h-full w-full overflow-visible"
                >
                  <defs>
                    {/* Dégradés « brillance » : clair -> couleur -> sombre,
                        pour un rendu métallique des arcs du donut. */}
                    <linearGradient id="gp-green" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8ff0c4" />
                      <stop offset="50%" stopColor="#2ec27e" />
                      <stop offset="100%" stopColor="#0f8f5b" />
                    </linearGradient>
                    <linearGradient id="gp-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fff3c4" />
                      <stop offset="50%" stopColor="#f2c14e" />
                      <stop offset="100%" stopColor="#c98f06" />
                    </linearGradient>
                    <linearGradient id="gp-mint" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#d9fbe9" />
                      <stop offset="50%" stopColor="#a7e3c6" />
                      <stop offset="100%" stopColor="#6cc79a" />
                    </linearGradient>
                    <linearGradient id="gp-lgold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fff7d6" />
                      <stop offset="50%" stopColor="#ffe28a" />
                      <stop offset="100%" stopColor="#d9a406" />
                    </linearGradient>
                    <linearGradient id="gp-grey" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#eef3f0" />
                      <stop offset="50%" stopColor="#cfd8d2" />
                      <stop offset="100%" stopColor="#9fb3aa" />
                    </linearGradient>
                    {/* Reflet voyageur : transparent -> blanc -> transparent */}
                    <linearGradient id="gp-sheen" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Anneaux guides */}
                  <circle cx="240" cy="240" r="180" fill="none" stroke={SOFT_MINT} strokeOpacity="0.08" />
                  <circle cx="240" cy="240" r="120" fill="none" stroke={SOFT_MINT} strokeOpacity="0.12" />

                  {/* Graduations radiales, 12 positions */}
                  <g aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, index) => {
                      const [x1, y1] = polarPoint(170, index * 30)
                      const [x2, y2] = polarPoint(184, index * 30)
                      return (
                        <line
                          key={index}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={SOFT_MINT}
                          strokeOpacity="0.15"
                          strokeLinecap="round"
                        />
                      )
                    })}
                  </g>

                  {/* Arches pointillées décoratives en rotation très lente */}
                  <g
                    className="motion-reduce:animate-none"
                    style={{
                      transformOrigin: '240px 240px',
                      transformBox: 'view-box',
                      animation: 'spin 110s linear infinite',
                    }}
                  >
                    <path d="M 70.259 142.000 A 196 196 0 0 1 394.450 119.330" fill="none" stroke={ACCENT_GREEN} strokeDasharray="2 10" strokeLinecap="round" strokeOpacity="0.20" />
                    <path d="M 437.820 304.276 A 208 208 0 0 1 111.942 403.906" fill="none" stroke={GOLD} strokeDasharray="2 10" strokeLinecap="round" strokeOpacity="0.26" />
                    <path d="M 60.928 360.786 A 216 216 0 0 1 30.416 187.745" fill="none" stroke={SOFT_MINT} strokeDasharray="2 10" strokeLinecap="round" strokeOpacity="0.18" />
                  </g>

                  {/* Piste de base + anneau pointillé intérieur */}
                  <circle cx="240" cy="240" r="150" fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="28" />
                  <circle cx="240" cy="240" r="94" fill="none" stroke={SOFT_MINT} strokeDasharray="1 12" strokeLinecap="round" strokeOpacity="0.18" />

                  {/* Donut de données : chaque arc se dessine au scroll,
                      stroke en dégradé + lueur douce = effet brillant. */}
                  {arcs.map((arc, index) => (
                    <path
                      key={arc.label}
                      d={arc.path}
                      role="img"
                      aria-label={`${arc.label}: ${Math.round((arc.count / total) * 100)} percent of published establishments`}
                      fill="none"
                      stroke={`url(#${GRADIENT_IDS[index % GRADIENT_IDS.length]})`}
                      strokeLinecap="round"
                      strokeWidth="28"
                      pathLength="1"
                      strokeDasharray="1"
                      strokeDashoffset={sectionInView ? 0 : 1}
                      style={{
                        transition: `stroke-dashoffset 1s ease ${index * 0.25}s`,
                        filter:
                          index % 2 === 0
                            ? 'drop-shadow(0 0 14px rgba(46,194,126,0.35))'
                            : 'drop-shadow(0 0 14px rgba(242,193,78,0.35))',
                      }}
                    />
                  ))}

                  {/* Reflet voyageur : fine arche blanche qui balaie l'anneau */}
                  <circle
                    cx="240"
                    cy="240"
                    r="150"
                    fill="none"
                    stroke="url(#gp-sheen)"
                    strokeWidth="28"
                    strokeLinecap="round"
                    pathLength="1"
                    strokeDasharray="0.16 0.84"
                    opacity="0.55"
                    className="gp-orbit motion-reduce:animate-none"
                    style={{ transformOrigin: '240px 240px', transformBox: 'view-box' }}
                  />

                  {/* Liseré de lumière fixe sur le haut de l'anneau */}
                  <path
                    d={donutArcPath(-58, -22, 137)}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.5"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Pointeur vers le niveau dominant, pastille qui pulse */}
                  {sectionInView && (
                    <>
                      <line
                        x1={leaderX1}
                        y1={leaderY1}
                        x2={dotX}
                        y2={dotY}
                        stroke={SOFT_MINT}
                        strokeOpacity="0.28"
                        strokeLinecap="round"
                      />
                      <circle cx={dotX} cy={dotY} r="4" fill={topLevel.color} stroke="#07281d" strokeWidth="3">
                        <animate attributeName="r" values="4;6;4;4" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                </svg>

                {/* Centre du donut, pop à l'apparition */}
                <div
                  className={`pointer-events-none absolute inset-0 flex items-center justify-center text-center transition-all duration-700 ${
                    sectionInView ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                >
                  <div>
                    <p className="font-display text-3xl leading-none text-white tabular-nums">
                      {Math.round((topLevel.count / total) * 100)}%
                    </p>
                    <p className="mt-2 text-sm text-[#dff0e8]/80">{topLevel.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 3 : légende à lignes pointillées, révélée en cascade */}
          <div className={reveal('delay-200')}>
            <div className="relative w-full text-[#dff0e8]">
              <h3 className="font-display text-lg text-white">Schools by level</h3>
              <p className="mt-1 text-sm text-[#dff0e8]/70">% of published establishments</p>
              <ul className="mt-6 space-y-2.5">
                {breakdown.map((level, index) => (
                  <li
                    key={level.label}
                    className={`group flex w-full items-center py-1 text-sm transition-all duration-500 ease-out ${
                      sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    }`}
                    style={{ transitionDelay: `${300 + index * 120}ms` }}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: level.color }} />
                    <span className="ml-3 font-medium">{level.label}</span>
                    <span className="mx-3 flex-1 border-b border-dotted border-[#dff0e8]/20 transition-colors duration-300 group-hover:border-[#dff0e8]/50" />
                    <span className="font-semibold tabular-nums text-white">
                      {Math.round((level.count / total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Données sourcées pour lecteurs d'écran (parité accessibilité) */}
        <table className="sr-only">
          <caption>Homepage establishment source data</caption>
          <thead>
            <tr>
              <th>Panel</th>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Global picture</td><td>Published establishments</td><td>{total}</td></tr>
            <tr><td>Global picture</td><td>Cities covered</td><td>{cityCount}</td></tr>
            <tr><td>Global picture</td><td>Official exam results</td><td>{examResultsCount}</td></tr>
            {breakdown.map((level) => (
              <tr key={level.label}>
                <td>Schools by level</td>
                <td>{level.label}</td>
                <td>{Math.round((level.count / total) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  )
}
