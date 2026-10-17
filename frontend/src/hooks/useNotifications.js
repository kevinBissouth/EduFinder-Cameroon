import { useCallback, useEffect, useState } from 'react'

import { authedRequest } from '../utils/auth'
import {
  EMPTY_INBOX,
  appendOlderPage,
  markAllInboxRead,
  markInboxNotificationRead,
  mergeFirstPage,
} from '../utils/notificationInbox'

const REFRESH_INTERVAL_MS = 60_000
const NOTIFICATIONS_URL = '/notifications'

function isPageVisible() {
  return document.visibilityState === 'visible'
}

// Notifications du compte connecté. Pas de connexion permanente au serveur :
// la première page est relue à intervalle régulier, seulement quand l'onglet
// est visible (les données mobiles coûtent), et tout de suite quand on y
// revient, pour que la pastille ne reste pas fausse.
export function useNotifications() {
  const [inbox, setInbox] = useState(EMPTY_INBOX)
  const [status, setStatus] = useState('loading')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasLoadMoreFailed, setHasLoadMoreFailed] = useState(false)

  const reload = useCallback(async () => {
    try {
      const firstPage = await authedRequest('get', NOTIFICATIONS_URL)
      setInbox((shownInbox) => mergeFirstPage(shownInbox, firstPage))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
    const refreshTimer = setInterval(() => {
      if (isPageVisible()) reload()
    }, REFRESH_INTERVAL_MS)
    const reloadWhenShown = () => {
      if (isPageVisible()) reload()
    }
    document.addEventListener('visibilitychange', reloadWhenShown)
    return () => {
      clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', reloadWhenShown)
    }
  }, [reload])

  const loadMore = useCallback(async () => {
    const lastShown = inbox.notifications.at(-1)
    if (!lastShown) return
    setIsLoadingMore(true)
    setHasLoadMoreFailed(false)
    try {
      const olderPage = await authedRequest(
        'get',
        `${NOTIFICATIONS_URL}?before=${encodeURIComponent(lastShown.notification_uuid)}`,
      )
      setInbox((shownInbox) => appendOlderPage(shownInbox, olderPage))
    } catch {
      setHasLoadMoreFailed(true)
    } finally {
      setIsLoadingMore(false)
    }
  }, [inbox.notifications])

  // La lecture s'affiche aussitôt. Si le serveur ne l'enregistre pas (réseau
  // coupé), je relis la boîte : elle retrouve son vrai état au lieu de mentir.
  const markRead = useCallback(
    async (notificationUuid) => {
      setInbox((shownInbox) => markInboxNotificationRead(shownInbox, notificationUuid))
      try {
        await authedRequest('post', `${NOTIFICATIONS_URL}/${notificationUuid}/read`)
      } catch {
        await reload()
      }
    },
    [reload],
  )

  const markAllRead = useCallback(async () => {
    setInbox(markAllInboxRead)
    try {
      await authedRequest('post', `${NOTIFICATIONS_URL}/read-all`)
    } catch {
      await reload()
    }
  }, [reload])

  return {
    status,
    notifications: inbox.notifications,
    unreadCount: inbox.unread_count,
    hasMore: inbox.has_more,
    isLoadingMore,
    hasLoadMoreFailed,
    reload,
    loadMore,
    markRead,
    markAllRead,
  }
}
