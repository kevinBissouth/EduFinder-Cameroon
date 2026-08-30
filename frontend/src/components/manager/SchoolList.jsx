import { PencilLine, Loader2, Clock } from 'lucide-react'

import StatusBadge from './StatusBadge'
import { PALETTES } from '../../constants'

// Même identité de couleur que les cartes publiques : hachage stable de
// l'UUID -> palette dégradée, pour reconnaître une école au premier coup d'œil.
function paletteOf(uuidValue) {
  const hash = [...(uuidValue ?? '')].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )
  return PALETTES[hash % PALETTES.length]
}

function SchoolCard({ school, onOpenSchool, onProposeModification }) {
  const [colorFrom, colorTo] = paletteOf(school.establishment_uuid)

  return (
    <div
      onClick={() => onOpenSchool(school.establishment_uuid)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#dcebe3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Bandeau identitaire avec monogramme */}
      <div
        className="relative flex h-20 items-end p-4"
        style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
      >
        <span className="font-display text-3xl font-bold text-white/90">
          {school.name[0]}
        </span>
        <div className="absolute right-3 top-3">
          <StatusBadge status={school.establishment_status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-bold leading-snug text-[#081220]">
            {school.name}
          </h3>
          {school.has_pending_submission ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#fdf3dd] px-2.5 py-1 text-[11px] font-semibold text-[#8a5b00]">
              <Clock size={12} />
              A proposal is awaiting review
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">Up to date</p>
          )}
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation()
            onProposeModification(school)
          }}
          disabled={school.has_pending_submission}
          title={
            school.has_pending_submission
              ? 'Wait for the current review to finish'
              : `Propose changes for ${school.name}`
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0d7a4f]/30 px-4 py-2 text-sm font-semibold text-[#0d7a4f] transition-colors hover:bg-[#e5f3ec] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PencilLine size={15} />
          Propose modification
        </button>
      </div>
    </div>
  )
}

// Liste des fiches gérées par le responsable connecté.
export default function SchoolList({ establishments, loading, onOpenSchool, onProposeModification }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[#4b5566]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your schools…
      </div>
    )
  }

  if (establishments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#b9d8c9] bg-[#f7fbf9] p-8 text-center">
        <p className="font-display text-lg font-bold text-[#081220]">No school yet</p>
        <p className="mt-1 text-sm text-[#4b5566]">
          Propose your first school — an administrator will review it before it
          goes public.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {establishments.map((school) => (
        <SchoolCard
          key={school.establishment_uuid}
          school={school}
          onOpenSchool={onOpenSchool}
          onProposeModification={onProposeModification}
        />
      ))}
    </div>
  )
}
