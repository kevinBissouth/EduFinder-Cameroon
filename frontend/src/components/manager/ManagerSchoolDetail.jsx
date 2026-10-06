import {
  GraduationCap,
  MapPin,
  Layers,
  Globe,
  Award,
  ListChecks,
  FileText,
  Image as ImageIcon,
  Phone,
  Mail,
  Upload,
  Trash2,
  Pencil,
  Eye,
  ArrowLeft,
  X,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { typeSupportsPrograms, typeSupportsExamResults } from '../../utils/establishmentType'
import { authedRequest } from '../../utils/auth'
import { API_URL } from '../../constants'

import ExamResultsChart from '../school-profile/ExamResultsChart'
import ManagerFeesSection from './ManagerFeesSection'
import StatusBadge from './StatusBadge'
import { navigateToSchool } from '../../routes'
import { FactTile, BenchmarkRow, InlineField } from './ManagerShared'

// Les URLs de médias sont relatives côté API : on les rend absolues pour
// qu'elles pointent vers le serveur de fichiers, quel que soit le domaine.
const resolveMediaUrl = (url) =>
  !url ? null : url.startsWith('http') ? url : `${API_URL}${url}`

// Bloc de section continue : œil interne + grand titre, pas de carte.
function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      {eyebrow && (
        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#0d7a4f]">
          {eyebrow}
        </p>
      )}
      <h2 className="bg-gradient-to-r from-[#0a5e3d] via-[#0d7a4f] to-[#d9a406] bg-clip-text font-display text-[22px] font-bold tracking-tight text-transparent sm:text-[26px]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const SECTION_NAV = [
  { id: 'about', label: 'About' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'services', label: 'Services' },
  { id: 'fees', label: 'Fees' },
  { id: 'results', label: 'Results' },
  { id: 'location', label: 'Location' },
  { id: 'photos', label: 'Photos' },
  { id: 'contact', label: 'Contact' },
]

