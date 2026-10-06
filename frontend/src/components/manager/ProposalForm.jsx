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
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Award,
  UserRound,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authedRequest } from '../../utils/auth'
import { API_URL } from '../../constants'

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
  { id: 'results', title: 'Results', icon: Award },
  { id: 'leadership', title: 'Leadership', icon: UserRound },
  { id: 'media', title: 'Photos & médias', icon: ImageIcon },
]

// Types dont la scolarité est par classes uniquement : l'interface n'offre pas
// l'étape « Programmes » quand on choisit un de ces types.
const TYPES_WITHOUT_PROGRAMS = new Set(['Nursery', 'Primary', 'Secondary general'])

function typeAllowsPrograms(typeLabel) {
  return !TYPES_WITHOUT_PROGRAMS.has(typeLabel)
}

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

function FeesEditor({ fees, onFeesChange, levels, paymentMethods }) {
  function updateRow(index, field, value) {
    const next = fees.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    onFeesChange(next)
  }

  function togglePaymentMethod(index, paymentLabel) {
    const current = fees[index].payment_methods ?? []
    const nextList = current.includes(paymentLabel)
      ? current.filter((label) => label !== paymentLabel)
      : [...current, paymentLabel]
    updateRow(index, 'payment_methods', nextList)
  }

  return (
    <div>
      {fees.length > 0 && (
        <div className="space-y-3">
          {fees.map((feeRow, index) => (
            <div
              key={index}
              className="rounded-lg border border-[#eef1f8] bg-[#f9fafb] p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
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
              {/* Modalités de paiement rattachées au frais de ce niveau : la
                  liste référencée (meta.payment_methods) est proposée, et je
                  préserve les plans déjà saisis même hors référence. */}
              {paymentMethods.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(new Set([...paymentMethods, ...(feeRow.payment_methods ?? [])])).map(
                    (paymentLabel) => {
                      const checked = (feeRow.payment_methods ?? []).includes(paymentLabel)
                      return (
                        <label
                          key={paymentLabel}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            checked
                              ? 'border-[#0d7a4f] bg-[#e5f3ec] text-[#0a5e3d]'
                              : 'border-[#dcebe3] bg-white text-[#4b5566] hover:border-[#0d7a4f]/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePaymentMethod(index, paymentLabel)}
                            className="h-3 w-3 accent-[#0d7a4f]"
                          />
                          {paymentLabel}
                        </label>
                      )
                    },
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          onFeesChange([...fees, { id_level: '', amount: '', school_year: '', payment_methods: [] }])
        }
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#dcebe3] px-3 py-2 text-xs font-semibold text-[#0d7a4f] transition-colors hover:border-[#0d7a4f]/40 hover:bg-[#e5f3ec]"
      >
        <Plus size={13} />
        Add a fee row
      </button>
    </div>
  )
}

// Éditeur de résultats d'examens : une ligne = un examen (choisi dans la
// référence) + sa session + son taux de réussite, ajoutable/supprimable.
function ResultsEditor({ results, onResultsChange, exams }) {
  function updateRow(index, field, value) {
    const next = results.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    )
    onResultsChange(next)
  }

  return (
    <div>
      {results.length > 0 && (
        <div className="mb-3 space-y-2">
          {results.map((resultRow, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eef1f8] bg-[#f9fafb] p-2.5"
            >
              <select
                value={resultRow.id_exam}
                onChange={(event) => updateRow(index, 'id_exam', event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-[#dcebe3] bg-white px-2 text-sm outline-none focus:border-[#0d7a4f]"
              >
                <option value="">Exam…</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={String(exam.id)}>
                    {exam.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Session (e.g. 2024)"
                title="Year of the exam session"
                value={resultRow.session}
                onChange={(event) => updateRow(index, 'session', event.target.value)}
                className="h-9 w-28 rounded-lg border border-[#dcebe3] bg-white px-3 text-sm outline-none focus:border-[#0d7a4f]"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Pass rate %"
                title="Pass rate (%)"
                value={resultRow.pass_rate}
                onChange={(event) => updateRow(index, 'pass_rate', event.target.value)}
                className="h-9 w-28 rounded-lg border border-[#dcebe3] bg-white px-3 text-sm outline-none focus:border-[#0d7a4f]"
              />
              <button
                type="button"
                onClick={() => onResultsChange(results.filter((_, rowIndex) => rowIndex !== index))}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Remove result row"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onResultsChange([...results, { id_exam: '', session: '', pass_rate: '' }])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#dcebe3] px-3 py-2 text-xs font-semibold text-[#0d7a4f] transition-colors hover:border-[#0d7a4f]/40 hover:bg-[#e5f3ec]"
      >
        <Plus size={13} />
        Add a result
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
  const detail = school?.detail ?? null
  const prefillFees = detail?.fees ?? []
  const prefillServices = detail?.services ?? []
  const prefillProgramNames = detail?.programs ?? []
  const [currentStep, setCurrentStep] = useState(0)
  const [scalars, setScalars] = useState(() => ({
    name: school?.name ?? '',
    phone: '',
    id_city: '',
    id_type: '',
    id_sector: '',
    id_linguistic_section: '',
    contact_email: detail?.contact_email ?? '',
    website: detail?.website ?? '',
    address: detail?.address ?? '',
    description: detail?.description ?? '',
    director_name: detail?.director_name ?? '',
    director_title: detail?.director_title ?? '',
    director_bio: detail?.director_bio ?? '',
  }))
  const [fees, setFees] = useState(() =>
    isCreation
      ? []
      : prefillFees.map((fee) => ({
          id_level: String(fee.id_level),
          amount: String(fee.amount),
          school_year: fee.school_year,
          payment_methods: fee.payment_methods ?? [],
        })),
  )
  // Résultats d'examens : pré-remplis en modification depuis la fiche, vides à
  // la création. Chaque entrée porte id_exam, session et taux (pass_rate).
  const [examResults, setExamResults] = useState(() =>
    isCreation
      ? []
      : (detail?.exam_results ?? []).map((entry) => ({
          id_exam: String(entry.id_exam),
          session: entry.session,
          pass_rate: String(entry.pass_rate),
        })),
  )
  // Photo du directeur : distincte des autres scalaires car c'est une URL
  // d'upload (soumise dans le payload, appliquée à l'approbation).
  const [directorPhotoUrl, setDirectorPhotoUrl] = useState(
    isCreation ? '' : (detail?.director_photo_url ?? ''),
  )
  // Les services sont choisis dans une liste (cases à cocher) issue de
  // meta.services. En création la sélection part de rien ; en modification elle
  // reprend les services actuellement proposés par l'établissement.
  const [selectedServices, setSelectedServices] = useState(() => {
    const initial = isCreation ? [] : prefillServices.map((service) => service.name)
    return new Set(initial)
  })
  const [programIds, setProgramIds] = useState(() => {
    if (isCreation) return []
    const idByProgramName = new Map(
      (meta.programs ?? []).map((program) => [program.name, String(program.id)]),
    )
    return prefillProgramNames.map((name) => idByProgramName.get(name)).filter(Boolean)
  })

  // Type d'établissement effectif (choix du formulaire, sinon type actuel en
  // modification) : détermine si l'étape « Programmes » est proposée.
  const selectedTypeLabel =
    (meta.types ?? []).find((type) => String(type.id) === String(scalars.id_type))?.name ||
    detail?.type ||
    ''
  const allowsPrograms = !selectedTypeLabel || typeAllowsPrograms(selectedTypeLabel)
  const visibleSteps = STEPS.filter(
    (step) =>
      (step.id !== 'programs' || allowsPrograms) && (step.id !== 'media' || isCreation),
  )
  const lastStepIndex = visibleSteps.length - 1

  // En modification, le formulaire est pré-rempli avec les valeurs actuelles.
  // On n'envoie une catégorie que si le responsable l'a réellement retouchée
  // (flag dirty) : envoyer une liste vide = tout retirer, ne pas l'envoyer =
  // laisser inchangé.
  const [dirtyFees, setDirtyFees] = useState(false)
  const [dirtyServices, setDirtyServices] = useState(false)
  const [dirtyPrograms, setDirtyPrograms] = useState(false)
  const [dirtyResults, setDirtyResults] = useState(false)
  const [dirtyDirector, setDirtyDirector] = useState(false)

  // Médias de création : une couverture (image) et une liste de vidéos. Le
  // fichier est envoyé à /my/uploads/media, qui renvoie l'URL à soumettre.
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('')
  const [videoUrls, setVideoUrls] = useState([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaUploadError, setMediaUploadError] = useState('')

  function changeFees(nextFees) {
    setDirtyFees(true)
    setFees(nextFees)
  }
  function toggleService(serviceName) {
    setDirtyServices(true)
    setSelectedServices((current) => {
      const next = new Set(current)
      if (next.has(serviceName)) next.delete(serviceName)
      else next.add(serviceName)
      return next
    })
  }
  function changeProgramIds(nextProgramIds) {
    setDirtyPrograms(true)
    setProgramIds(nextProgramIds)
  }

  function setScalar(fieldName, value) {
    setScalars((current) => ({ ...current, [fieldName]: value }))
  }

  // Upload d'un fichier média détaché (couverture ou vidéo) vers le serveur.
  // Le backend renvoie l'URL publique ; elle est ajoutée au payload soumis.
  async function handleMediaUpload(file) {
    if (!file) return
    setMediaUploadError('')
    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await authedRequest('post', '/my/uploads/media', formData)
      return data.url
    } catch (error) {
      const message =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        'Upload failed'
      setMediaUploadError(message)
      return null
    } finally {
      setUploadingMedia(false)
    }
  }

  async function handleCoverUpload(file) {
    const url = await handleMediaUpload(file)
    if (url) setCoverPhotoUrl(url)
  }

  async function handleVideoUpload(file) {
    const url = await handleMediaUpload(file)
    if (url) setVideoUrls((current) => [...current, url])
  }

  function removeVideo(url) {
    setVideoUrls((current) => current.filter((item) => item !== url))
  }

  function changeExamResults(nextResults) {
    setDirtyResults(true)
    setExamResults(nextResults)
  }

  async function handleDirectorPhotoUpload(file) {
    const url = await handleMediaUpload(file)
    if (url) {
      setDirectorPhotoUrl(url)
      setDirtyDirector(true)
    }
  }

  // Validation propre à chaque étape : le bouton Suivant reste désactivé tant
  // que l'étape courante n'est pas remplie (création). Modification : on peut
  // avancer, tout champ rempli partira.
  function isStepValid() {
    if (!isCreation) return true
    const stepId = visibleSteps[currentStep]?.id
    if (stepId === 'general') return scalars.name.trim() !== ''
    if (stepId === 'location')
      return Boolean(
        scalars.id_city && scalars.id_type && scalars.id_sector && scalars.id_linguistic_section,
      )
    return true
  }

  // Payload minimal : les champs vides ne partent pas (le backend n'applique
  // que ce qui est réellement proposé). En modification, chaque catégorie
  // (frais, services, programmes) n'est envoyée que si elle a été retouchée —
  // l'envoi d'une liste vide signifie alors « tout retirer ».
  function buildPayload() {
    const payload = {}
    Object.entries(scalars).forEach(([fieldName, rawValue]) => {
      if (rawValue === '') return
      payload[fieldName] = fieldName.startsWith('id_') ? Number(rawValue) : rawValue
    })
    const completeFeeRows = fees.filter((row) => row.id_level && row.amount && row.school_year)
    const readyFees = completeFeeRows.map((row) => ({
      id_level: Number(row.id_level),
      amount: row.amount,
      school_year: row.school_year.trim(),
      payment_methods: (row.payment_methods ?? []).filter(Boolean),
    }))
    const readyExamResults = examResults
      .filter((row) => row.id_exam && row.session && row.pass_rate !== '')
      .map((row) => ({
        id_exam: Number(row.id_exam),
        session: row.session.trim(),
        pass_rate: Number(row.pass_rate),
      }))
    const serviceNames = Array.from(selectedServices).sort()
    if (isCreation) {
      if (readyFees.length > 0) payload.fees = readyFees
      if (serviceNames.length > 0) payload.services = serviceNames
      if (programIds.length > 0) payload.program_ids = programIds.map(Number)
      if (readyExamResults.length > 0) payload.exam_results = readyExamResults
      if (coverPhotoUrl) payload.cover_photo = coverPhotoUrl
      if (videoUrls.length > 0) payload.videos = videoUrls
      if (directorPhotoUrl) payload.director_photo = directorPhotoUrl
    } else {
      if (dirtyFees) payload.fees = readyFees
      if (dirtyServices) payload.services = serviceNames
      if (dirtyPrograms) payload.program_ids = programIds.map(Number)
      if (dirtyResults) payload.exam_results = readyExamResults
      if (dirtyDirector && directorPhotoUrl) payload.director_photo = directorPhotoUrl
    }
    return payload
  }

  function goNext() {
    if (currentStep < lastStepIndex) setCurrentStep((step) => step + 1)
  }
  function goBack() {
    if (currentStep > 0) setCurrentStep((step) => step - 1)
  }

  function handleFinalStep() {
    onSubmit(buildPayload())
  }

  const progress = (currentStep / lastStepIndex) * 100

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
          {visibleSteps.map((step, index) => (
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
            {visibleSteps[currentStep]?.id === 'general' && (
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
            {visibleSteps[currentStep]?.id === 'location' && (
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
                {/* Adresse textuelle (quartier, rue, B.P.) : c'est le principal
                    moyen de localiser l'établissement, la carte a été retirée. */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#081220]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={scalars.address}
                    onChange={(event) => setScalar('address', event.target.value)}
                    placeholder="e.g. Bonanjo, P.O. Box 12345 Douala"
                    className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
              </div>
            )}

            {/* Étape 3 : programmes */}
            {visibleSteps[currentStep]?.id === 'programs' && (
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
                            changeProgramIds((current) =>
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
            {visibleSteps[currentStep]?.id === 'fees' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">School fees</h3>
                  <p className="text-xs text-[#8a90a0]">Annual fees per level in FCFA.</p>
                </div>
                <FeesEditor
                  fees={fees}
                  onFeesChange={changeFees}
                  levels={meta.levels ?? []}
                  paymentMethods={meta.payment_methods ?? []}
                />
              </div>
            )}

            {/* Étape 5 : services */}
            {visibleSteps[currentStep]?.id === 'services' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Services & facilities</h3>
                  <p className="text-xs text-[#8a90a0]">
                    Tick every facility this school provides. Your selection replaces the current list.
                  </p>
                </div>
                {/* J'unis la liste de référence (meta.services) et les services
                    déjà sélectionnés, au cas où un service existant ne figurerait
                    pas encore dans la référence. */}
                {(() => {
                  const availableServices = Array.from(
                    new Set([...(meta.services ?? []), ...selectedServices]),
                  ).sort()
                  if (availableServices.length === 0) {
                    return (
                      <p className="rounded-xl border border-[#e7ece9] bg-[#f7faf8] p-4 text-center text-sm text-[#8a90a0]">
                        No facilities available to select yet.
                      </p>
                    )
                  }
                  return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {availableServices.map((serviceName) => {
                        const checked = selectedServices.has(serviceName)
                        return (
                          <label
                            key={serviceName}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                              checked
                                ? 'border-[#0d7a4f] bg-[#e5f3ec] text-[#0a5e3d]'
                                : 'border-[#dcebe3] bg-[#f9fafb] text-[#334155] hover:bg-[#f0f6f2]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(serviceName)}
                              className="h-4 w-4 accent-[#0d7a4f]"
                            />
                            <span className="font-medium">{serviceName}</span>
                          </label>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Étape 6 : résultats d'examens */}
            {visibleSteps[currentStep]?.id === 'results' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Exam results</h3>
                  <p className="text-xs text-[#8a90a0]">
                    Official pass rates per exam and session. In modification, your selection
                    replaces the current results.
                  </p>
                </div>
                <ResultsEditor
                  results={examResults}
                  onResultsChange={changeExamResults}
                  exams={meta.exams ?? []}
                />
              </div>
            )}

            {/* Étape 7 : direction de l'établissement. En modification, le nom,
                le titre et la bio sont pré-remplis depuis la fiche ; la photo ne
                part que si le responsable en charge une nouvelle. */}
            {visibleSteps[currentStep]?.id === 'leadership' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">Leadership</h3>
                  <p className="text-xs text-[#8a90a0]">
                    Information about the school director, shown on the profile.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">
                    Director name
                  </label>
                  <input
                    type="text"
                    value={scalars.director_name}
                    onChange={(event) => setScalar('director_name', event.target.value)}
                    placeholder="e.g. Dr. Marie Ngono"
                    className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">
                    Director title
                  </label>
                  <input
                    type="text"
                    value={scalars.director_title}
                    onChange={(event) => setScalar('director_title', event.target.value)}
                    placeholder="e.g. Principal"
                    className="h-11 w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#343a44]">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={scalars.director_bio}
                    onChange={(event) => setScalar('director_bio', event.target.value)}
                    placeholder="A short background of the director."
                    className="w-full rounded-xl border border-[#dcebe3] bg-[#f9fafb] px-3 py-2.5 text-sm text-[#081220] outline-none transition-all placeholder:text-gray-400 focus:border-[#0d7a4f] focus:bg-white focus:ring-4 focus:ring-[#0d7a4f]/10"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a90a0]">
                    Director photo
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9d4cf] bg-[#f7faf8] p-6 text-sm text-[#0d7a4f] hover:bg-[#eef6f1]">
                    <Upload size={16} />
                    {directorPhotoUrl ? 'Replace photo' : 'Choose an image (jpg, png, webp)'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingMedia}
                      onChange={(event) => handleDirectorPhotoUpload(event.target.files?.[0])}
                    />
                  </label>
                  {directorPhotoUrl && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3e9e6] bg-white p-3">
                      <img
                        src={`${API_URL}${directorPhotoUrl}`}
                        alt="Director preview"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="flex-1 text-xs text-[#8a90a0]">Director photo selected.</div>
                      <button
                        type="button"
                        onClick={() => setDirectorPhotoUrl('')}
                        className="rounded-lg p-2 text-[#8a90a0] hover:bg-[#f2f4f3]"
                        aria-label="Remove director photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {uploadingMedia && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-[#8a90a0]">
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape media : photos & vidéos de création. Ces médias font
                partie de la proposition ; ils ne sont matérialisés sur la fiche
                qu'après approbation par le super administrateur. */}
            {visibleSteps[currentStep]?.id === 'media' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#081220]">
                    Photos & media
                  </h3>
                  <p className="text-xs text-[#8a90a0]">
                    Add a cover photo and videos. Files are uploaded now and applied when
                    your proposal is approved.
                  </p>
                </div>

                {mediaUploadError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {mediaUploadError}
                  </div>
                )}

                {/* Photo de couverture (une seule, écrasée si re-upload) */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a90a0]">
                    Cover photo
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9d4cf] bg-[#f7faf8] p-6 text-sm text-[#0d7a4f] hover:bg-[#eef6f1]">
                    <Upload size={16} />
                    {coverPhotoUrl ? 'Replace cover' : 'Choose an image (jpg, png, webp)'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingMedia}
                      onChange={(event) => handleCoverUpload(event.target.files?.[0])}
                    />
                  </label>
                  {coverPhotoUrl && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3e9e6] bg-white p-3">
                      <img
                        src={`${API_URL}${coverPhotoUrl}`}
                        alt="Cover preview"
                        className="h-16 w-24 rounded-lg object-cover"
                      />
                      <div className="flex-1 text-xs text-[#8a90a0]">
                        Cover photo ready to submit.
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverPhotoUrl('')}
                        className="rounded-lg p-2 text-[#8a90a0] hover:bg-[#f2f4f3]"
                        aria-label="Remove cover photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Vidéos (plusieurs, .mp4 / .webm) */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a90a0]">
                    Videos
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9d4cf] bg-[#f7faf8] p-6 text-sm text-[#0d7a4f] hover:bg-[#eef6f1]">
                    <Video size={16} />
                    Add a video (mp4, webm)
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      disabled={uploadingMedia}
                      onChange={(event) => handleVideoUpload(event.target.files?.[0])}
                    />
                  </label>
                  {videoUrls.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {videoUrls.map((url) => (
                        <li
                          key={url}
                          className="flex items-center gap-3 rounded-xl border border-[#e3e9e6] bg-white p-3 text-sm"
                        >
                          <Video size={16} className="text-[#0d7a4f]" />
                          <span className="flex-1 truncate text-xs text-[#334155]">
                            {url.split('/').pop()}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVideo(url)}
                            className="rounded-lg p-2 text-[#8a90a0] hover:bg-[#f2f4f3]"
                            aria-label="Remove video"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {uploadingMedia && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-[#8a90a0]">
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </p>
                  )}
                </div>
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
            onClick={currentStep === lastStepIndex ? handleFinalStep : goNext}
            disabled={!isStepValid() || submitting || uploadingMedia}
            whileHover={isStepValid() ? { scale: 1.03 } : undefined}
            whileTap={isStepValid() ? { scale: 0.97 } : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d7a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0a5e3d] hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting…
              </>
            ) : currentStep === lastStepIndex ? (
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
        Step {currentStep + 1} of {visibleSteps.length}: {visibleSteps[currentStep]?.title}
      </motion.p>
    </div>
  )
}
