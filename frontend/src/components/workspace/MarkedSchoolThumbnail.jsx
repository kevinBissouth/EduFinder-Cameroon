import SchoolThumbnail from './SchoolThumbnail'

// La photo de l'école, et dans son coin une pastille dans la couleur de
// l'issue : on reconnaît l'école et le verdict avant de lire.
function MarkedSchoolThumbnail({ coverUrl, Icon, markClass, sizeClass = 'size-11' }) {
  return (
    <span className="relative shrink-0">
      <SchoolThumbnail coverUrl={coverUrl} className={sizeClass} />
      <span
        className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-surface ${markClass}`}
      >
        <Icon aria-hidden="true" className="size-3" />
      </span>
    </span>
  )
}

export default MarkedSchoolThumbnail
