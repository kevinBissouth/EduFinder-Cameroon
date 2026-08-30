import { useEffect } from 'react'
import {
  X,
  FileText,
  Phone,
  Mail,
  Globe,
  MapPin,
  UserRound,
  WalletCards,
  GraduationCap,
  MessageSquareText,
} from 'lucide-react'

import StatusBadge from './StatusBadge'

// Formate un montant en FCFA lisible ("156000.00" -> "156 000 FCFA").
function formatAmount(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${number.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
}

// Libellé de niveau : la correspondance id -> nom vient de /filters-meta ; si
// un id inconnu apparaît, on garde une mention neutre plutôt qu'un ID brut.
function levelLabel(idLevel, levelNames) {
  return levelNames.get(idLevel) ?? 'Unknown level'
}

// Champs connus affichés avec leur libellé dédié ; les clés restantes tombent
// dans le rendu générique pour ne jamais perdre une information soumise.
const FIELD_LABELS = {
  name: { label: 'Establishment name', icon: GraduationCap },
  phone: { label: 'Phone', icon: Phone },
  contact_email: { label: 'Email', icon: Mail },
  website: { label: 'Website', icon: Globe },
  address: { label: 'Address', icon: MapPin },
  director_name: { label: 'Director', icon: UserRound },
  director_title: { label: 'Director title', icon: UserRound },
  director_bio: { label: 'Director bio', icon: UserRound },
  description: { label: 'Description', icon: FileText },
  note: { label: 'Note', icon: MessageSquareText },
}

// Formate la valeur correspondant à un champ connu du contenu. Les listes
// d'identifiants (programmes) sont converties en noms via la référence passée.
function formatKnownValue(key, value, programNames) {
  if (key === 'name') return value
  if (key === 'phone' || key === 'contact_email' || key === 'website') return value
  if (Array.isArray(value)) {
    if (key === 'services') return { boxed: value }
    if (key === 'program_ids') {
      return { boxed: value.map((id) => programNames.get(id) ?? `Program ${id}`) }
    }
    return value.join(', ')
  }
  return value
}

function ContentField({ fieldKey, item, label, icon: Icon, programNames }) {
  const formatted = formatKnownValue(fieldKey, item, programNames)

  if (formatted && formatted.boxed) {
    return (
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">
          <Icon size={12} /> {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {formatted.boxed.map((entry, index) => (
            <span
              key={index}
              className="rounded-lg bg-[#eef4f0] px-2.5 py-1 text-[12px] font-medium text-[#0a5e3d]"
            >
              {entry}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">
        <Icon size={12} /> {label}
      </p>
      <p className="text-[13px] font-medium text-[#081220]">{formatted}</p>
    </div>
  )
}

function FeesList({ fees, levelNames }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">
        <WalletCards size={12} /> Fees
      </p>
      <div className="overflow-hidden rounded-xl border border-[#e7ece9]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0a3d2c] text-white">
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Level</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider">School year</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f1]">
            {fees.map((fee, index) => (
              <tr key={index}>
                <td className="px-3 py-2 text-[12px] font-medium text-[#081220]">
                  {levelLabel(fee.id_level, levelNames)}
                </td>
                <td className="px-3 py-2 text-[12px] text-[#5b6670]">{fee.school_year}</td>
                <td className="px-3 py-2 text-right text-[12px] font-semibold text-[#0d7a4f]">
                  {formatAmount(fee.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Fenêtre modale détaillant une soumission : elle montre au responsable le
// contenu exact de ce qu'il a proposé (champs modifiés, frais, services…).
export default function SubmissionDetailModal({ submission, levelNames, programNames, onClose }) {
  // Blocage du défilement de la page tant que la modale est ouverte.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const content = submission.content ?? {}
  // Le nom de l'établissement est déjà porté par le titre de la modale :
  // je ne le répète pas parmi les champs, on ne garde que ce qui a changé.
  const fields = Object.entries(content).filter(
    ([key, value]) =>
      key !== 'name' && key !== 'fees' && value != null && value !== '',
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#06221b]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e7ece9] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-bold text-[#081220]">
              {submission.establishment_name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] capitalize text-[#8a90a0]">{submission.submission_type}</span>
              <StatusBadge status={submission.submission_status} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8a90a0] transition-colors hover:bg-[#f0f4f1] hover:text-[#081220]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(85vh-140px)] space-y-5 overflow-y-auto px-5 py-5">
          {submission.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
              Rejected: {submission.rejection_reason}
            </div>
          )}

          {fields.length === 0 && content.fees?.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8a90a0]">No change details recorded.</p>
          ) : (
            <>
              {fields.map(([key, value]) => {
                const config = FIELD_LABELS[key] ?? {
                  label: key.replace(/_/g, ' '),
                  icon: FileText,
                }
                return (
                  <ContentField
                    key={config.label}
                    fieldKey={key}
                    item={value}
                    label={config.label}
                    icon={config.icon}
                    programNames={programNames}
                  />
                )
              })}
              {content.fees?.length > 0 && <FeesList fees={content.fees} levelNames={levelNames} />}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#e7ece9] px-5 py-3">
          <p className="text-[11px] text-[#8a90a0]">
            Submitted{' '}
            {new Date(submission.submitted_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-[linear-gradient(135deg,#0d7a4f,#0a5e3d)] px-4 py-2 text-[12px] font-bold text-white shadow-[0_6px_18px_rgba(13,122,79,0.25)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
