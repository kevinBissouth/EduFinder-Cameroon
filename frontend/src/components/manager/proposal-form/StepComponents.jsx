import { Landmark, Languages, MapPin, School } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ChoiceField from '../../ui/ChoiceField'
import { PhoneField, TextAreaField, TextField } from '../../ui/Field'
import Notice from '../../workspace/Notice'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toChipOptions, toggleValue } from '../../workspace/toggleChips'
import { PhotoUpload, VideoUploads } from './FileUploads'
import { FIELD_MAX_LENGTHS, rowErrorPath } from './proposalValidation'
import { ExamResultRowsEditor, FeeRowsEditor } from './RowEditors'
import { translateOptionNames, useReferenceLabel } from '../../../hooks/useReferenceLabel'
import { SUPPORTED_LANGUAGES } from '../../../i18n/languages'

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

const CONTENT_LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((language) => ({
  id: language.code,
  name: language.name,
}))

// Libellés des champs de traduction : « Biographie en anglais (facultatif) ».
// La traduction se fait vers l'autre langue du site ; tant que le responsable
// n'a pas dit dans laquelle il écrit, il n'y a rien à proposer.
function useTranslationLabels(contentLanguage) {
  const { t } = useTranslation('manager')
  const targetLanguage = SUPPORTED_LANGUAGES.find((language) => language.code !== contentLanguage)
  if (!contentLanguage || !targetLanguage) return null
  const language = t(`form.translationTarget.${targetLanguage.code}`)
  return { describe: (field) => t('form.fields.translationOf', { field, language }) }
}

export function GeneralStep({ form }) {
  const { t } = useTranslation('manager')
  const { fields } = form.draft
  const translationLabels = useTranslationLabels(fields.content_language)
  const requiredSuffix = form.isCreation ? t('form.required') : ''

  return (
    <>
      <TextField
        label={`${t('form.fields.schoolName')}${requiredSuffix}`}
        placeholder={t('form.fields.schoolNamePlaceholder')}
        maxLength={FIELD_MAX_LENGTHS.name}
        error={form.fieldError('name')}
        value={fields.name}
        onChange={(event) => form.setField('name', event.target.value)}
      />
      <PhoneField
        label={t('detail.phone')}
        placeholder="+237 6XX XX XX XX"
        maxLength={FIELD_MAX_LENGTHS.phone}
        error={form.fieldError('phone')}
        value={fields.phone}
        onChange={(phone) => form.setField('phone', phone)}
      />
      <TextField
        label={t('detail.email')}
        type="email"
        maxLength={FIELD_MAX_LENGTHS.contact_email}
        error={form.fieldError('contact_email')}
        value={fields.contact_email}
        onChange={(event) => form.setField('contact_email', event.target.value)}
      />
      <TextField
        label={t('detail.website')}
        maxLength={FIELD_MAX_LENGTHS.website}
        error={form.fieldError('website')}
        value={fields.website}
        onChange={(event) => form.setField('website', event.target.value)}
      />
      <TextAreaField
        label={t('detail.description')}
        rows={DESCRIPTION_ROWS}
        value={fields.description}
        onChange={(event) => form.setField('description', event.target.value)}
      />
      <ChoiceField
        icon={Languages}
        label={t('form.fields.contentLanguage')}
        placeholder={t('form.fields.contentLanguagePlaceholder')}
        options={CONTENT_LANGUAGE_OPTIONS}
        value={fields.content_language}
        onChange={(languageCode) => form.setField('content_language', languageCode)}
      />
      <p className="-mt-2 text-sm text-ink-soft">{t('form.fields.contentLanguageHint')}</p>
      {translationLabels && (
        <TextAreaField
          label={translationLabels.describe(t('detail.description'))}
          rows={DESCRIPTION_ROWS}
          value={fields.description_translation}
          onChange={(event) => form.setField('description_translation', event.target.value)}
        />
      )}
    </>
  )
}

