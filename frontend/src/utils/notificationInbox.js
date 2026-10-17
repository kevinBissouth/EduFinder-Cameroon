// Boîte de notifications du compte connecté, telle que la cloche l'affiche :
// les pages chargées les unes après les autres, et le nombre de non lues que
// donne le serveur (il compte aussi celles qui ne sont pas encore chargées).
export const EMPTY_INBOX = { unread_count: 0, notifications: [], has_more: false }

function uuidOf(notification) {
  return notification.notification_uuid
}

// Le rafraîchissement ne relit que la première page : les notifications plus
// anciennes, chargées par « Afficher plus », restent à leur place derrière.
export function mergeFirstPage(shownInbox, firstPage) {
  const firstPageUuids = new Set(firstPage.notifications.map(uuidOf))
  const olderNotifications = shownInbox.notifications.filter(
    (notification) => !firstPageUuids.has(uuidOf(notification)),
  )
  return {
    unread_count: firstPage.unread_count,
    notifications: [...firstPage.notifications, ...olderNotifications],
    has_more: olderNotifications.length > 0 ? shownInbox.has_more : firstPage.has_more,
  }
}

export function appendOlderPage(shownInbox, olderPage) {
  return {
    unread_count: olderPage.unread_count,
    notifications: [...shownInbox.notifications, ...olderPage.notifications],
    has_more: olderPage.has_more,
  }
}

// La lecture s'affiche tout de suite, sans attendre le serveur.
export function markInboxNotificationRead(inbox, notificationUuid) {
  const wasUnread = inbox.notifications.some(
    (notification) => uuidOf(notification) === notificationUuid && !notification.is_read,
  )
  return {
    ...inbox,
    unread_count: wasUnread ? Math.max(inbox.unread_count - 1, 0) : inbox.unread_count,
    notifications: inbox.notifications.map((notification) =>
      uuidOf(notification) === notificationUuid ? { ...notification, is_read: true } : notification,
    ),
  }
}

export function markAllInboxRead(inbox) {
  return {
    ...inbox,
    unread_count: 0,
    notifications: inbox.notifications.map((notification) => ({ ...notification, is_read: true })),
  }
}