// Fiche détaillée « My school » : présentation continue type landing page,
// avec les actions d'édition réservées au responsable (propositions + médias).
export default function ManagerSchoolDetail({
  detail,
  detailStatus,
  benchmarks,
  onBack,
  onEditSchool,
  reloadDetail,
}) {
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [fieldNotice, setFieldNotice] = useState(null)
  const [submittingField, setSubmittingField] = useState(null)

  // Edition rapide d'un champ : soumise comme proposition de modification
  // (validation administrateur), jamais écrite directement sur la fiche.
  const submitFieldProposal = async (field, value) => {
    setSubmittingField(field)
    try {
      await authedRequest('post', `/my/establishments/${detail.uuid}/modification-proposals`, { [field]: value })
      setFieldNotice('Modification submitted for review.')
      reloadDetail()
    } catch (error) {
      setFieldNotice(
        error.response?.status === 409
          ? 'A modification is already pending for this school.'
          : 'Unable to submit — try again.',
      )
    } finally {
      setSubmittingField(null)
    }
  }
  const handleUploadMedia = async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      await authedRequest('post', `/my/establishments/${detail.uuid}/media`, form)
      reloadDetail()
    } catch {
      setFieldNotice('Upload failed (type or size).')
    }
  }
  const handleDeleteMedia = async (mediaId) => {
    try {
      await authedRequest('delete', `/my/establishments/${detail.uuid}/media/${mediaId}`)
      reloadDetail()
    } catch {
      setFieldNotice('Deletion failed.')
    }
  }
  // Photo du directeur : écriture directe sur la fiche (sans validation), à
  // l'image des médias de la galerie gérés par le responsable.
  const handleDirectorPhotoUpload = async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      await authedRequest('put', `/my/establishments/${detail.uuid}/director-photo`, form)
      setFieldNotice('Director photo updated.')
      reloadDetail()
    } catch {
      setFieldNotice('Photo upload failed (type or size).')
    }
  }

  if (detailStatus === 'loading' && !detail) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a90a0]">
        Loading your school…
      </div>
    )
  }
  if (detailStatus === 'error' || !detail) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Unable to load your school. Make sure the server is running, then refresh.
      </div>
    )
  }

  const cover = resolveMediaUrl(detail.media.find((media) => media.type === 'image')?.url)
  const isPublished = detail.status === 'published'
  const imageCount = detail.media.filter((media) => media.type === 'image').length
  const videos = detail.media.filter((media) => media.type === 'video')
  const bestPassRate = detail.exam_results.length
    ? Math.max(...detail.exam_results.map((result) => Number(result.pass_rate)))
    : null
  const minFee = detail.fees.length
    ? Math.min(...detail.fees.map((fee) => Number(fee.amount)))
    : null

  // Sections affichées uniquement si le type d'établissement les concerne.
  const showPrograms = typeSupportsPrograms(detail.type)
  const showExamResults = typeSupportsExamResults(detail.type)

  return (
    <div className="space-y-12">
      {/* En-tête immersive : couverture + nom calé au pied (style carte) */}
      <header className="relative">
        <section className="relative h-[260px] w-full overflow-hidden rounded-b-[28px] sm:h-[320px]">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0d7a4f,#0a3d2c)' }} />
          {cover && (
            <img
              src={cover}
              alt={detail.name}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-white via-white/75 to-transparent" />

          <button
            onClick={onBack}
            className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[13px] font-semibold text-[#0d7a4f] shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft size={15} /> Dashboard
          </button>

          <div className="absolute right-4 top-4 z-20 flex flex-wrap justify-end gap-2">
            <button
              onClick={() => onEditSchool(detail)}
              className="flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0d7a4f_0%,#12a066_50%,#0a5e3d_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(13,122,79,0.28)] transition-shadow hover:shadow-[0_8px_22px_rgba(13,122,79,0.34)]"
            >
              <Pencil size={15} /> Edit profile
            </button>
            <button
              onClick={() => navigateToSchool(detail.uuid)}
              disabled={!isPublished}
              title={isPublished ? 'Open the public page' : 'Visible after publication'}
              className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#081220] shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye size={15} /> Public page
            </button>
          </div>

          {/* Nom + méta calés au pied, sur le fondu blanc */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-1 pb-6 sm:px-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-2xl font-bold text-[#081220] sm:text-3xl">{detail.name}</h1>
                <StatusBadge status={detail.status} />
                {detail.has_pending_submission && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#f2c14e]/50 bg-[#fdf3dd] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8a5b00]">
                    <ListChecks size={11} /> Edits pending
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] text-[#3f4a52]">
                {detail.city}, {detail.region} · {detail.type} · {detail.sector} · {detail.linguistic_section}
              </p>
            </div>
          </div>
        </section>
      </header>

      {fieldNotice && (
        <div className="rounded-2xl border border-[#dcebe3] bg-[#f3faf6] px-5 py-3 text-[13px] font-medium text-[#0a5e3d]">
          {fieldNotice}
        </div>
      )}

      {/* Navigation interne rapide (ancres) — touche landing page */}
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {SECTION_NAV.filter((item) => item.id !== 'results' || showExamResults).map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 rounded-full border border-[#dcebe3] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#5b6670] transition-colors hover:border-[#0d7a4f] hover:text-[#0d7a4f]"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Faits rapides : bande continue, pas de carte */}
      <Section id="facts" eyebrow="At a glance" title="Quick facts">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          <FactTile icon={GraduationCap} label="Type" value={detail.type} />
          <FactTile icon={MapPin} label="Location" value={`${detail.city}, ${detail.region}`} />
          <FactTile icon={Layers} label="Sector" value={detail.sector} />
          <FactTile icon={Globe} label="Section" value={detail.linguistic_section} />
          <FactTile
            icon={Award}
            label="Fees"
            value={detail.fees.length ? `${detail.fees.length} level(s)` : 'Not set'}
          />
          <FactTile
            icon={ListChecks}
            label="Services"
            value={detail.services.length ? `${detail.services.length}` : 'None'}
          />
          <FactTile
            icon={FileText}
            label="Exam results"
            value={detail.exam_results.length ? `${detail.exam_results.length} · ${bestPassRate}%` : 'None'}
          />
          <FactTile icon={ImageIcon} label="Photos" value={imageCount ? `${imageCount}` : 'None'} />
          {detail.phone && <FactTile icon={Phone} label="Phone" value={detail.phone} />}
          {detail.contact_email && <FactTile icon={Mail} label="Email" value={detail.contact_email} />}
          {detail.website && <FactTile icon={Globe} label="Website" value={detail.website} />}
          {minFee !== null && (
            <FactTile icon={Award} label="From" value={`${minFee.toLocaleString()} FCFA`} />
          )}
        </div>
      </Section>

      {/* Description : présentation narrative de l'établissement, éditable
          en ligne (proposition de modification soumise à validation). */}
      <Section id="about" eyebrow="Overview" title="About this school">
        <div className="max-w-3xl divide-y divide-[#eef1f8] overflow-hidden rounded-2xl border border-[#eef1f8] bg-white">
          <InlineField
            label="Description"
            field="description"
            value={detail.description}
            multiline
            onSave={submitFieldProposal}
            submitting={submittingField === 'description'}
            locked={detail.has_pending_submission}
          />
        </div>
      </Section>

      {/* Responsable de l'établissement (directeur / proviseur) : présenté
          comme une courte bio éditable, distinct du compte du gestionnaire.
          La photo est gérée en direct (sans validation), le texte repasse
          par une proposition de modification. */}
      <Section id="leadership" eyebrow="Leadership" title="School leadership">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#eef1f8] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-4">
            {detail.director_photo_url ? (
              <img
                src={`${API_URL}${detail.director_photo_url}`}
                alt={detail.director_name || 'Director'}
                className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-[0_6px_18px_rgba(13,122,79,0.18)]"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#eef4f0] text-[#0d7a4f]">
                <GraduationCap size={30} />
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-[#cfe2d8] bg-[#f3faf6] px-3 py-2 text-[12px] font-semibold text-[#0d7a4f] hover:bg-[#e9f5ef]">
              <Upload size={14} />
              {detail.director_photo_url ? 'Change photo' : 'Add photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.[0]) handleDirectorPhotoUpload(event.target.files[0])
                  event.target.value = ''
                }}
              />
            </label>
          </div>
          <div>
            {(detail.director_name || detail.director_title || detail.director_bio) ? (
              <>
                {detail.director_name && (
                  <p className="text-lg font-semibold text-[#081220]">{detail.director_name}</p>
                )}
                {detail.director_title && (
                  <p className="text-sm text-[#5b6670]">{detail.director_title}</p>
                )}
                {detail.director_bio && (
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#343a44]">
                    {detail.director_bio}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-[#8a90a0]">
                No director details yet — add them via Edit profile.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Services et filières : pastilles cliquables / informatives */}
      <Section id="services" eyebrow="Offers" title="Services & programs">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8a90a0]">Services</p>
        {detail.services.length === 0 ? (
          <p className="text-[13px] text-[#8a90a0]">None added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {detail.services.map((service, serviceIndex) => (
              <span
                key={serviceIndex}
                title={service.description || ''}
                className="rounded-full border border-[#dcebe3] bg-white px-3 py-1 text-[12px] font-medium text-[#343a44]"
              >
                {service.name}
              </span>
            ))}
          </div>
        )}
        {showPrograms && (
          <>
            <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-[#8a90a0]">
              Programs
            </p>
            {detail.programs.length === 0 ? (
              <p className="text-[13px] text-[#8a90a0]">None added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detail.programs.map((program, programIndex) => (
                  <span
                    key={programIndex}
                    className="rounded-full bg-[#eef4f0] px-3 py-1 text-[12px] font-semibold text-[#0d7a4f]"
                  >
                    {program}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {/* Frais de scolarité : tableau réel par niveau + édition des seuls frais
          de l'année en cours, soumise comme proposition de modification. */}
      <Section id="fees" eyebrow="Fees" title="Classes & fees">
        <ManagerFeesSection
          fees={detail.fees}
          establishmentUuid={detail.uuid}
          hasPendingSubmission={detail.has_pending_submission}
          reloadDetail={reloadDetail}
        />
      </Section>

      {/* Résultats aux examens : magnifique graphique + état vide élégant */}
      {showExamResults && (
        <Section id="results" eyebrow="Performance" title="Exam results">
          {detail.exam_results.length === 0 ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-[#cdd8d2] bg-[#f4faf6] p-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0d7a4f]/10 text-[#0d7a4f]">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" strokeLinecap="round" />
                  <path d="M7 14l3-3 3 3 4-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[#081220]">No published results yet</p>
                <p className="mt-1 text-sm text-[#5b6670]">
                  This establishment has not shared national exam results yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <ExamResultsChart examResults={detail.exam_results} />
            </div>
          )}
        </Section>
      )}

      {/* Repères de marché : compare la fiche à la moyenne du même type */}
      <Section id="benchmarks" eyebrow="Context" title="Benchmarks">
        {!benchmarks ? (
          <p className="rounded-2xl bg-[#f6faf8] px-4 py-4 text-[13px] text-[#8a90a0]">
            Loading market benchmarks…
          </p>
        ) : (
          <div className="max-w-2xl space-y-4">
            <BenchmarkRow
              label="Minimum tuition"
              your={benchmarks.your_min_tuition}
              average={benchmarks.avg_min_tuition_same_type}
              format={(value) => `${Number(value).toLocaleString()} FCFA`}
            />
            {showExamResults && (
              <BenchmarkRow
                label="Best exam pass rate"
                your={benchmarks.your_best_pass_rate}
                average={benchmarks.avg_best_pass_rate_same_type}
                format={(value) => `${Number(value)}%`}
              />
            )}
            <p className="text-[11px] text-[#9a9a9a]">
              Compared with published schools of the same type ({benchmarks.same_type_sample_size}).
            </p>
          </div>
        )}
      </Section>

      {/* Localisation : adresse textuelle (la mini-carte a été retirée pour
          l'instant, voir perspectives) */}
      <Section id="location" eyebrow="Where to find us" title="Location">
        {detail.address && <p className="text-[13px] text-[#6e6e6e]">{detail.address}</p>}
        <p className="mt-2 text-[13px] text-[#6e6e6e]">{detail.city}, {detail.region}</p>
      </Section>

      {/* Galerie photo : gestion en ligne (ajout / suppression) */}
      <Section id="photos" eyebrow="Gallery" title="Photos">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {detail.media
            .filter((media) => media.type === 'image')
            .slice(0, 12)
            .map((media) => (
              <div
                key={media.id_media ?? media.url}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[#dcebe3] bg-[#eef4f0]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxUrl(media.url)}
                  title="View photo"
                  className="h-full w-full"
                >
                  <img
                    src={resolveMediaUrl(media.url)}
                    alt={media.caption || detail.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(media.id_media)}
                  title="Delete photo"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          {imageCount === 0 && (
            <p className="col-span-3 rounded-xl bg-[#f6faf8] px-4 py-4 text-[13px] text-[#8a90a0] sm:col-span-4 lg:col-span-6">
              No photos yet.
            </p>
          )}
          <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#cfe2d8] bg-[#f3faf6] text-[#0d7a4f] hover:bg-[#e9f5ef]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) handleUploadMedia(event.target.files[0])
                event.target.value = ''
              }}
            />
            <Upload size={18} />
          </label>
        </div>
        {videos.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {videos.map((media) => (
              <li
                key={media.id_media ?? media.url}
                className="flex items-center gap-2 rounded-xl border border-[#e3e9e6] bg-white px-3 py-2 text-[13px] text-[#334155]"
              >
                <Video size={15} className="text-[#0d7a4f]" />
                <span className="max-w-[200px] truncate">{media.caption || media.url.split('/').pop()}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(media.id_media)}
                  title="Delete video"
                  className="text-[#8a90a0] hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-[#cfe2d8] bg-[#f3faf6] px-3 py-2 text-[12px] font-semibold text-[#0d7a4f] hover:bg-[#e9f5ef]">
            <Video size={14} />
            Add video
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) handleUploadMedia(event.target.files[0])
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {isPublished && (
          <button
            onClick={() => navigateToSchool(detail.uuid)}
            className="mt-3 flex items-center gap-1 text-[13px] font-medium text-[#0d7a4f] hover:text-[#0a5e3d]"
          >
            View all on public page <Eye size={13} />
          </button>
        )}
      </Section>

      {/* Coordonnées : édition rapide en ligne (proposition de modification) */}
      <Section id="contact" eyebrow="Reach us" title="Contact">
        <div className="max-w-2xl divide-y divide-[#eef1f8] overflow-hidden rounded-2xl border border-[#eef1f8] bg-white">
          <InlineField
            label="Phone"
            field="phone"
            value={detail.phone}
            href={detail.phone ? `tel:${detail.phone}` : undefined}
            onSave={submitFieldProposal}
            submitting={submittingField === 'phone'}
            locked={detail.has_pending_submission}
          />
          <InlineField
            label="Email"
            field="contact_email"
            value={detail.contact_email}
            href={detail.contact_email ? `mailto:${detail.contact_email}` : undefined}
            onSave={submitFieldProposal}
            submitting={submittingField === 'contact_email'}
            locked={detail.has_pending_submission}
          />
          <InlineField
            label="Website"
            field="website"
            value={detail.website}
            href={
              detail.website
                ? detail.website.startsWith('http')
                  ? detail.website
                  : `https://${detail.website}`
                : undefined
            }
            onSave={submitFieldProposal}
            submitting={submittingField === 'website'}
            locked={detail.has_pending_submission}
          />
          <InlineField
            label="Address"
            field="address"
            value={detail.address}
            onSave={submitFieldProposal}
            submitting={submittingField === 'address'}
            locked={detail.has_pending_submission}
          />
        </div>
      </Section>

      {/* Lightbox plein écran de la galerie photos */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <img
            src={resolveMediaUrl(lightboxUrl)}
            alt=""
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
