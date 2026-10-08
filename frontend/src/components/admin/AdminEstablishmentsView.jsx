import { useState } from 'react'
import { MapPin, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import Button from '../ui/Button'
import Modal from '../workspace/Modal'
import PagedCards from '../workspace/PagedCards'
import SchoolCover from '../workspace/SchoolCover'
import ViewHero from '../workspace/ViewHero'
import StatusBadge from '../workspace/StatusBadge'
import EstablishmentStatusActions from './EstablishmentStatusActions'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

function describeManagers(owners) {
  if (owners.length === 0) return i18next.t('admin:schools.noManager')
  return owners.join(', ')
}

function EstablishmentCard({ establishment, onOpen }) {
  const { t } = useTranslation('admin')
  const translateReference = useReferenceLabel()
  const tags = [
    translateReference('types', establishment.type),
    translateReference('sectors', establishment.sector),
  ].filter(Boolean)

  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft transition-shadow hover:shadow-raised">
      <SchoolCover
        name={establishment.name}
        coverUrl={establishment.cover_url}
        status={establishment.establishment_status}
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-navy">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {establishment.city}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary-deep"
            >
              {tag}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-1.5 text-sm text-ink">
          <UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="line-clamp-2">{describeManagers(establishment.owners)}</span>
        </p>
        <div className="mt-auto pt-5">
          <Button
            variant="secondary"
            className="w-full"
            aria-label={t('manager:schools.openNamed', { name: establishment.name })}
            onClick={() => onOpen(establishment)}
          >
            {t('manager:actions.open')}
          </Button>
        </div>
      </div>
    </li>
  )
}

function countByStatus(establishments, establishmentStatus) {
  return establishments.filter(
    (establishment) => establishment.establishment_status === establishmentStatus,
  ).length
}

// Chaque pastille accorde son libellé avec son propre nombre.
function buildStatusFigure(establishments, establishmentStatus, labelKey) {
  const count = countByStatus(establishments, establishmentStatus)
  return { value: count, label: i18next.t(labelKey, { count }) }
}

function EstablishmentModal({ establishment, onClose, onStatusChanged }) {
  const { t } = useTranslation('admin')
  const translateReference = useReferenceLabel()
  const facts = [
    { label: t('schools.city'), value: establishment.city },
    { label: t('schools.schoolType'), value: translateReference('types', establishment.type) },
    { label: t('schools.sector'), value: translateReference('sectors', establishment.sector) },
    { label: t('schools.managers'), value: describeManagers(establishment.owners) },
    { label: t('schools.suspensionReason'), value: establishment.suspension_reason },
  ].filter((fact) => fact.value)

  return (
    <Modal
      title={establishment.name}
      headerExtra={
        <p className="mt-2">
          <StatusBadge status={establishment.establishment_status} />
        </p>
      }
      onClose={onClose}
    >
      <dl className="space-y-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm font-semibold text-ink-soft">{fact.label}</dt>
            <dd className="mt-1 break-words text-sm text-navy">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <EstablishmentStatusActions
          establishment={establishment}
          onStatusChanged={onStatusChanged}
        />
      </div>
    </Modal>
  )
}

// Tous les établissements de la plateforme, quel que soit leur état.
function AdminEstablishmentsView({ establishments, onStatusChanged }) {
  const { t } = useTranslation('admin')
  const [openedEstablishment, setOpenedEstablishment] = useState(null)

  // La fenêtre montre l'ancien état : je la ferme avant de recharger la
  // liste, pour ne jamais laisser un état périmé à l'écran.
  async function closeThenReload() {
    setOpenedEstablishment(null)
    await onStatusChanged()
  }

  return (
    <>
      <ViewHero
        title={t('schools.title')}
        description={t('schools.description')}
        figures={[
          buildStatusFigure(establishments, 'published', 'admin:schools.published'),
          buildStatusFigure(establishments, 'pending', 'admin:schools.awaiting'),
          buildStatusFigure(establishments, 'suspended', 'admin:schools.suspended'),
        ]}
      />
      {establishments.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t('dashboard.noSchool')}
        </p>
      ) : (
        <PagedCards
          items={establishments}
          renderCard={(establishment) => (
            <EstablishmentCard
              key={establishment.establishment_uuid}
              establishment={establishment}
              onOpen={setOpenedEstablishment}
            />
          )}
        />
      )}
      {openedEstablishment && (
        <EstablishmentModal
          establishment={openedEstablishment}
          onClose={() => setOpenedEstablishment(null)}
          onStatusChanged={closeThenReload}
        />
      )}
    </>
  )
}

export default AdminEstablishmentsView
