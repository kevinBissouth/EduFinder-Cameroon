import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import { API_URL } from '../constants'

// Tout l'état de recherche vit ici : chaque filtre déclenche une vraie requête
// axios vers /institutions, les composants ne font que consommer cet état.
export function useInstitutions() {
  const [allInstitutions, setAllInstitutions] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [cityId, setCityId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [langId, setLangId] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [minFee, setMinFee] = useState('')
  const [maxFee, setMaxFee] = useState('')
  const [serviceNames, setServiceNames] = useState([])
  const [examRequirements, setExamRequirements] = useState([])
  const [meta, setMeta] = useState({ regions: [], sectors: [], exams: [], services: [], cities: [], types: [], languages: [] })
  const [metaError, setMetaError] = useState(false)

  const scrollToResults = () => {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
  }

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = new URLSearchParams()
      const query = (overrides.search ?? appliedSearch).trim()
      const city = overrides.city ?? cityId
      const type = overrides.type ?? typeId
      const lang = overrides.lang ?? langId
      const sector = overrides.sector ?? sectorId
      const region = overrides.region ?? regionId
      const minimumFee = overrides.minFee ?? minFee
      const maximumFee = overrides.maxFee ?? maxFee
      const services = overrides.serviceNames ?? serviceNames
      const exams = overrides.examRequirements ?? examRequirements
      if (query) params.set('q', query)
      if (city) params.set('city_id', city)
      if (type) params.set('type_id', type)
      if (lang) params.set('linguistic_section_id', lang)
      if (sector) params.set('sector_id', sector)
      if (region) params.set('region_id', region)
      if (minimumFee) params.set('min_fee', minimumFee)
      if (maximumFee) params.set('max_fee', maximumFee)
      services.forEach((name) => params.append('service', name))
      exams.forEach((requirement) => params.append('exam', `${requirement.examId}:${requirement.minRate}`))
      return params
    },
    [appliedSearch, cityId, typeId, langId, sectorId, regionId, minFee, maxFee, serviceNames, examRequirements],
  )

  const fetchInstitutions = useCallback(
    async (params = new URLSearchParams()) => {
      setStatus('loading')
      try {
        const response = await axios.get(`${API_URL}/institutions`, { params })
        setInstitutions(response.data)
        setStatus('success')
      } catch {
        setInstitutions([])
        setStatus('error')
      }
    },
    [],
  )

  useEffect(() => {
    fetchInstitutions()

    axios
      .get(`${API_URL}/institutions`)
      .then((response) => setAllInstitutions(response.data))
      .catch(() => {})
  }, [fetchInstitutions])

  
  useEffect(() => {
    axios
      .get(`${API_URL}/filters-meta`)
      .then((response) => setMeta(response.data))
      .catch(() => setMetaError(true))
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setAppliedSearch(search)
    fetchInstitutions(buildParams({ search }))
    scrollToResults()
  }

  const handleCityChange = (event) => {
    const nextCity = event.target.value
    setCityId(nextCity)
    fetchInstitutions(buildParams({ city: nextCity }))
  }

  const handleTypeChange = (event) => {
    const nextType = event.target.value
    setTypeId(nextType)
    fetchInstitutions(buildParams({ type: nextType }))
  }


  const toggleCity = (id) => {
    const next = cityId === String(id) ? '' : String(id)
    setCityId(next)
    fetchInstitutions(buildParams({ city: next }))
    scrollToResults()
  }

  const toggleType = (id) => {
    const next = typeId === String(id) ? '' : String(id)
    setTypeId(next)
    fetchInstitutions(buildParams({ type: next }))
    scrollToResults()
  }

  const selectSection = (id) => {
    const next = id
    setLangId(next)
    fetchInstitutions(buildParams({ lang: next }))
  }

  const selectSector = (id) => {
    const next = id
    setSectorId(next)
    fetchInstitutions(buildParams({ sector: next }))
  }

  const selectRegion = (id) => {
    const next = id
    setRegionId(next)
    fetchInstitutions(buildParams({ region: next }))
  }

  const applyBudget = (minimum, maximum) => {
    setMinFee(minimum)
    setMaxFee(maximum)
    fetchInstitutions(buildParams({ minFee: minimum, maxFee: maximum }))
  }

  const toggleService = (name) => {
    const next = serviceNames.includes(name)
      ? serviceNames.filter((current) => current !== name)
      : [...serviceNames, name]
    setServiceNames(next)
    fetchInstitutions(buildParams({ serviceNames: next }))
  }

  const applyExams = (requirements) => {
    setExamRequirements(requirements)
    fetchInstitutions(buildParams({ examRequirements: requirements }))
  }

  const handleRemoveFilter = (key) => {
    if (key === 'q') {
      setAppliedSearch('')
      setSearch('')
      fetchInstitutions(buildParams({ search: '' }))
    }
    if (key === 'city') {
      setCityId('')
      fetchInstitutions(buildParams({ city: '' }))
    }
    if (key === 'type') {
      setTypeId('')
      fetchInstitutions(buildParams({ type: '' }))
    }
    if (key === 'lang') {
      setLangId('')
      fetchInstitutions(buildParams({ lang: '' }))
    }
    if (key === 'sector') {
      setSectorId('')
      fetchInstitutions(buildParams({ sector: '' }))
    }
    if (key === 'region') {
      setRegionId('')
      fetchInstitutions(buildParams({ region: '' }))
    }
    if (key === 'budget') {
      setMinFee('')
      setMaxFee('')
      fetchInstitutions(buildParams({ minFee: '', maxFee: '' }))
    }
    if (key === 'services') {
      setServiceNames([])
      fetchInstitutions(buildParams({ serviceNames: [] }))
    }
    if (key === 'exams') {
      setExamRequirements([])
      fetchInstitutions(buildParams({ examRequirements: [] }))
    }
  }

  const handleReset = () => {
    setSearch('')
    setAppliedSearch('')
    setCityId('')
    setTypeId('')
    setLangId('')
    setSectorId('')
    setRegionId('')
    setMinFee('')
    setMaxFee('')
    setServiceNames([])
    setExamRequirements([])
    fetchInstitutions(new URLSearchParams())
    scrollToResults()
  }

  const cityCounts = allInstitutions.reduce((acc, inst) => {
    acc[inst.city] = (acc[inst.city] || 0) + 1
    return acc
  }, {})

  const cityCount = new Set(allInstitutions.map((inst) => inst.city)).size

  const recommendedCity = allInstitutions.find((inst) => inst.recommended)?.city

  const topDestinations = [...meta.cities]
    .map((city) => ({ ...city, count: cityCounts[city.name] || 0 }))
    .filter((city) => city.count > 0)
    .sort((a, b) => {
      if (recommendedCity) {
        if (a.name === recommendedCity) return -1
        if (b.name === recommendedCity) return 1
      }
      return b.count - a.count
    })
    .slice(0, 5)

  const activeCity = meta.cities.find((city) => city.id === Number(cityId))
  const activeType = meta.types.find((type) => type.id === Number(typeId))
  const activeLang = meta.languages.find((language) => language.id === Number(langId))
  const activeSector = meta.sectors.find((sector) => String(sector.id) === String(sectorId))
  const activeRegion = meta.regions.find((region) => String(region.id) === String(regionId))
  const hasFilters = Boolean(
    appliedSearch.trim() ||
      cityId ||
      typeId ||
      langId ||
      sectorId ||
      regionId ||
      minFee ||
      maxFee ||
      serviceNames.length ||
      examRequirements.length,
  )

  return {
    allInstitutions,
    institutions,
    status,
    search,
    appliedSearch,
    cityId,
    typeId,
    langId,
    sectorId,
    regionId,
    minFee,
    maxFee,
    serviceNames,
    examRequirements,
    meta,
    metaError,
    handleSubmit,
    handleCityChange,
    handleTypeChange,
    toggleCity,
    toggleType,
    selectSection,
    selectSector,
    selectRegion,
    applyBudget,
    toggleService,
    applyExams,
    handleRemoveFilter,
    handleReset,
    fetchInstitutions,
    buildParams,
    cityCounts,
    topDestinations,
    cityCount,
    activeCity,
    activeType,
    activeLang,
    activeSector,
    activeRegion,
    hasFilters,
    setSearch,
  }
}
