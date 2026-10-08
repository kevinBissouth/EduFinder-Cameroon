import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import { TextAreaField, TextField } from '../ui/Field'
import ClampedText from '../workspace/ClampedText'

const DESCRIPTION_ROWS = 5

function InlineFieldEditor({ label, initialValue, isMultiline, isSubmitting, onSubmit, onCancel }) {
  const { t } = useTranslation('manager')
  const [valueDraft, setValueDraft] = useState(initialValue)
  const DraftField = isMultiline ? TextAreaField : TextField

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(valueDraft)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <DraftField
        label={label}
        autoFocus
        rows={isMultiline ? DESCRIPTION_ROWS : undefined}
        value={valueDraft}
        onChange={(event) => setValueDraft(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {t('actions.sendForReview')}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  )
}

// Champ de la fiche modifiable sur place. Enregistrer n'écrit pas la fiche :
// cela envoie une proposition que le super administrateur valide.
export function InlineField({ label, value, href, isMultiline = false, isSubmitting, onSubmit }) {
  const { t } = useTranslation('manager')
  const [isEditing, setIsEditing] = useState(false)
  const currentValue = value ?? ''

  async function submitValue(valueDraft) {
    if (valueDraft === currentValue) {
      setIsEditing(false)
      return
    }
    const isSent = await onSubmit(valueDraft)
    if (isSent) setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="py-4 first:pt-0 last:pb-0">
        <InlineFieldEditor
          label={label}
          initialValue={currentValue}
          isMultiline={isMultiline}
          isSubmitting={isSubmitting}
          onSubmit={submitValue}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-soft">{label}</p>
        <InlineFieldValue
          label={label}
          value={currentValue}
          href={href}
          isMultiline={isMultiline}
        />
      </div>
      <button
        type="button"
        aria-label={t('detail.editField', { field: label.toLowerCase() })}
        onClick={() => setIsEditing(true)}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-navy transition-colors hover:border-primary hover:text-primary-deep"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function InlineFieldValue({ label, value, href, isMultiline }) {
  const { t } = useTranslation('manager')
  if (!value) return <p className="mt-1 text-sm text-ink-soft">{t('detail.notProvided')}</p>
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex min-h-11 items-center break-all text-base text-primary-deep hover:underline"
      >
        {value}
      </a>
    )
  }
  // Un texte long (la description) se replie.
  if (isMultiline) {
    return <ClampedText text={value} title={label} className="mt-1 text-base text-navy" />
  }
  return <p className="mt-1 text-base text-navy text-pretty">{value}</p>
}
