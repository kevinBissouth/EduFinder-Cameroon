import { useTranslation } from 'react-i18next'

import { SelectField, TextAreaField, TextField } from '../../ui/Field'
import Notice from '../../workspace/Notice'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toChipOptions, toggleValue } from '../../workspace/toggleChips'
import { PhotoUpload, VideoUploads } from './FileUploads'
import { ExamResultRowsEditor, FeeRowsEditor } from './RowEditors'
import {
  translateLevelOptions,
  translateOptionNames,
  useReferenceLabel,
} from '../../../hooks/useReferenceLabel'

const BIOGRAPHY_ROWS = 4
const DESCRIPTION_ROWS = 5

function UploadStatus({ upload }) {
  const { t } = useTranslation('manager')

  return (
    <>
      {upload.uploadError && <Notice tone="danger">{upload.uploadError}</Notice>}
      {upload.isUploading && (
        <p role="status" className="text-sm text-ink-soft">
          {t('form.uploading')}
        </p>
      )}
    </>
  )
}

export function GeneralStep({ form }) {
  const { t } = useTranslation('manager')
  const { fields } = form.draft
  const requiredSuffix = form.isCreation ? t('form.required') : ''

  return (
    <>
      <TextField
        label={`${t('form.fields.schoolName')}${requiredSuffix}`}
        placeholder={t('form.fields.schoolNamePlaceholder')}
        value={fields.name}
        onChange={(event) => form.setField('name', event.target.value)}
      />
      <TextField
        label={t('detail.phone')}
        type="tel"
        placeholder="+237 6XX XX XX XX"
        value={fields.phone}
        onChange={(event) => form.setField('phone', event.target.value)}
      />
      <TextField
        label={t('detail.email')}
        type="email"
        value={fields.contact_email}
        onChange={(event) => form.setField('contact_email', event.target.value)}
      />
      <TextField
        label={t('detail.website')}
        value={fields.website}
        onChange={(event) => form.setField('website', event.target.value)}
      />
      <TextAreaField
        label={t('detail.description')}
        rows={DESCRIPTION_ROWS}
        value={fields.description}
        onChange={(event) => form.setField('description', event.target.value)}
      />
    </>
  )
}

export function ClassificationStep({ form }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const { fields } = form.draft
  const requiredSuffix = form.isCreation ? t('form.required') : ''
  const referenceSelects = [
    { fieldName: 'id_city', label: t('form.fields.city'), options: form.meta.cities ?? [] },
    {
      fieldName: 'id_type',
      label: t('form.fields.schoolType'),
      options: translateOptionNames(form.meta.types ?? [], 'types', translateReference),
    },
    {
      fieldName: 'id_sector',
      label: t('form.fields.sector'),
      options: translateOptionNames(form.meta.sectors ?? [], 'sectors', translateReference),
    },
    {
      fieldName: 'id_linguistic_section',
      label: t('form.fields.section'),
      options: translateOptionNames(form.meta.languages ?? [], 'sections', translateReference),
    },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {referenceSelects.map((referenceSelect) => (
          <SelectField
            key={referenceSelect.fieldName}
            label={`${referenceSelect.label}${requiredSuffix}`}
            placeholder={t('form.choose')}
            options={referenceSelect.options}
            value={fields[referenceSelect.fieldName]}
            onChange={(event) => form.setField(referenceSelect.fieldName, event.target.value)}
          />
        ))}
      </div>
      <TextField
        label={t('detail.address')}
        placeholder={t('form.fields.addressPlaceholder')}
        value={fields.address}
        onChange={(event) => form.setField('address', event.target.value)}
      />
    </>
  )
}

export function ProgrammesStep({ form }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const programOptions = (form.meta.programs ?? []).map((program) => ({
    value: program.id,
    label: translateReference('programs', program.name),
  }))
  if (programOptions.length === 0) {
    return <p className="text-sm text-ink-soft">{t('form.fields.noProgramme')}</p>
  }

  return (
    <ToggleChipGroup
      label={t('detail.programmes')}
      options={programOptions}
      selectedValues={form.draft.programIds}
      onToggle={(programId) =>
        form.setList('programIds', 'program_ids', toggleValue(form.draft.programIds, programId))
      }
    />
  )
}

export function FeesStep({ form }) {
  const translateReference = useReferenceLabel()

  return (
    <FeeRowsEditor
      feeRows={form.draft.feeRows}
      levels={translateLevelOptions(form.meta.levels ?? [], translateReference)}
      paymentMethods={form.meta.payment_methods ?? []}
      onChange={(feeRows) => form.setList('feeRows', 'fees', feeRows)}
    />
  )
}

export function ServicesStep({ form }) {
  const { t } = useTranslation('manager')
  const { serviceNames } = form.draft
  // Un service déjà sur la fiche mais absent de la liste de référence reste proposé.
  const availableNames = [...new Set([...(form.meta.services ?? []), ...serviceNames])].sort()
  if (availableNames.length === 0) {
    return <p className="text-sm text-ink-soft">{t('form.fields.noService')}</p>
  }

  return (
    <ToggleChipGroup
      label={t('detail.services')}
      options={toChipOptions(availableNames)}
      selectedValues={serviceNames}
      onToggle={(serviceName) =>
        form.setList('serviceNames', 'services', toggleValue(serviceNames, serviceName))
      }
    />
  )
}

export function ResultsStep({ form }) {
  const translateReference = useReferenceLabel()

  return (
    <ExamResultRowsEditor
      examResultRows={form.draft.examResultRows}
      exams={translateOptionNames(form.meta.exams ?? [], 'exams', translateReference)}
      onChange={(examResultRows) => form.setList('examResultRows', 'exam_results', examResultRows)}
    />
  )
}

export function LeadershipStep({ form }) {
  const { t } = useTranslation('manager')
  const { fields } = form.draft

  return (
    <>
      <TextField
        label={t('form.fields.directorName')}
        placeholder={t('form.fields.directorNamePlaceholder')}
        value={fields.director_name}
        onChange={(event) => form.setField('director_name', event.target.value)}
      />
      <TextField
        label={t('form.fields.directorTitle')}
        placeholder={t('form.fields.directorTitlePlaceholder')}
        value={fields.director_title}
        onChange={(event) => form.setField('director_title', event.target.value)}
      />
      <TextAreaField
        label={t('form.fields.biography')}
        rows={BIOGRAPHY_ROWS}
        value={fields.director_bio}
        onChange={(event) => form.setField('director_bio', event.target.value)}
      />
      <PhotoUpload
        title={t('form.fields.portrait')}
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
  const { t } = useTranslation('manager')

  return (
    <>
      <PhotoUpload
        title={t('form.fields.coverPhoto')}
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