export function ClassificationStep({ form }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const { fields } = form.draft
  const requiredSuffix = form.isCreation ? t('form.required') : ''
  const referenceChoices = [
    {
      fieldName: 'id_city',
      icon: MapPin,
      label: t('form.fields.city'),
      options: form.meta.cities ?? [],
    },
    {
      fieldName: 'id_type',
      icon: School,
      label: t('form.fields.schoolType'),
      options: translateOptionNames(form.meta.types ?? [], 'types', translateReference),
    },
    {
      fieldName: 'id_sector',
      icon: Landmark,
      label: t('form.fields.sector'),
      options: translateOptionNames(form.meta.sectors ?? [], 'sectors', translateReference),
    },
    {
      fieldName: 'id_linguistic_section',
      icon: Languages,
      label: t('form.fields.section'),
      options: translateOptionNames(form.meta.languages ?? [], 'sections', translateReference),
    },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {referenceChoices.map((referenceChoice) => (
          <ChoiceField
            key={referenceChoice.fieldName}
            icon={referenceChoice.icon}
            label={`${referenceChoice.label}${requiredSuffix}`}
            placeholder={t('form.choose')}
            options={referenceChoice.options}
            error={form.fieldError(referenceChoice.fieldName)}
            value={fields[referenceChoice.fieldName]}
            onChange={(referenceId) => form.setField(referenceChoice.fieldName, referenceId)}
          />
        ))}
      </div>
      <TextField
        label={t('detail.address')}
        placeholder={t('form.fields.addressPlaceholder')}
        maxLength={FIELD_MAX_LENGTHS.address}
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
  return (
    <FeeRowsEditor
      feeRows={form.draft.feeRows}
      levels={form.meta.levels ?? []}
      offeredLevelIds={form.offeredChoices.offeredLevelIds}
      paymentMethods={form.meta.payment_methods ?? []}
      errorFor={(rowId, fieldName) => form.fieldError(rowErrorPath('feeRows', rowId, fieldName))}
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
      offeredExamIds={form.offeredChoices.offeredExamIds}
      errorFor={(rowId, fieldName) =>
        form.fieldError(rowErrorPath('examResultRows', rowId, fieldName))
      }
      onChange={(examResultRows) => form.setList('examResultRows', 'exam_results', examResultRows)}
    />
  )
}

export function LeadershipStep({ form }) {
  const { t } = useTranslation('manager')
  const { fields } = form.draft
  const translationLabels = useTranslationLabels(fields.content_language)

  return (
    <>
      <TextField
        label={t('form.fields.directorName')}
        placeholder={t('form.fields.directorNamePlaceholder')}
        maxLength={FIELD_MAX_LENGTHS.director_name}
        value={fields.director_name}
        onChange={(event) => form.setField('director_name', event.target.value)}
      />
      <TextField
        label={t('form.fields.directorTitle')}
        placeholder={t('form.fields.directorTitlePlaceholder')}
        maxLength={FIELD_MAX_LENGTHS.director_title}
        value={fields.director_title}
        onChange={(event) => form.setField('director_title', event.target.value)}
      />
      {translationLabels && (
        <TextField
          label={translationLabels.describe(t('form.fields.directorTitle'))}
          maxLength={FIELD_MAX_LENGTHS.director_title_translation}
          value={fields.director_title_translation}
          onChange={(event) => form.setField('director_title_translation', event.target.value)}
        />
      )}
      <TextAreaField
        label={t('form.fields.biography')}
        rows={BIOGRAPHY_ROWS}
        value={fields.director_bio}
        onChange={(event) => form.setField('director_bio', event.target.value)}
      />
      {translationLabels && (
        <TextAreaField
          label={translationLabels.describe(t('form.fields.biography'))}
          rows={BIOGRAPHY_ROWS}
          value={fields.director_bio_translation}
          onChange={(event) => form.setField('director_bio_translation', event.target.value)}
        />
      )}
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
