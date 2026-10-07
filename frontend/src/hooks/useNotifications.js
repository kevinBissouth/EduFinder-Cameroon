import { useCallback, useEffect, useState } from 'react'

import { authedRequest } from '../utils/auth'

const REFRESH_INTERVAL_MS = 60_000
const EMPTY_INBOX = { unread_count: 0, notifications: [] }

// Notifications du compte connecté. Pas de connexion permanente au serveur :
// la liste est simplement relue à intervalle régulier.
export function useNotifications() {
  const [inbox, setInbox] = useState(EMPTY_INBOX)
  const [status, setStatus] = useState('loading')

  const reload = useCallback(async () => {
    try {
      setInbox(await authedRequest('get', '/notifications'))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
    const refreshTimer = setInterval(reload, REFRESH_INTERVAL_MS)
    return () => clearInterval(refreshTimer)
  }, [reload])

  const markRead = useCallback(
    async (notificationUuid) => {
      await authedRequest('post', `/notifications/${notificationUuid}/read`)
      await reload()
    },
    [reload],
  )

  const markAllRead = useCallback(async () => {
    await authedRequest('post', '/notifications/read-all')
    await reload()
  }, [reload])

  return {
    status,
    notifications: inbox.notifications,
    unreadCount: inbox.unread_count,
    reload,
    markRead,
    markAllRead,
  }
}
