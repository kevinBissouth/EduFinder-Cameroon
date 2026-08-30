import { useState } from 'react'
import { useInstitutions } from '../hooks/useInstitutions'
import { usePlatformStats } from '../hooks/usePlatformStats'
import Header from '../components/Header'
import Hero from '../components/Hero'
import HeroSteps from '../components/HeroSteps'
import StatsStrip from '../components/StatsStrip'
import ResultsSection from '../components/ResultsSection'
import PopularDestinations from '../components/PopularDestinations'
import GlobalPicture from '../components/GlobalPicture'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'
import LoadingOverlay from '../components/LoadingOverlay'
import { navigateToSchool } from '../routes'

function HomePage() {
  const api = useInstitutions()
  const { stats: platformStats, error: statsError } = usePlatformStats()

  const [comparedIds, setComparedIds] = useState([])

  const toggleCompare = (id) =>
    setComparedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )

  return (
    <div className="min-h-screen overflow-x-clip bg-white font-sans text-body">
      <Header
        activeTypeId={api.typeId}
        onNavigateToType={api.toggleType}
        types={api.meta.types}
        featuredTypeIds={api.meta.featured_type_ids}
        compareCount={comparedIds.length}
      />
      {api.status === 'loading' && <LoadingOverlay />}
      {(api.metaError || statsError) && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some filters or counters could not be loaded. Make sure the API
            server is running, then refresh the page.
          </div>
        </div>
      )}
      <Hero
        search={api.search}
        cityId={api.cityId}
        typeId={api.typeId}
        cities={api.meta.cities}
        types={api.meta.types}
        allCount={api.allInstitutions.length}
        cityCount={platformStats.cities}
        regionCount={api.meta.regions.length}
        feePlansCount={platformStats.fee_plans}
        examResultsCount={platformStats.exam_results}
        advancedFilters={{
          meta: api.meta,
          sectionId: api.langId,
          sectorId: api.sectorId,
          regionId: api.regionId,
          minFee: api.minFee,
          maxFee: api.maxFee,
          serviceNames: api.serviceNames,
          examRequirements: api.examRequirements,
          onSectionChange: api.selectSection,
          onSectorChange: api.selectSector,
          onRegionChange: api.selectRegion,
          onApplyBudget: api.applyBudget,
          onToggleService: api.toggleService,
          onApplyExams: api.applyExams,
        }}
        onSearchChange={(event) => api.setSearch(event.target.value)}
        onSubmit={api.handleSubmit}
        onCityChange={api.handleCityChange}
        onTypeChange={api.handleTypeChange}
      />
      <HeroSteps />
      <StatsStrip
        allCount={api.allInstitutions.length}
        cityCount={api.cityCount}
        regionCount={api.meta.regions.length}
      />
      <ResultsSection
        status={api.status}
        institutions={api.institutions}
        hasFilters={api.hasFilters}
        appliedSearch={api.appliedSearch}
        activeCity={api.activeCity}
        activeType={api.activeType}
        activeLang={api.activeLang}
        activeSector={api.activeSector}
        activeRegion={api.activeRegion}
        minFee={api.minFee}
        maxFee={api.maxFee}
        serviceNames={api.serviceNames}
        examRequirements={api.examRequirements}
        examMeta={api.meta.exams}
        onRemoveFilter={api.handleRemoveFilter}
        onReset={api.handleReset}
        onRetry={() => api.fetchInstitutions(api.buildParams())}
        onView={navigateToSchool}
        comparedIds={comparedIds}
        onToggleCompare={toggleCompare}
      />
      <PopularDestinations
        destinations={api.topDestinations}
        onToggleCity={api.toggleCity}
      />
      <GlobalPicture
        establishments={api.allInstitutions}
        cityCount={api.cityCount}
        regionCount={api.meta.regions.length}
        examResultsCount={platformStats.exam_results}
        feePlansCount={platformStats.fee_plans}
      />
      <HowItWorks
        matchCount={api.institutions.length}
        hasFilters={api.hasFilters}
        onReset={api.handleReset}
      />
      <Footer types={api.meta.types} />
    </div>
  )
}

export default HomePage
