import { SelectField, TextAreaField, TextField } from '../../ui/Field'
import Notice from '../../workspace/Notice'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toChipOptions, toggleValue } from '../../workspace/toggleChips'
import { PhotoUpload, VideoUploads } from './FileUploads'
import { ExamResultRowsEditor, FeeRowsEditor } from './RowEditors'

const BIOGRAPHY_ROWS = 4
const DESCRIPTION_ROWS = 5
const SELECT_PLACEHOLDER = 'Choose…'

function UploadStatus({ upload }) {
  return (
    <>
      {upload.uploadError && <Notice tone="danger">{upload.uploadError}</Notice>}
      {upload.isUploading && (
        <p role="status" className="text-sm text-ink-soft">
          Uploading the file…
        </p>
      )}
    </>
  )
}

export function GeneralStep({ form }) {
  const { fields } = form.draft
  const requiredSuffix = form.isCreation ? ' (required)' : ''

  return (
    <>
      <TextField
        label={`School name${requiredSuffix}`}
        placeholder="Bilingual Academy of Douala"
        value={fields.name}
        onChange={(event) => form.setField('name', event.target.value)}
      />
      <TextField
        label="Phone"
        type="tel"
        placeholder="+237 6XX XX XX XX"
        value={fields.phone}
        onChange={(event) => form.setField('phone', event.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        value={fields.contact_email}
        onChange={(event) => form.setField('contact_email', event.target.value)}
      />
      <TextField
        label="Website"
        value={fields.website}
        onChange={(event) => form.setField('website', event.target.value)}
      />
      <TextAreaField
        label="Description"
        rows={DESCRIPTION_ROWS}
        value={fields.description}
        onChange={(event) => form.setField('description', event.target.value)}
      />
    </>
  )
}

export function ClassificationStep({ form }) {
  const { fields } = form.draft
  const requiredSuffix = form.isCreation ? ' (required)' : ''
  const referenceSelects = [
    { fieldName: 'id_city', label: 'City', options: form.meta.cities },
    { fieldName: 'id_type', label: 'School type', options: form.meta.types },
    { fieldName: 'id_sector', label: 'Sector', options: form.meta.sectors },
    { fieldName: 'id_linguistic_section', label: 'Language section', options: form.meta.languages },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {referenceSelects.map((referenceSelect) => (
          <SelectField
            key={referenceSelect.fieldName}
            label={`${referenceSelect.label}${requiredSuffix}`}
            placeholder={SELECT_PLACEHOLDER}
            options={referenceSelect.options ?? []}
            value={fields[referenceSelect.fieldName]}
            onChange={(event) => form.setField(referenceSelect.fieldName, event.target.value)}
          />
        ))}
      </div>
      <TextField
        label="Address"
        placeholder="Bonanjo, P.O. Box 12345 Douala"
        value={fields.address}
        onChange={(event) => form.setField('address', event.target.value)}
      />
    </>
  )
}

export function ProgrammesStep({ form }) {
  const programOptions = (form.meta.programs ?? []).map((program) => ({
    value: program.id,
    label: program.name,
  }))
  if (programOptions.length === 0) {
    return <p className="text-sm text-ink-soft">No programme can be selected yet.</p>
  }

  return (
    <ToggleChipGroup
      label="Programmes"
      options={programOptions}
      selectedValues={form.draft.programIds}
      onToggle={(programId) =>
        form.setList('programIds', 'program_ids', toggleValue(form.draft.programIds, programId))
      }
    />
  )
}

export function FeesStep({ form }) {
  return (
    <FeeRowsEditor
      feeRows={form.draft.feeRows}
      levels={form.meta.levels ?? []}
      paymentMethods={form.meta.payment_methods ?? []}
      onChange={(feeRows) => form.setList('feeRows', 'fees', feeRows)}
    />
  )
}

export function ServicesStep({ form }) {
  const { serviceNames } = form.draft
  // Un service déjà sur la fiche mais absent de la liste de référence reste proposé.
  const availableNames = [...new Set([...(form.meta.services ?? []), ...serviceNames])].sort()
  if (availableNames.length === 0) {
    return <p className="text-sm text-ink-soft">No service can be selected yet.</p>
  }

  return (
    <ToggleChipGroup
      label="Services"
      options={toChipOptions(availableNames)}
      selectedValues={serviceNames}
      onToggle={(serviceName) =>
        form.setList('serviceNames', 'services', toggleValue(serviceNames, serviceName))
      }
    />
  )
}

export function ResultsStep({ form }) {
  return (
    <ExamResultRowsEditor
      examResultRows={form.draft.examResultRows}
      exams={form.meta.exams ?? []}
      onChange={(examResultRows) => form.setList('examResultRows', 'exam_results', examResultRows)}
    />
  )
}

export function LeadershipStep({ form }) {
  const { fields } = form.draft

  return (
    <>
      <TextField
        label="Name"
        placeholder="Dr. Marie Ngono"
        value={fields.director_name}
        onChange={(event) => form.setField('director_name', event.target.value)}
      />
      <TextField
        label="Title"
        placeholder="Principal"
        value={fields.director_title}
        onChange={(event) => form.setField('director_title', event.target.value)}
      />
      <TextAreaField
        label="Biography"
        rows={BIOGRAPHY_ROWS}
        value={fields.director_bio}
        onChange={(event) => form.setField('director_bio', event.target.value)}
      />
      <PhotoUpload
        title="Portrait"
        photoUrl={form.draft.directorPhotoUrl}
        previewClassName="size-20 rounded-full"
        upload={form.upload}
        onChange={(photoUrl) => form.setValue('directorPhotoUrl', photoUrl)}
      />
      <UploadStatus upload={form.upload} />
    </>
  )
}

export function MediaStep({ form }) {
  return (
    <>
      <PhotoUpload
        title="Cover photo"
        photoUrl={form.draft.coverPhotoUrl}
        previewClassName="h-20 w-32 rounded-control"
        upload={form.upload}
        onChange={(photoUrl) => form.setValue('coverPhotoUrl', photoUrl)}
      />
      <VideoUploads
        videoUrls={form.draft.videoUrls}
        upload={form.upload}
        onChange={(videoUrls) => form.setList('videoUrls', 'videos', videoUrls)}
      />
      <UploadStatus upload={form.upload} />
    </>
  )
}
