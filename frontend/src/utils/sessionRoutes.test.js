import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findRedirectPath, findWorkspacePath } from './sessionRoutes.js'

const MANAGER = { role: 'manager' }
const SUPER_ADMIN = { role: 'super_admin' }
const NOT_CHECKED_YET = undefined
const SIGNED_OUT = null

test('each role has its own space', () => {
  assert.equal(findWorkspacePath(MANAGER), '/manager')
  assert.equal(findWorkspacePath(SUPER_ADMIN), '/school-admin')
})

test('a signed-in account never sees the login form again', () => {
  assert.equal(findRedirectPath('login', MANAGER), '/manager')
  assert.equal(findRedirectPath('login', SUPER_ADMIN), '/school-admin')
})

test('a signed-out visitor stays on the login form', () => {
  assert.equal(findRedirectPath('login', SIGNED_OUT), null)
})

test('nobody is sent anywhere before the session is checked', () => {
  assert.equal(findRedirectPath('login', NOT_CHECKED_YET), null)
  assert.equal(findRedirectPath('manager', NOT_CHECKED_YET), null)
})

test('a private space sends a signed-out visitor to the login form', () => {
  assert.equal(findRedirectPath('manager', SIGNED_OUT), '/login')
  assert.equal(findRedirectPath('school-admin', SIGNED_OUT), '/login')
})

test('a manager is sent out of the super admin space, not the reverse', () => {
  assert.equal(findRedirectPath('school-admin', MANAGER), '/manager')
  assert.equal(findRedirectPath('school-admin', SUPER_ADMIN), null)
  assert.equal(findRedirectPath('manager', SUPER_ADMIN), null)
})

test('public pages are open to everyone, signed in or not', () => {
  assert.equal(findRedirectPath('home', MANAGER), null)
  assert.equal(findRedirectPath('school-detail', SIGNED_OUT), null)
})
