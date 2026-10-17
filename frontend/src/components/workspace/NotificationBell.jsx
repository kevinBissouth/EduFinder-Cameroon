import { useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { presentNotification } from './notificationMessages'
import SchoolThumbnail from './SchoolThumbnail'
import { listChangedSections } from './submissionContent'
import { useDismiss } from '../../hooks/useDismiss'
import { formatRelativeTime } from '../../utils/format'

const MAX_SHOWN_COUNT = 99
const MAX_SHOWN_SECTIONS = 3

function formatUnreadCount(unreadCount) {
  return unreadCount > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : String(unreadCount)
}

// La photo de l'école, et dans son coin l'issue de l'événement : on reconnaît
// l'école et le verdict avant de lire.
function NotificationThumbnail({ coverUrl, Icon, markClass }) {
  return (
    <span className="relative shrink-0">
      <SchoolThumbnail coverUrl={coverUrl} />
      <span
        className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-surface ${markClass}`}
      >
        <Icon aria-hidden="true" className="size-3" />
      </span>
    </span>
  )
}

// Quelques rubriques suffisent à reconnaître la soumission ; la liste entière
// est dans son détail.
function SectionChips({ sections }) {
  const { t } = useTranslation('workspace')
  const shownSections = sections.slice(0, MAX_SHOWN_SECTIONS)
  const hiddenCount = sections.length - shownSections.length

  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {shownSections.map((section) => (
        <span key={section} className="rounded-full bg-muted px-2 py-0.5 text-xs text-navy">
          {section}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-primary-deep">
          {t('notifications.moreSections', { count: hiddenCount })}
        </span>
      )}
    </span>
  )
}

// Une non lue se distingue par un liseré bleu à gauche, un fond teinté et un
// point près de l'heure.
function NotificationItem({ notification, onOpen }) {
  const { t } = useTranslation('workspace')
  const { Icon, markClass, verdictClass, verdict } = presentNotification(notification)
  const changedSections = listChangedSections(notification)
  const unreadClass = notification.is_read
    ? ''
    : 'bg-muted/50 shadow-[inset_3px_0_0_var(--color-primary)]'

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted ${unreadClass}`}
      >
        <NotificationThumbnail
          coverUrl={notification.cover_url}
          Icon={Icon}
          markClass={markClass}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">
              {notification.establishment_name}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-soft">
              {formatRelativeTime(notification.created_at)}
              {!notification.is_read && (
                <span className="size-2 rounded-full bg-primary">
                  <span className="sr-only">{t('notifications.unread')}</span>
                </span>
              )}
            </span>
          </span>
          <span className={`mt-0.5 block text-sm font-semibold ${verdictClass}`}>{verdict}</span>
          {changedSections.length > 0 && <SectionChips sections={changedSections} />}
          {notification.reason && (
            <span className="mt-2 line-clamp-2 border-l-2 border-line pl-2 text-sm text-ink">
              <span className="sr-only">{t('notifications.reasonLabel')} </span>
              {notification.reason}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

function PanelBody({ inbox, onOpen }) {
  const { t } = useTranslation('workspace')
  if (inbox.status === 'loading') {
    return <p className="px-4 py-8 text-center text-sm text-ink-soft">{t('notifications.loading')}</p>
  }
  if (inbox.status === 'error') {
    return (
      <div role="alert" className="px-4 py-8 text-center">
        <p className="text-sm text-danger-deep">{t('notifications.error')}</p>
        <button
          type="button"
          onClick={inbox.reload}
          className="mt-2 min-h-11 cursor-pointer rounded-control px-3 text-sm font-semibold text-primary-deep hover:bg-primary-soft"
        >
          {t('retry')}
        </button>
      </div>
    )
  }
  if (inbox.notifications.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-ink-soft">{t('notifications.empty')}</p>
  }
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <ul className="divide-y divide-line">
        {inbox.notifications.map((notification) => (
          <NotificationItem
            key={notification.notification_uuid}
            notification={notification}
            onOpen={onOpen}
          />
        ))}
      </ul>
      {inbox.hasMore && <LoadMoreButton inbox={inbox} />}
    </div>
  )
}

// Au-delà de la première page, les notifications plus anciennes se chargent
// à la demande, vingt par vingt.
function LoadMoreButton({ inbox }) {
  const { t } = useTranslation('workspace')

  return (
    <div className="border-t border-line px-4 py-3 text-center">
      {inbox.hasLoadMoreFailed && (
        <p role="alert" className="mb-2 text-sm text-danger-deep">
          {t('notifications.loadMoreError')}
        </p>
      )}
      <button
        type="button"
        disabled={inbox.isLoadingMore}
        onClick={inbox.loadMore}
        className="min-h-11 cursor-pointer rounded-control px-3 text-sm font-semibold text-primary-deep hover:bg-primary-soft disabled:cursor-wait disabled:text-ink-soft"
      >
        {inbox.isLoadingMore ? t('notifications.loadingMore') : t('notifications.loadMore')}
      </button>
    </div>
  )
}

// Cloche de la barre du haut : pastille des non lues et panneau des
// notifications. Ouvrir une notification la marque lue puis laisse la page
// décider où aller.
function NotificationBell({ inbox, onOpenNotification }) {
  const { t } = useTranslation('workspace')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  useDismiss(containerRef, isOpen, () => setIsOpen(false))

  const openNotification = (notification) => {
    setIsOpen(false)
    if (!notification.is_read) inbox.markRead(notification.notification_uuid)
    onOpenNotification(notification)
  }

  const bellLabel =
    inbox.unreadCount === 0
      ? t('notifications.title')
      : t('notifications.unreadCount', { count: inbox.unreadCount })

  return (
    // Sur téléphone le panneau se cale sur la barre du haut (toute la largeur) ;
    // au-delà, il s'ouvre sous la cloche.
    <div ref={containerRef} className="sm:relative">
      <button
        type="button"
        aria-label={bellLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-navy shadow-soft transition-colors hover:border-primary hover:text-primary-deep lg:shadow-none"
      >
        <Bell aria-hidden="true" className="size-5" />
        {inbox.unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-navy"
          >
            {formatUnreadCount(inbox.unreadCount)}
          </span>
        )}
      </button>
      {isOpen && (
        <section
          aria-label={t('notifications.title')}
          className="absolute inset-x-4 top-full z-40 mt-2 overflow-hidden rounded-panel border border-line bg-surface shadow-raised sm:inset-x-auto sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
            <h2 className="text-base font-bold text-navy">{t('notifications.title')}</h2>
            <button
              type="button"
              disabled={inbox.unreadCount === 0}
              onClick={inbox.markAllRead}
              className="min-h-11 cursor-pointer rounded-control px-2 text-sm font-semibold text-primary-deep hover:bg-primary-soft disabled:cursor-not-allowed disabled:text-ink-soft disabled:hover:bg-transparent"
            >
              {t('notifications.markAllRead')}
            </button>
          </div>
          <PanelBody inbox={inbox} onOpen={openNotification} />
        </section>
      )}
    </div>
  )
}

export default NotificationBell
