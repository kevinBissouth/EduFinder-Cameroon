// « Popular destinations » : cartes éditoriales haut de gamme — dégradés
// profonds multi-couches (halo, trame de points, voile bas), numérotation en
// pastille verre, chiffre géant, filet doré qui s'étire au survol, reflet qui
// balaie la carte et révélation en cascade. Le clic filtre sur la ville.
import { DESTINATION_GRADIENTS } from '../constants'
import { useInView } from '../hooks/useInView'
import { ArrowRightIcon } from './icons'

function DestinationCard({ destination, index, started, onToggleCity }) {
  const gradient = DESTINATION_GRADIENTS[index % DESTINATION_GRADIENTS.length]

  return (
    <button
      onClick={() => onToggleCity(destination.id)}
      className={`group relative aspect-square overflow-hidden rounded-2xl text-left ring-1 ring-white/15 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:ring-[#d9a406]/60 hover:shadow-[0_22px_48px_rgba(8,18,32,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a406] focus-visible:ring-offset-2 sm:aspect-4/5 ${
        started ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Couche 1 : dégradé de base propre à chaque ville */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Couche 2 : trame de points discrète */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1.4px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Couche 3 : halo lumineux en haut à gauche */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.30)_0%,transparent_45%)]" />

      {/* Couche 4 : voile sombre pour la lisibilité du bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#04150f]/85 via-[#04150f]/25 to-transparent" />

      {/* Reflet qui balaie la carte au survol */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 w-1/2 -skew-x-12 -translate-x-[160%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[220%]"
      />

      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/25 bg-white/10 font-display text-[10px] font-bold text-white/85 backdrop-blur-sm sm:h-7 sm:w-7 sm:text-[11px]">
          0{index + 1}
        </span>

        <div>
          <p className="font-display text-3xl font-bold leading-none text-white sm:text-5xl">
            {destination.count}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 sm:text-[10px] sm:tracking-[0.2em]">
            {destination.count === 1 ? 'school' : 'schools'}
          </p>

          {/* Filet doré signature : s'étire au survol */}
          <span className="my-2.5 block h-0.5 w-7 rounded-full bg-gradient-to-r from-[#d9a406] to-[#f2c14e] transition-all duration-500 group-hover:w-10 sm:my-3.5 sm:h-[3px] sm:w-9 sm:group-hover:w-14" />

          <p className="font-display text-lg leading-tight text-white sm:text-xl md:text-2xl">
            {destination.name}
          </p>

          <span className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/90 sm:mt-3 sm:text-[11px]">
            <span className="hidden sm:inline">Explore</span>
            <span className="sr-only">Explore</span>
            <span className="flex size-5 items-center justify-center rounded-full bg-white/15 transition-colors duration-300 group-hover:bg-[#d9a406] sm:size-6">
              <ArrowRightIcon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}

export default function PopularDestinations({ destinations, onToggleCity }) {
  const [headerRef, headerInView] = useInView(0.3)
  const [gridRef, gridInView] = useInView(0.15)

  if (destinations.length === 0) return null

  const totalListings = destinations.reduce((sum, destination) => sum + destination.count, 0)

  return (
    <section className="bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* En-tête : titre à gauche, chips de stats réelles à droite */}
        <div
          ref={headerRef}
          className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
            headerInView ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          } transition-all duration-700 ease-out`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a5e3d]">
              Popular destinations
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-[#081220] sm:text-5xl">
              Where families <em className="text-[#0d7a4f]">look first.</em>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7ece9] bg-white px-4 py-2 text-sm font-semibold text-[#081220] shadow-sm">
              <span className="size-2 rounded-full bg-[#2ec27e]" />
              {destinations.length} top cities
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7ece9] bg-white px-4 py-2 text-sm font-semibold text-[#081220] shadow-sm">
              <span className="size-2 rounded-full bg-[#d9a406]" />
              {totalListings} listings
            </span>
          </div>
        </div>

        <div
          ref={gridRef}
          className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-5"
        >
          {destinations.map((destination, index) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              index={index}
              started={gridInView}
              onToggleCity={onToggleCity}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
