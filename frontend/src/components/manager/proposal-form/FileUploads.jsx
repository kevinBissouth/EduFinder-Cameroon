import { Trash2, Upload, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import FileButton from '../../workspace/FileButton'
import { toMediaUrl } from '../../../utils/media'

const IMAGE_FILE_TYPES = 'image/jpeg,image/png,image/webp'
const VIDEO_FILE_TYPES = 'video/mp4,video/webm'

function RemoveFileButton({ label, onRemove }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onRemove}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-danger-deep hover:bg-danger-soft"
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}

// Une seule photo : en choisir une autre remplace la précédente.
export function PhotoUpload({ title, photoUrl, previewClassName, upload, onChange }) {
  const { t } = useTranslation('manager')
  const selectPhoto = async (file) => {
    const storedUrl = await upload.uploadFile(file)
    if (storedUrl) onChange(storedUrl)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-navy">{title}</p>
      {photoUrl && (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={toMediaUrl(photoUrl)}
            alt={t('form.files.preview', { title })}
            className={`bg-muted object-cover ${previewClassName}`}
          />
          <RemoveFileButton
            label={t('form.files.removeNamed', { title })}
            onRemove={() => onChange('')}
          />
        </div>
      )}
      <div className="mt-2">
        <FileButton
          accept={IMAGE_FILE_TYPES}
          disabled={upload.isUploading}
          onSelectFile={selectPhoto}
        >
          <Upload aria-hidden="true" className="size-4" />
          {photoUrl ? t('form.files.replacePhoto') : t('form.files.choosePhoto')}
        </FileButton>
      </div>
    </div>
  )
}

export function VideoUploads({ videoUrls, upload, onChange }) {
  const { t } = useTranslation('manager')
  const addVideo = async (file) => {
    const storedUrl = await upload.uploadFile(file)
    if (storedUrl) onChange([...videoUrls, storedUrl])
  }

  return (
    <div>
      <p className="text-sm font-semibold text-navy">{t('form.files.videos')}</p>
      <ul className="mt-1 divide-y divide-line">
        {videoUrls.map((videoUrl) => (
          <li key={videoUrl} className="flex items-center justify-between gap-3 py-1">
            <span className="flex min-w-0 items-center gap-2 text-sm text-navy">
              <Video aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              <span className="truncate">{videoUrl.split('/').pop()}</span>
            </span>
            <RemoveFileButton
              label={t('form.files.removeVideo')}
              onRemove={() => onChange(videoUrls.filter((url) => url !== videoUrl))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <FileButton accept={VIDEO_FILE_TYPES} disabled={upload.isUploading} onSelectFile={addVideo}>
          <Video aria-hidden="true" className="size-4" />
          {t('form.files.addVideo')}
        </FileButton>
      </div>
    </div>
  )
}
