import { useState } from 'react'

import { ChevronDownIcon } from './icons'

function SelectFilter({ label, value, onChange, options, placeholder }) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4b5566]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-[#dcebe3] bg-white px-3 pr-9 text-sm text-[#081220] outline-none transition-colors hover:border-[#0d7a4f]/40 focus:border-[#0d7a4f]"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4b5566]" />
      </div>
    </label>
  )
}


function DropdownFilter({ label, count, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#dcebe3] bg-white px-4 text-sm font-medium text-[#081220] transition-colors hover:border-[#0d7a4f]/40"
      >
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {count > 0 && (
            <span className="rounded-full bg-[#0d7a4f] px-2 py-0.5 text-[11px] font-semibold text-white">{count}</span>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-full z-20 mt-2 max-h-[70vh] w-72 max-w-[90vw] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#dcebe3] bg-white p-4 shadow-[0_22px_54px_rgba(8,18,32,0.16)]">
            {children({ close: () => setOpen(false) })}
          </div>
        </>
      )}
    </div>
  )
}

function BudgetPanel({ minFee, maxFee, onApply }) {
  const [minimum, setMinimum] = useState(minFee || '')
  const [maximum, setMaximum] = useState(maxFee || '')

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4b5566]">Min (FCFA)</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[#dcebe3] bg-white px-3 text-sm text-[#081220] outline-none focus:border-[#0d7a4f]"
            placeholder="0"
          />
        </label>
        <label className="flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4b5566]">Max (FCFA)</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={maximum}
            onChange={(event) => setMaximum(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[#dcebe3] bg-white px-3 text-sm text-[#081220] outline-none focus:border-[#0d7a4f]"
            placeholder="∞"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onApply('', '')}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[#4b5566] hover:text-[#081220]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(minimum, maximum)}
          className="rounded-lg bg-[#0d7a4f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0a5e3d]"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

function ServicesPanel({ services, selected, onToggle }) {
  return (
    <div>
      {services.length === 0 && <p className="px-2 py-2 text-sm text-[#4b5566]">No service available.</p>}
      {services.map((name) => (
        <label key={name} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#f0f8f4]">
          <input
            type="checkbox"
            checked={selected.includes(name)}
            onChange={() => onToggle(name)}
            className="h-4 w-4 accent-[#0d7a4f]"
          />
          <span className="text-sm text-[#081220]">{name}</span>
        </label>
      ))}
    </div>
  )
}

function ExamPanel({ exams, requirements, onApply }) {
  const [rows, setRows] = useState(requirements.length ? requirements : [{ examId: '', minRate: '' }])

  const updateRow = (index, patch) =>
    setRows((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  const removeRow = (index) => setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
  const addRow = () => setRows((previous) => [...previous, { examId: '', minRate: '' }])

  return (
    <div>
      <div className="space-y-2 pr-1">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={row.examId}
              onChange={(event) => updateRow(index, { examId: event.target.value })}
              className="h-9 flex-1 rounded-lg border border-[#dcebe3] bg-white px-2 text-sm text-[#081220] outline-none focus:border-[#0d7a4f]"
            >
              <option value="">Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
            <div className="flex items-center rounded-lg border border-[#dcebe3] px-2">
              <input
                type="number"
                min="0"
                max="100"
                value={row.minRate}
                onChange={(event) => updateRow(index, { minRate: event.target.value })}
                className="h-9 w-16 bg-white text-sm text-[#081220] outline-none"
                placeholder="%"
              />
              <span className="text-sm text-[#4b5566]">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="px-1 text-lg leading-none text-[#4b5566] transition-colors hover:text-[#d6453d]"
              aria-label="Remove exam"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-sm font-medium text-[#0d7a4f] transition-colors hover:underline"
      >
        + Add exam
      </button>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onApply(rows.filter((row) => row.examId && row.minRate))}
          className="rounded-lg bg-[#0d7a4f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0a5e3d]"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// Barre de critères avancés 
function AdvancedFilters({ advancedFilters }) {
  const {
    meta,
    sectionId,
    sectorId,
    regionId,
    minFee,
    maxFee,
    serviceNames,
    examRequirements,
    onSectionChange,
    onSectorChange,
    onRegionChange,
    onApplyBudget,
    onToggleService,
    onApplyExams,
  } = advancedFilters

  const sectionOptions = meta.languages.map((language) => ({ id: String(language.id), label: language.name }))

  const sectorOptions = meta.sectors.map((sector) => ({ id: String(sector.id), label: sector.name }))
  const regionOptions = meta.regions.map((region) => ({ id: String(region.id), label: region.name }))
  const budgetActive = Boolean(minFee || maxFee)

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SelectFilter label="Section" value={sectionId} onChange={onSectionChange} options={sectionOptions} placeholder="All sections" />
      <SelectFilter label="Sector" value={sectorId} onChange={onSectorChange} options={sectorOptions} placeholder="All sectors" />
      <SelectFilter label="Region" value={regionId} onChange={onRegionChange} options={regionOptions} placeholder="All regions" />
      <DropdownFilter label="Budget" count={budgetActive ? 1 : 0}>
        {({ close }) => (
          <BudgetPanel
            minFee={minFee}
            maxFee={maxFee}
            onApply={(minimum, maximum) => {
              onApplyBudget(minimum, maximum)
              close()
            }}
          />
        )}
      </DropdownFilter>
      <DropdownFilter label="Services" count={serviceNames.length}>
        {() => (
          <ServicesPanel services={meta.services} selected={serviceNames} onToggle={onToggleService} />
        )}
      </DropdownFilter>
      <DropdownFilter label="Pass rate" count={examRequirements.length}>
        {({ close }) => (
          <ExamPanel
            exams={meta.exams}
            requirements={examRequirements}
            onApply={(requirements) => {
              onApplyExams(requirements)
              close()
            }}
          />
        )}
      </DropdownFilter>
    </div>
  )
}

export default AdvancedFilters
