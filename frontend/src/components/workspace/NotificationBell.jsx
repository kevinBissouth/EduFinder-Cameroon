import { useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { presentNotification } from './notificationMessages'
import { useDismiss } from '../../hooks/useDismiss'
import { formatRelativeTime } from '../../utils/format'

const MAX_SHOWN_COUNT = 99

function formatUnreadCount(unreadCount) {
  return unreadCount > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : String(unreadCount)
}

function NotificationItem({ notification, onOpen }) {
  const { t } = useTranslation('workspace')
  const { Icon, toneClass, message } = presentNotification(notification)

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
          notification.is_read ? '' : 'bg-paper'
        }`}
      >
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm text-navy text-pretty ${notification.is_read ? '' : 'font-semibold'}`}
          >
            {message}
          </span>
          {notification.reason && (
            <span className="mt-0.5 block text-sm text-ink">
              {t('notifications.reason', { reason: notification.reason })}
            </span>
          )}
          <span className="mt-0.5 block text-xs text-ink-soft">
            {formatRelativeTime(notification.created_at)}
          </span>
        </span>
        {!notification.is_read && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
            <span className="sr-only">{t('notifications.unread')}</span>
          </span>
        )}
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
    <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
      {inbox.notifications.map((notification) => (
        <NotificationItem
          key={notification.notification_uuid}
          notification={notification}
          onOpen={onOpen}
        />
      ))}
    </ul>
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
