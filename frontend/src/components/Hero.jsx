import { useState } from 'react'

import { ArrowRightIcon, GradCapIcon, MapPinIcon, SearchIcon, ShieldIcon } from './icons'
import AdvancedFilters from './AdvancedFilters'

function Hero({ search, cityId, typeId, cities, types, allCount, cityCount, regionCount, feePlansCount, examResultsCount, advancedFilters, onSearchChange, onSubmit, onCityChange, onTypeChange }) {
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-12 sm:px-6 sm:pt-12 sm:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-20">
        <div>
          <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a5e3d]">
            Cameroon school discovery
          </p>
          <h1 className="animate-rise-1 mt-4 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05] tracking-tight text-[#081220]">
            Find a school that fits <em className="not-italic text-gradient">your future.</em>
          </h1>
          <div className="animate-rise-1 mt-5 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#0d7a4f] to-[#d9a406]" />
          <p className="animate-rise-2 mt-6 max-w-[58ch] leading-relaxed text-[#343a44]">
            Explore schools and universities across Cameroon. Compare fees, payment
            plans, exam results, services and location then contact the ones that
            fit your needs.
          </p>

          <form
            onSubmit={onSubmit}
            className="animate-rise-3 mt-8 flex flex-col gap-2 rounded-2xl border-2 border-[#0d7a4f]/35 bg-white p-3 shadow-[0_22px_54px_rgba(10,94,61,0.14)] ring-4 ring-[#0d7a4f]/5 lg:flex-row lg:gap-0"
          >
            <label className="flex flex-1 items-center gap-2.5 rounded-xl px-4 transition-colors hover:bg-[#f7f8fc]">
              <span className="text-[#4b5566]"><SearchIcon /></span>
              <input
                type="text"
                value={search}
                onChange={onSearchChange}
                placeholder="School name, program or city..."
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-[#4b5566]"
              />
            </label>
            <div className="mx-2 hidden h-6 w-px bg-[#dcebe3] lg:block" />
            <label className="flex h-14 items-center gap-2.5 rounded-xl px-4 transition-colors hover:bg-[#f7f8fc] lg:flex-1">
              <span className="text-[#4b5566]"><MapPinIcon /></span>
              <select
                value={cityId}
                onChange={onCityChange}
                className="h-full w-full bg-transparent text-sm text-[#081220] outline-none"
              >
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </label>
            <div className="mx-2 hidden h-6 w-px bg-[#dcebe3] lg:block" />
            <label className="flex h-14 items-center gap-2.5 rounded-xl px-4 transition-colors hover:bg-[#f7f8fc] lg:flex-1">
              <span className="text-[#4b5566]"><GradCapIcon /></span>
              <select
                value={typeId}
                onChange={onTypeChange}
                className="h-full w-full bg-transparent text-sm text-[#081220] outline-none"
              >
                <option value="">All types</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="arrow-nudge flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5 hover:from-[#0a5e3d] hover:to-[#0d7a4f] lg:mt-0 lg:w-auto"
            >
              Search
              <span className="arrow"><ArrowRightIcon /></span>
            </button>
          </form>

          <AdvancedFilters advancedFilters={advancedFilters} />

          <div className="animate-rise-4 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#4b5566]">
            <span className="flex items-center gap-1.5">
              <span className="text-[#0a5e3d]"><ShieldIcon /></span>
              Independent. No paid rankings. Built for families.
            </span>
          </div>

          <div className="animate-rise-4 mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4b5566]">
            <span className="font-bold text-[#081220]">{allCount}+ Schools</span>
            <span className="text-[#c9d4e5]">·</span>
            <span className="font-bold text-[#081220]">{cityCount} Cities</span>
            <span className="text-[#c9d4e5]">·</span>
            <span className="font-bold text-[#081220]">{regionCount} Regions</span>
          </div>

          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-[#dcebe3] bg-white p-4 text-center shadow-[0_22px_54px_rgba(10,94,61,0.08)]">
            {[
              { value: `${allCount}`, label: 'Institutions' },
              { value: `${feePlansCount}`, label: 'Fee plans' },
              { value: `${examResultsCount}`, label: 'Exam results' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl text-[#0d7a4f]">{stat.value}</p>
                <p className="mt-1 text-[11px] text-[#4b5566]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-rise-2 relative hidden rounded-xl overflow-hidden lg:block">
          <div className="absolute -top-8 -right-4 h-40 w-40 rounded-full bg-[#ffb020]/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-[#f2c14e]/25 blur-2xl" />
          <div className="relative overflow-hidden rounded-xl shadow-[0_22px_54px_rgba(8,18,32,0.25)]">
            {photoFailed ? (
              <div className="flex h-[440px] items-center justify-center bg-gradient-to-br from-[#0d7a4f] via-[#1e9a68] to-[#f2c14e]">
                <GradCapIcon className="h-16 w-16 text-white" />
              </div>
            ) : (
              <img
                src="/hero-family6.jpeg"
                alt="Parent and schoolgirl seen from behind, holding hands and walking to school"
                className="h-[440px] w-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero