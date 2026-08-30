import { useState } from "react"
import { Building2, Check, Lock, Pencil, X } from "lucide-react"

import { authedRequest } from '../../utils/auth'

// Vue « Services » du responsable : autonome, sans redirection. Le
// sélecteur d'établissement (chips) filtre le contenu sur place quand le
// responsable gère plusieurs écoles.
export default function ManagerServicesView({
  establishments,
  selectedUuid,
  onSelectSchool,
  detail,
  detailStatus,
  reloadDetail,
}) {
  const [editingService, setEditingService] = useState(null) // clé "name" en édition
  const [draftServiceName, setDraftServiceName] = useState('')
  const [notice, setNotice] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (establishments.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e7ece9] bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4f0] text-[#0d7a4f]">
          <Building2 size={26} />
        </span>
        <p className="mt-4 font-display text-xl font-bold text-[#081220]">No school yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#5b6670]">
          Propose your first establishment — once approved, you can manage its services here.
        </p>
      </div>
    )
  }

  if (detailStatus === 'loading' && !detail) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a90a0]">
        Loading services…
      </div>
    )
  }
  if (detailStatus === 'error' || !detail) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Unable to load your services. Make sure the server is running, then refresh.
      </div>
    )
  }

  const services = detail.services || []
  const totalServices = services.length
  const hasPendingSubmission = detail.has_pending_submission

  // --- État d'édition ---
  const startEditing = (name) => {
    if (hasPendingSubmission) return
    setEditingService(name)
    setDraftServiceName(name)
  }

  const cancelEditing = () => {
    setEditingService(null)
    setDraftServiceName('')
    setNotice(null)
    setSubmitError(null)
  }

  const submitProposal = async () => {
    const name = draftServiceName.trim()
    if (!name) {
      setSubmitError('Enter a service name.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await authedRequest('post', `/my/establishments/${detail.uuid}/modification-proposals`, {
        services: [name],
      })
      setNotice('Service submitted for review.')
      setEditingService(null)
      setDraftServiceName('')
      reloadDetail()
    } catch (error) {
      if (error.response?.status === 409) {
        setSubmitError('A modification is already pending for this school.')
      } else {
        setSubmitError('Unable to submit — check the service name and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (services.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f6faf8] px-4 py-4 text-[13px] text-[#8a90a0]">
        No services set yet — add them so families can compare.
      </p>
    )
  }

  return (
    <div>
      {/* Bloc titre + sélecteur d'établissement inline */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-tight text-[#081220]">
            Services
          </h2>
          <p className="mt-1 text-[13px] text-[#5b6670]">
            Services offered by your establishments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {establishments.length > 1 && (
            <>
              {establishments.map((school) => {
                const isActive = school.establishment_uuid === selectedUuid
                return (
                  <button
                    key={school.establishment_uuid}
                    onClick={() => onSelectSchool(school.establishment_uuid)}
                    className={
                      isActive
                        ? 'inline-flex items-center gap-1.5 rounded-full bg-[#0d7a4f] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(13,122,79,0.25)]'
                        : 'inline-flex items-center gap-1.5 rounded-full border border-[#dcebe3] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#343a44] transition-colors hover:border-[#0d7a4f] hover:text-[#0d7a4f]'
                    }
                  >
                    <Building2 size={13} />
                    <span className="truncate">{school.name}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout de service */}
      <section className="mt-4">
        {hasPendingSubmission && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf3dd] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8a5b00]">
            <Lock size={11} /> Locked while a proposal is pending
          </span>
        )}
        {totalServices === 0 ? (
          <p className="mt-2 text-[11px] text-[#8a90a0]">
            No service defined yet — add one below to get started.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-[#8a90a0]">
            Current services: {totalServices}
          </p>
        )}
{/* Quatre cartes de synthèse du dashboard — intégrées par le parent
          (ManagerHomePage) pour rester identiques au dashboard. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Service name"
            value={draftServiceName}
            onChange={(e) => setDraftServiceName(e.target.value)}
            maxLength={100}
            className="rounded-lg border border-[#d9a406] bg-white px-3 py-2 font-medium text-[#0a5e3d] shadow-sm outline-none transition-colors focus:border-[#f2c14e]"
            disabled={submitting || hasPendingSubmission}
          />
          <button
            onClick={() => submitProposal()}
            disabled={submitting || hasPendingSubmission}
            title="Submit proposal"
            className="flex h-7 w-9 items-center justify-center rounded-lg bg-[#0d7a4f] text-white transition-colors hover:bg-[#0a5e3d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={15} strokeWidth={2.4} />
          </button>
        </div>
      </section>

      {/* Tableau des services (dominant) */}
      <section className="mt-[18px] overflow-auto rounded-[18px] border border-[#e7ece9] bg-white p-4 ">
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[#dcebe3]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#f3faf6] text-[11px] uppercase tracking-wide text-[#8a90a0]">
                <th className="px-3 py-2 font-semibold">Service</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dcebe3]">
              {services.map((service) => {
                const isEditing = editingService === service.name
                return (
                  <tr
                    key={service.name}
                    className={isEditing ? 'bg-[#fafffd]' : undefined}
                  >
                    <td className="px-3 py-2 font-medium text-[#081220]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draftServiceName}
                          onChange={(e) => setDraftServiceName(e.target.value)}
                          className="rounded-lg border border-[#d9a406] bg-white px-2 py-1.5 font-medium text-[#0a5e3d] shadow-sm outline-none transition-colors focus:border-[#f2c14e]"
                        />
                      ) : (
                        <span className="font-semibold text-[#0a5e3d]">{service.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => submitProposal()}
                            disabled={submitting}
                            title="Submit proposal"
                            className="flex h-7 w-9 items-center justify-center rounded-lg bg-[#0d7a4f] text-white transition-colors hover:bg-[#0a5e3d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Check size={15} strokeWidth={2.4} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={submitting}
                            title="Cancel"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dcebe3] bg-white text-[#5b6670] transition-colors hover:bg-[#f6faf8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(service.name)}
                          title="Edit this service"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5b6670] transition-colors hover:bg-[#e5f3ec] hover:text-[#0d7a4f]"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!submitting && editingService === null && (
          <p className="mt-2.5 text-[11px] text-[#8a90a0]">
            Click the pencil next to a service to change its name — a
            super admin must approve the change before it goes live.
          </p>
        )}
        {editingService !== null && !submitting && (
          <p className="mt-2.5 text-[11px] text-[#8a90a0]">
            Submitting creates a review proposal for this service only.
          </p>
        )}
      </section>

      {/* Zone de notice / erreur */}
      {notice && (
        <div className="mt-3 rounded-xl border border-[#dcebe3] bg-[#f3faf6] px-4 py-2.5 text-[13px] font-medium text-[#0a5e3d]">
          {notice}
        </div>
      )}
      {submitError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          {submitError}
        </div>
      )}
    </div>
  )
}