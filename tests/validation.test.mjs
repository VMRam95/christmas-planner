import { test } from 'node:test'
import assert from 'node:assert/strict'
import { giftError, isId, isEmail, passwordError } from '../src/lib/validation.ts'
test('reject empty/oversized titles, incorrect types and out-of-range priorities', () => {
  for (const title of ['', '  ', 4, 'x'.repeat(121)]) assert.ok(giftError({ title }))
  for (const priority of [0, 4, '2', null]) assert.ok(giftError({ title: 'Libro', priority }))
  assert.ok(giftError({ title: 'Libro', description: {} }))
  assert.ok(giftError({ title: 'Libro', description: 'x'.repeat(2001) }))
})
test('URLs reject scripts, relative URLs and embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'ftp://example.test', '/relative', 'https://user:password@example.test']) assert.ok(giftError({ title: 'Libro', url }))
  assert.equal(giftError({ title: 'Libro', url: 'https://example.test/libro', priority: 2 }), null)
  assert.equal(giftError({ title: 'Libro', url: '', description: null }), null)
  assert.equal(giftError({ description: 'Actualizado' }, true), null)
})
test('IDs and emails reject malformed values without throwing', () => {
  assert.equal(isId('00000000-0000-4000-8000-000000000001'), true)
  for (const value of [null, [], 'arbitrary', 123]) assert.equal(isId(value), false)
  assert.equal(isEmail('family@example.test'), true)
  for (const value of ['invalid', 'a b@example.test', null, 12]) assert.equal(isEmail(value), false)
})

test('password limits accept long phrases and reject invalid boundary values', () => {
  for (const value of [null, 12, '', 'x'.repeat(11), 'x'.repeat(129)]) assert.ok(passwordError(value))
  for (const value of ['x'.repeat(12), 'x'.repeat(128), 'cuatro palabras para recordar']) assert.equal(passwordError(value), null)
})
