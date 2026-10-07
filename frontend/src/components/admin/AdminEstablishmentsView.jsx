import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, MapPin, UserRound, GraduationCap, Compass } from 'lucide-react'

import { AdminGlassCard, AdminStatusBadge } from './AdminShared'
import EstablishmentStatusActions from './EstablishmentStatusActions'

// Vue super admin de tous les établissements sous forme de cartes : chaque
// carte résume l'établissement (nom, ville, statut) et s'ouvre au clic sur une
// fenêtre qui détaille tout (type, secteur, manager(s)). Un établissement
// peut être géré par plusieurs comptes.
const firstLetterOf = (name) => (name || '?').trim().charAt(0).toUpperCase()

function FieldRow({ icon: Icon, label, value, capitalize = false }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#34d399]">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
        <p className={`break-words font-medium text-white/85 ${capitalize ? 'capitalize' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

// Fenêtre de détail d'un établissement : le clic sur une carte l'ouvre, on y
// voit tout l'établissement et ses responsables dans une modale défilable.
function EstablishmentDetailModal({ item, onClose, onStatusChanged }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-lg overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1a14] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#059669,#0d7a4f)] font-display text-[18px] font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.35)]">
              {firstLetterOf(item.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-bold text-[#f5f5f4]">{item.name}</h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/50">
                <MapPin size={12} /> {item.city}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={item.establishment_status} />
          </div>

          <FieldRow icon={GraduationCap} label="Type" value={item.type} capitalize />
          <FieldRow icon={Compass} label="Sector" value={item.sector} capitalize />
          <FieldRow icon={MapPin} label="City" value={item.city} capitalize />

          <div className="border-t border-white/10 pt-4">
            <FieldRow
              icon={UserRound}
              label="Manager(s)"
              value={item.owners.length > 0 ? item.owners.join(', ') : '—'}
            />
          </div>

          <EstablishmentStatusActions item={item} onStatusChanged={onStatusChanged} />
        </div>
      </div>
    </div>
  )
}

export default function AdminEstablishmentsView({ establishments, onStatusChanged }) {
  const [selectedItem, setSelectedItem] = useState(null)

  // La fenêtre affiche l'ancien statut : je la ferme avant de recharger la
  // liste, pour ne jamais laisser à l'écran un état périmé.
  async function handleStatusChanged() {
    setSelectedItem(null)
    await onStatusChanged()
  }

  return (
    <AdminGlassCard className="p-6">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-[18px] font-semibold text-[#f5f5f4]">
          <Building2 size={18} className="text-[#34d399]" /> Establishments
        </h3>
        <p className="mt-1 text-[13px] text-white/40">
          All schools on the platform, with their manager(s).
        </p>
      </div>

      {establishments.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">No establishments found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {establishments.map((item) => (
            <button
              key={item.establishment_uuid}
              type="button"
              onClick={() => setSelectedItem(item)}
              className="flex cursor-pointer flex-col rounded-[18px] border border-white/10 bg-white/5 p-5 text-left backdrop-blur-[10px] transition-all duration-300 hover:border-white/15 hover:bg-white/8 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3),0_0_40px_rgba(52,211,153,0.08)]"
            >
              <div className="flex w-full items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#059669,#0d7a4f)] font-display text-[18px] font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.35)]">
                  {firstLetterOf(item.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[#f5f5f4]">{item.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-white/45">
                    <MapPin size={12} className="shrink-0" /> {item.city}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <AdminStatusBadge status={item.establishment_status} />
              </div>

              <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">Type</span>
                  <span className="truncate text-[13px] capitalize text-white/80">{item.type}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-[11px] uppercase tracking-wider text-white/40">
                    Sector
                  </span>
                  <span className="truncate text-[13px] capitalize text-white/80">
                    {item.sector}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3.5">
                <span className="text-[11px] uppercase tracking-wider text-white/40">
                  Manager(s)
                </span>
                {item.owners.length > 0 ? (
                  <span className="truncate text-[13px] font-medium text-[#d4a574]">
                    {item.owners.length} {item.owners.length === 1 ? 'person' : 'people'}
                  </span>
                ) : (
                  <span className="text-[13px] text-white/40">—</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedItem &&
        createPortal(
          <EstablishmentDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onStatusChanged={handleStatusChanged}
          />,
          document.body,
        )}
    </AdminGlassCard>
  )
}
