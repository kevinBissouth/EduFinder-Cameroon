import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import CriteriaSection from '../components/CriteriaSection'
import CtaBand from '../components/CtaBand'
import Footer from '../components/Footer'
import GlobalPicture from '../components/GlobalPicture'
import Header from '../components/Header'
import Hero from '../components/Hero'
import HeroSteps from '../components/HeroSteps'
import PopularDestinations from '../components/PopularDestinations'
import ResultsSection from '../components/ResultsSection'
import SchoolsStrip from '../components/SchoolsStrip'
import Container from '../components/ui/Container'
import { useInstitutions } from '../hooks/useInstitutions'
import { usePlatformStats } from '../hooks/usePlatformStats'
import { navigateToSchool } from '../routes'

function HomePage() {
  const { t } = useTranslation('home')
  const api = useInstitutions()
  const { stats: platformStats, error: statsError } = usePlatformStats()
  const [comparedIds, setComparedIds] = useState([])

  // Avant la réponse de l'API, la liste des types mis en avant n'existe pas
  // encore : je pars alors d'une liste vide.
  const featuredTypes = (api.meta.featured_type_ids ?? [])
    .map((typeId) => api.meta.types.find((type) => type.id === typeId))
    .filter(Boolean)

  const toggleCompare = (schoolUuid) =>
    setComparedIds((currentIds) =>
      currentIds.includes(schoolUuid)
        ? currentIds.filter((comparedUuid) => comparedUuid !== schoolUuid)
        : [...currentIds, schoolUuid],
    )

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <Header
        activeTypeId={api.typeId}
        onNavigateToType={api.toggleType}
        types={api.meta.types}
        featuredTypeIds={api.meta.featured_type_ids}
        compareCount={comparedIds.length}
      />
      <main>
        {(api.metaError || statsError) && (
          <Container className="pt-4">
            <p
              role="alert"
              className="rounded-control border border-warning bg-warning-soft px-4 py-3 text-sm text-warning"
            >
              {t('loadWarning')}
            </p>
          </Container>
        )}
        <Hero
          searchState={{
            search: api.search,
            cityId: api.cityId,
            typeId: api.typeId,
            onSearchChange: (event) => api.setSearch(event.target.value),
            onSubmit: api.handleSubmit,
            onCityChange: api.handleCityChange,
            onTypeChange: api.handleTypeChange,
          }}
          cities={api.meta.cities}
          types={api.meta.types}
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
          figures={{
            schoolCount: api.allInstitutions.length,
            cityCount: api.cityCount,
            regionCount: api.meta.regions.length,
          }}
        />
        <HeroSteps />
        <SchoolsStrip institutions={api.allInstitutions} />
        <ResultsSection
          status={api.status}
          institutions={api.institutions}
          filters={{
            appliedSearch: api.appliedSearch,
            activeCity: api.activeCity,
            activeType: api.activeType,
            activeLang: api.activeLang,
            activeSector: api.activeSector,
            activeRegion: api.activeRegion,
            minFee: api.minFee,
            maxFee: api.maxFee,
            serviceNames: api.serviceNames,
            examRequirements: api.examRequirements,
            examMeta: api.meta.exams,
          }}
          typeTabs={{
            types: featuredTypes,
            activeTypeId: api.typeId,
            onToggleType: api.toggleType,
          }}
          onRemoveFilter={api.handleRemoveFilter}
          onReset={api.handleReset}
          onRetry={() => api.fetchInstitutions(api.buildParams())}
          onView={navigateToSchool}
          comparedIds={comparedIds}
          onToggleCompare={toggleCompare}
        />
        <CriteriaSection institutions={api.institutions} onView={navigateToSchool} />
        <PopularDestinations
          cities={api.topDestinations}
          activeCityId={api.cityId}
          onToggleCity={api.toggleCity}
        />
        <GlobalPicture
          institutions={api.allInstitutions}
          figures={{
            cityCount: api.cityCount,
            feePlanCount: platformStats.fee_plans,
            examResultCount: platformStats.exam_results,
          }}
        />
        <CtaBand />
      </main>
      <Footer types={api.meta.types} onNavigateToType={api.toggleType} />
    </div>
  )
}

export default HomePage
