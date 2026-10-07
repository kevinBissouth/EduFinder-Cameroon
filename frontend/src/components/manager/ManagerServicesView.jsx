import { useState } from 'react'
import { Pencil, Plus, Sparkles } from 'lucide-react'

import Button from '../ui/Button'
import { TextField } from '../ui/Field'
import PagedCards from '../workspace/PagedCards'
import ViewHero from '../workspace/ViewHero'
import SchoolSection from './SchoolSection'
import { useModificationProposal } from '../../hooks/useModificationProposal'

const SERVICE_NAME_MAX_LENGTH = 100

function isSameName(firstName, secondName) {
  return firstName.trim().toLowerCase() === secondName.trim().toLowerCase()
}

function ServiceNameForm({ label, initialName, submitLabel, isSubmitting, onSubmit, onCancel }) {
  const [nameDraft, setNameDraft] = useState(initialName)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const isSent = await onSubmit(nameDraft.trim())
    if (isSent) setNameDraft('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <TextField
        label={label}
        maxLength={SERVICE_NAME_MAX_LENGTH}
        value={nameDraft}
        onChange={(event) => setNameDraft(event.target.value)}
        className="sm:max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

// Carte d'un service : un pictogramme en dégradé, le nom en grand, et le
// renommage qui se fait dans la carte.
function ServiceCard({ serviceName, isRenaming, isSubmitting, onStartRenaming, onRename, onCancel }) {
  return (
    <li className="flex h-full flex-col rounded-panel border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-primary-deep to-violet-deep text-white">
          <Sparkles aria-hidden="true" className="size-6" />
        </span>
        <h3 className="min-w-0 font-display text-2xl leading-display text-navy text-balance">
          {serviceName}
        </h3>
      </div>
      {isRenaming ? (
        <div className="mt-5">
          <ServiceNameForm
            label={`New name for ${serviceName}`}
            initialName={serviceName}
            submitLabel="Send for review"
            isSubmitting={isSubmitting}
            onSubmit={onRename}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className="mt-auto pt-5">
          <Button variant="secondary" aria-label={`Rename ${serviceName}`} onClick={onStartRenaming}>
            <Pencil aria-hidden="true" className="size-4" />
            Rename
          </Button>
        </div>
      )}
    </li>
  )
}

function ServicesContent({ detail, onProposalSubmitted }) {
  const [renamedServiceName, setRenamedServiceName] = useState(null)
  const proposal = useModificationProposal(detail.uuid, onProposalSubmitted)
  const serviceNames = detail.services.map((service) => service.name)

  // L'API remplace toute la liste des services à l'approbation : j'envoie
  // donc toujours la liste complète, jamais le seul service ajouté ou renommé.
  async function submitServiceNames(proposedNames, changedName) {
    if (!changedName) {
      proposal.showError('Enter a service name.')
      return false
    }
    const isAlreadyListed = serviceNames.some((serviceName) => isSameName(serviceName, changedName))
    if (isAlreadyListed) {
      proposal.showError(`“${changedName}” is already in the list.`)
      return false
    }
    return proposal.submitProposal({ services: proposedNames })
  }

  const addService = (newName) => submitServiceNames([...serviceNames, newName], newName)

  async function renameService(previousName, newName) {
    const proposedNames = serviceNames.map((serviceName) =>
      serviceName === previousName ? newName : serviceName,
    )
    const isSent = await submitServiceNames(proposedNames, newName)
    if (isSent) setRenamedServiceName(null)
    return isSent
  }

  return (
    <>
      <ViewHero
        title="Services"
        description={`What ${detail.name} offers beyond teaching. Each change is reviewed before it goes public.`}
        figures={[
          {
            value: serviceNames.length,
            label: serviceNames.length === 1 ? 'service listed' : 'services listed',
          },
        ]}
      />
      <section className="mb-6 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-6">
        <ServiceNameForm
          label="Add a service"
          initialName=""
          submitLabel={
            <>
              <Plus aria-hidden="true" className="size-4" />
              Send for review
            </>
          }
          isSubmitting={proposal.isSubmitting}
          onSubmit={addService}
        />
      </section>
      {serviceNames.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
          No service is listed yet.
        </p>
      ) : (
        <PagedCards
          items={serviceNames}
          renderCard={(serviceName) => (
            <ServiceCard
              key={serviceName}
              serviceName={serviceName}
              isRenaming={renamedServiceName === serviceName}
              isSubmitting={proposal.isSubmitting}
              onStartRenaming={() => setRenamedServiceName(serviceName)}
              onRename={(newName) => renameService(serviceName, newName)}
              onCancel={() => setRenamedServiceName(null)}
            />
          )}
        />
      )}
    </>
  )
}

function ManagerServicesView({ onProposalSubmitted, ...sectionProps }) {
  return (
    <SchoolSection {...sectionProps}>
      {(detail) => (
        <ServicesContent
          key={detail.uuid}
          detail={detail}
          onProposalSubmitted={onProposalSubmitted}
        />
      )}
    </SchoolSection>
  )
}

export default ManagerServicesView
