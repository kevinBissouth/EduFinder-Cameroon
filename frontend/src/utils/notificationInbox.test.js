import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  EMPTY_INBOX,
  appendOlderPage,
  markAllInboxRead,
  markInboxNotificationRead,
  mergeFirstPage,
} from './notificationInbox.js'

function notification(uuid, isRead = false) {
  return { notification_uuid: uuid, is_read: isRead }
}

function uuidsOf(inbox) {
  return inbox.notifications.map((item) => item.notification_uuid)
}

test('a refreshed first page keeps the older notifications already shown', () => {
  const shownInbox = {
    unread_count: 3,
    notifications: [notification('c'), notification('b'), notification('a')],
    has_more: true,
  }
  const firstPage = {
    unread_count: 4,
    notifications: [notification('d'), notification('c')],
    has_more: true,
  }

  const mergedInbox = mergeFirstPage(shownInbox, firstPage)

  assert.deepEqual(uuidsOf(mergedInbox), ['d', 'c', 'b', 'a'])
  assert.equal(mergedInbox.unread_count, 4)
  // Ce qui reste à charger se lit sur la dernière page déjà chargée.
  assert.equal(mergedInbox.has_more, true)
})

test('the first load simply takes the page', () => {
  const firstPage = { unread_count: 1, notifications: [notification('a')], has_more: false }

  assert.deepEqual(mergeFirstPage(EMPTY_INBOX, firstPage), firstPage)
})

test('an older page goes after the shown ones and says whether more remain', () => {
  const shownInbox = { unread_count: 2, notifications: [notification('b')], has_more: true }
  const olderPage = { unread_count: 2, notifications: [notification('a')], has_more: false }

  const inbox = appendOlderPage(shownInbox, olderPage)

  assert.deepEqual(uuidsOf(inbox), ['b', 'a'])
  assert.equal(inbox.has_more, false)
})

test('reading a notification marks it and lowers the count at once', () => {
  const inbox = {
    unread_count: 2,
    notifications: [notification('b'), notification('a')],
    has_more: false,
  }

  const readInbox = markInboxNotificationRead(inbox, 'a')

  assert.deepEqual(readInbox.notifications.map((item) => item.is_read), [false, true])
  assert.equal(readInbox.unread_count, 1)
  // Relire une notification déjà lue ne baisse pas le compte une seconde fois.
  assert.equal(markInboxNotificationRead(readInbox, 'a').unread_count, 1)
})

test('reading everything empties the count', () => {
  const inbox = { unread_count: 7, notifications: [notification('b'), notification('a')], has_more: true }

  const readInbox = markAllInboxRead(inbox)

  assert.equal(readInbox.unread_count, 0)
  assert.ok(readInbox.notifications.every((item) => item.is_read))
})
