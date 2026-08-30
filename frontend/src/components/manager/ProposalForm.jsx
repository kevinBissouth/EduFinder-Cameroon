import { useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  Building2,
  GraduationCap,
  DollarSign,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Formulaire multi-étapes : les champs sont découpés en pages logiques, avec
// un pas à pas en haut et des boutons Précédent / Suivant en bas — reprend le
// pattern « multistep form » sans ajouter de dépendance (framer-motion +
// lucide suffisent).

const STEPS = [
  { id: 'general', title: 'General info', icon: Building2 },
  { id: 'location', title: 'Location & type', icon: MapPin },
  { id: 'programs', title: 'Programs', icon: GraduationCap },
  { id: 'fees', title: 'Fees', icon: DollarSign },
  { id: 'services', title: 'Services', icon: Sparkles },
]

const cn = (...classes) => classes.filter(Boolean).join(' ')

// Année scolaire courante (Cameroun : septembre → août), dérivée de la date
// réelle pour servir de placeholder aux champs de frais — jamais codée en dur.
function currentSchoolYear() {
  const now = new Date()
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${start + 1}`
}

const contentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">
        {label} {required && <span className="text-[#0d7a4f]">*</span>}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function FeesEditor({ fees, onFeesChange, levels }) {
  function updateRow(index, field, value) {
    const next = fees.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    onFeesChange(next)
  }

  return (
    <div>
      {fees.length > 0 && (
        <div className="mb-3 space-y-2">
          {fees.map((feeRow, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eef1f8] bg-[#f9fafb] p-2.5"
            >
              <select
                value={feeRow.id_level}
                onChange={(event) => updateRow(index, 'id_level', event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-[#dcebe3] bg-white px-2 text-sm outline-none focus:border-[#0d7a4f]"
              >
                <option value="">Level…</option>
                {levels.map((level) => (
                  <option key={level.id} value={String(level.id)}>
                    {level.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Amount"
                value={feeRow.amount}
                onChange={(event) => updateRow(index, 'amount', event.target.value)}
                className="h-9 w-28 rounded-lg border border-[#dcebe3] bg-white px-3 text-sm outline-none focus:border-[#0d7a4f]"
              />
              <input
                type="text"
                placeholder={currentSchoolYear()}
                title={`Format: ${currentSchoolYear()}`}
                value={feeRow.school_year}
                onChange={(event) => updateRow(index, 'school_year', event.target.value)}
                className="h-9 w-28 rounded-lg border border-[#dcebe3] bg-white px-3 text-sm outline-none focus:border-[#0d7a4f]"
              />
              <button
                type="button"
                onClick={() => onFeesChange(fees.filter((_, rowIndex) => rowIndex !== index))}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Remove fee row"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onFeesChange([...fees, { id_level: '', amount: '', school_year: '' }])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#dcebe3] px-3 py-2 text-xs font-semibold text-[#0d7a4f] transition-colors hover:border-[#0d7a4f]/40 hover:bg-[#e5f3ec]"
      >
        <Plus size={13} />
        Add a fee row
      </button>
    </div>
  )
}

export default function ProposalForm({
  mode,
  meta,
  school = null,
  submitting,
  serverError,
  onSubmit,
  onClose,
}) {
  const isCreation = mode === 'creation'
  const [currentStep, setCurrentStep] = useState(0)
  const [scalars, setScalars] = useState(() => ({
    name: school?.name ?? '',
    phone: '',
    id_city: '',
    id_type: '',
    id_sector: '',
    id_linguistic_section: '',
  }))
  const [fees, setFees] = useState([])
  const [servicesText, setServicesText] = useState('')
  const [programIds, setProgramIds] = useState([])

  function setScalar(fieldName, value) {
    setScalars((current) => ({ ...current, [fieldName]: value }))
  }

  // Validation propre à chaque étape : le bouton Suivant reste désactivé tant
  // que l'étape courante n'est pas remplie (création). Modification : on peut
  // avancer, tout champ rempli partira.
  function isStepValid() {
    if (!isCreation) return true
    switch (currentStep) {
      case 0:
        return scalars.name.trim() !== ''
      case 1:
        return Boolean(
          scalars.id_city && scalars.id_type && scalars.id_sector && scalars.id_linguistic_section,
        )
      default:
        return true
    }
  }

  // Payload minimal : les champs vides ne partent pas (le backend n'applique
  // que ce qui est réellement proposé).
  function buildPayload() {
    const payload = {}
    Object.entries(scalars).forEach(([fieldName, rawValue]) => {
      if (rawValue === '') return
      payload[fieldName] = fieldName.startsWith('id_') ? Number(rawValue) : rawValue
    })
    const completeFeeRows = fees.filter((row) => row.id_level && row.amount && row.school_year)
    if (completeFeeRows.length > 0) {
      payload.fees = completeFeeRows.map((row) => ({
        id_level: Number(row.id_level),
        amount: row.amount,
        school_year: row.school_year.trim(),
      }))
    }
    const serviceNames = servicesText.split(',').map((name) => name.trim()).filter(Boolean)
    if (serviceNames.length > 0) payload.services = serviceNames
    if (programIds.length > 0) payload.program_ids = programIds.map(Number)
    return payload
  }

  function goNext() {
    if (currentStep < STEPS.length - 1) setCurrentStep((step) => step + 1)
  }
  function goBack() {
    if (currentStep > 0) setCurrentStep((step) => step - 1)
  }

  function handleFinalStep() {
    onSubmit(buildPayload())
  }

  const progress = (currentStep / (STEPS.length - 1)) * 100

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* En-tête avec bouton retour */}
      <div className="mb-6 flex items-start gap-4">
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dcebe3] text-[#4b5566] transition-colors hover:bg-[#eef4f0] hover:text-[#081220]"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d7a4f]">
            {isCreation ? 'New proposal' : `Modification — ${school.name}`}
          </p>
          <h2 className="font-display mt-1 text-2xl font-bold text-[#081220]">
            {isCreation ? 'Propose a new school' : 'Propose changes'}
          </h2>
          {!isCreation && (
            <p className="mt-1 text-sm text-[#4b5566]">
              Fill only the steps you want to change — an administrator will review before it is applied.
            </p>
          )}
        </div>
      </div>

      {/* Indicateur d'étapes : pastilles cliquables + barre de progression */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <motion.button
                type="button"
                onClick={() => {
                  if (index <= currentStep) setCurrentStep(index)
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={step.title}
                title={isCreation && index > currentStep ? step.title : undefined}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300',
                  index < currentStep
                    ? 'bg-[#0d7a4f] text-white'
                    : index === currentStep
                      ? 'bg-[#0d7a4f] text-white ring-4 ring-[#0d7a4f]/15'
                      : 'bg-[#e6ece8] text-[#8a90a0]',
                )}
              >
                {index < currentStep ? <Check size={13} /> : index + 1}
              </motion.button>
              <span
                className={cn(
                  'mt-1.5 hidden text-[10px] font-medium sm:block',
                  index === currentStep ? 'text-[#0d7a4f]' : 'text-[#8a90a0]',
                )}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6ece8]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Carte de l'étape courante */}
      <div className="overflow-hidden rounded-2xl border border-[#dcebe3] bg-white shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            className="p-6"
          >
            {/* Étape 1 : généralités */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">General info</h3>
                  <p className="text-xs text-[#8a90a0]">Start with the basics about the institution.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">
                    School name {isCreation && <span className="text-[#0d7a4f]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={scalars.name}
                    onChange={(event) => setScalar('name', event.target.value)}
                    placeholder="e.g. Bilingual Academy of Douala"
                    required={isCreation}
                    className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">Phone</label>
                  <input
                    type="tel"
                    value={scalars.phone}
                    onChange={(event) => setScalar('phone', event.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
              </div>
            )}

            {/* Étape 2 : localisation et classification */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Location & type</h3>
                  <p className="text-xs text-[#8a90a0]">Where it is and how it is classified.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="City"
                    required={isCreation}
                    value={scalars.id_city}
                    onChange={(value) => setScalar('id_city', value)}
                    options={meta.cities ?? []}
                  />
                  <SelectField
                    label="Type"
                    required={isCreation}
                    value={scalars.id_type}
                    onChange={(value) => setScalar('id_type', value)}
                    options={meta.types ?? []}
                  />
                  <SelectField
                    label="Sector"
                    required={isCreation}
                    value={scalars.id_sector}
                    onChange={(value) => setScalar('id_sector', value)}
                    options={meta.sectors ?? []}
                  />
                  <SelectField
                    label="Language section"
                    required={isCreation}
                    value={scalars.id_linguistic_section}
                    onChange={(value) => setScalar('id_linguistic_section', value)}
                    options={meta.languages ?? []}
                  />
                </div>
              </div>
            )}

            {/* Étape 3 : programmes */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Academic programs</h3>
                  <p className="text-xs text-[#8a90a0]">Select all programs the school offers.</p>
                </div>
                {(meta.programs ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {meta.programs.map((program) => {
                      const checked = programIds.includes(String(program.id))
                      return (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() =>
                            setProgramIds((current) =>
                              checked
                                ? current.filter((id) => id !== String(program.id))
                                : [...current, String(program.id)],
                            )
                          }
                          className={cn(
                            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                            checked
                              ? 'border-[#0d7a4f] bg-[#0d7a4f] text-white shadow-sm'
                              : 'border-[#dcebe3] bg-white text-[#4b5566] hover:border-[#0d7a4f]/40 hover:text-[#081220]',
                          )}
                        >
                          {program.name}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#8a90a0]">No programs available yet.</p>
                )}
              </div>
            )}

            {/* Étape 4 : frais */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">School fees</h3>
                  <p className="text-xs text-[#8a90a0]">Annual fees per level in FCFA.</p>
                </div>
                <FeesEditor fees={fees} onFeesChange={setFees} levels={meta.levels ?? []} />
              </div>
            )}

            {/* Étape 5 : services */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Services & facilities</h3>
                  <p className="text-xs text-[#8a90a0]">Comma separated list of facilities available.</p>
                </div>
                <input
                  type="text"
                  value={servicesText}
                  onChange={(event) => setServicesText(event.target.value)}
                  placeholder="Library, Canteen, Transport, Laboratory…"
                  className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Erreur serveur */}
        {serverError && (
          <div className="mx-6 -mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Pied : Précédent / Suivant ou Soumettre */}
        <div className="flex items-center justify-between border-t border-[#eef1f8] px-6 py-4">
          <motion.button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            whileHover={currentStep > 0 ? { scale: 1.03 } : undefined}
            whileTap={currentStep > 0 ? { scale: 0.97 } : undefined}
            className="inline-flex items-center gap-1 rounded-xl border border-[#dcebe3] px-4 py-2.5 text-sm font-semibold text-[#4b5566] transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Back
          </motion.button>

          <motion.button
            type="button"
            onClick={currentStep === STEPS.length - 1 ? handleFinalStep : goNext}
            disabled={!isStepValid() || submitting}
            whileHover={isStepValid() ? { scale: 1.03 } : undefined}
            whileTap={isStepValid() ? { scale: 0.97 } : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d7a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0a5e3d] hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting…
              </>
            ) : currentStep === STEPS.length - 1 ? (
              <>
                Submit
                <Check size={15} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={15} />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Indicateur texte : étape X de Y */}
      <motion.p
        className="mt-4 text-center text-xs text-[#8a90a0]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
      </motion.p>
    </div>
  )
}
