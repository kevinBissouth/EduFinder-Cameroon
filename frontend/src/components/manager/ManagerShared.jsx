import { useState } from 'react'
import { Lock, Pencil } from 'lucide-react'

// Champ éditable en ligne : la sauvegarde déclenche une proposition de
// modification (validation administrateur), pas une écriture directe. En mode
// multiligne, l'affichage conserve les retours à la ligne (ex. description).
// Quand `locked` est vrai (une soumission est déjà en attente), le crayon est
// remplacé par un cadenas : le backend refuse toute nouvelle proposition.
export function InlineField({ label, value, field, href, multiline, onSave, submitting, locked }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const start = () => {
    setDraft(value || '')
    setEditing(true)
  }
  const save = () => {
    setEditing(false)
    if (draft !== (value || '')) onSave(field, draft)
  }
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8a90a0]">{label}</span>
        {!editing && !locked && (
          <button
            type="button"
            onClick={start}
            title="Edit"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[#0d7a4f] transition-colors hover:bg-[#e9f5ef] hover:text-[#0a5e3d]"
          >
            <Pencil size={13} />
          </button>
        )}
        {!editing && locked && (
          <Lock size={13} className="text-[#c08a24]" aria-label="Locked while a proposal is pending" />
        )}
      </div>
      {editing ? (
        <div className="mt-1">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#dcebe3] bg-white px-3 py-2 text-[13px] text-[#081220] shadow-sm transition-shadow focus:border-[#0d7a4f] focus:outline-none focus:ring-2 focus:ring-[#0d7a4f]/20"
            />
          ) : (
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full rounded-xl border border-[#dcebe3] bg-white px-3 py-2 text-[13px] text-[#081220] shadow-sm transition-shadow focus:border-[#0d7a4f] focus:outline-none focus:ring-2 focus:ring-[#0d7a4f]/20"
            />
          )}
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={submitting}
              className="rounded-lg bg-[#0d7a4f] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0a5e3d] disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-[#dcebe3] px-3 py-1.5 text-[12px] font-semibold text-[#343a44] transition-colors hover:bg-[#f3f5f7]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`mt-1 text-[13px] text-[#343a44] ${multiline ? 'whitespace-pre-line' : ''}`}>
          {value ? (
            href ? (
              <a href={href} className="break-all transition-colors hover:text-[#0d7a4f]" target="_blank" rel="noreferrer">
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="inline-flex items-center rounded-md bg-[#f7f9fb] px-2 py-0.5 text-[12px] text-[#8a90a0]">
              Not set
            </span>
          )}
        </p>
      )}
    </div>
  )
}

// Une ligne de repère de marché : valeur de la fiche vs moyenne du même type.
export function BenchmarkRow({ label, your, average, format }) {
  const yourNum = your == null ? null : Number(your)
  const avgNum = average == null ? null : Number(average)
  let comparison = null
  if (yourNum != null && avgNum != null && avgNum !== 0) {
    const diff = Math.round(((yourNum - avgNum) / avgNum) * 100)
    comparison = `${Math.abs(diff)}% ${diff > 0 ? 'above' : diff < 0 ? 'below' : 'at'} average`
  }
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-[#081220]">{label}</span>
        {comparison && (
          <span
            className={`text-[11px] font-semibold ${
              comparison.includes('above')
                ? 'text-[#0a5e3d]'
                : comparison.includes('below')
                  ? 'text-[#8a5b00]'
                  : 'text-[#6e6e6e]'
            }`}
          >
            {comparison}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3 text-[13px]">
        <span className="font-semibold text-[#081220]">
          {yourNum == null ? '—' : format(yourNum)}
        </span>
        <span className="text-[#8a90a0]">vs avg {avgNum == null ? '—' : format(avgNum)}</span>
      </div>
    </div>
  )
}

// Petite tuile de faits rapides (identité, tarifs, services, résultats…).
export function FactTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#dcebe3] bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-[#0d7a4f]">
        <Icon size={16} />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8a90a0]">
          {label}
        </span>
      </div>
      <p className="truncate text-[15px] font-semibold text-[#081220]">{value}</p>
    </div>
  )
}
