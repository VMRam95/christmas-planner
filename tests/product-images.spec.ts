import { test, expect, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

// Run against the isolated local family seeded by scripts/seed-local.mjs.
const product = process.env.PRODUCT_IMAGE_TEST_URL || 'https://es.creative.com/p/speakers/creative-pebble-pro'
const title = 'CREATIVE Pebble Pro 2.0 Altavoces USB-C con Bluetooth e iluminación RGB'
const password = 'Local-test-password-2026!'
test.use({ hasTouch: true })

async function login(page: Page, email = 'alice@example.test'): Promise<void> {
  const response = await page.request.post('/api/auth', { data: { email, password } })
  expect(response.status()).toBe(200)
}

async function wishCard(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true }).locator('..').locator('..').locator('..').locator('..')
}

test('image endpoint requires login and rejects private destinations', async ({ request }) => {
  const anonymous = await request.get('/api/product-image?url=' + encodeURIComponent(product))
  expect(anonymous.status()).toBe(401)
  expect(anonymous.headers()['cache-control']).toBe('no-store')
  expect((await request.post('/api/auth', { data: { email: 'alice@example.test', password } })).status()).toBe(200)
  for (const url of ['http://127.0.0.1/', 'http://169.254.169.254/', 'file:///etc/passwd']) {
    const invalid = await request.get('/api/product-image?url=' + encodeURIComponent(url))
    expect(invalid.status()).toBe(400)
    expect(invalid.headers()['cache-control']).toBe('no-store')
  }
  const missing = await request.get('/api/product-image?url=' + encodeURIComponent('https://example.com/'))
  expect(missing.status()).toBe(404)
  expect(missing.headers()['cache-control']).toBe('no-store')
})

test('both reported Amazon products load and bypass previously cached failure URLs', async ({ page }) => {
  await login(page)
  const products = [
    { title: 'JOYROOM PODIX Estación carga GaN 140W', url: 'https://www.amazon.es/dp/B0G3N54XSC' },
    { title: 'CREATIVE Pebble Pro 2.0 Altavoces USB-C', url: 'https://www.amazon.es/gp/product/B0DXW25R3D' },
  ]
  const ids: string[] = []
  try {
    for (const item of products) {
      const response = await page.request.post('/api/wishes', { data: { ...item, description: 'Prueba de imagen de Amazon', priority: 2 } })
      expect(response.status()).toBe(200)
      ids.push((await response.json()).data.id)
    }
    await page.goto('/my-wishes')
    for (const item of products) {
      const card = await wishCard(page, item.title)
      await card.scrollIntoViewIfNeeded()
      const image = card.getByRole('img', { name: item.title, exact: true })
      await expect(image).toHaveAttribute('src', /&v=2$/)
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(16)
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await (await wishCard(page, products[0].title)).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/amazon-images-5841/amazon-wishes-${width}.png` })
    }
  } finally {
    for (const id of ids) await page.request.delete('/api/wishes?id=' + id)
  }
})

test('existing wishes, CRUD, real product images, family cards and responsive layout', async ({ page }) => {
  await login(page)
  const created = await page.request.post('/api/wishes', { data: { title, description: 'USB-C, Bluetooth 5.3 y luz RGB. Una descripción larga para comprobar el espacio de la tarjeta.', url: product, priority: 2 } })
  expect(created.status()).toBe(200)
  const wish = (await created.json()).data
  const noImage = await page.request.post('/api/wishes', { data: { title: 'Deseo con enlace sin imagen', url: 'https://example.com/', priority: 1 } })
  const fallback = (await noImage.json()).data
  const metrics = []
  try {
    // Created before navigation: previously saved links also resolve without editing/backfilling.
    await page.goto('/my-wishes')
    await expect((await wishCard(page, 'Un libro para las tardes de invierno')).locator('img')).toHaveCount(0)
    let card = await wishCard(page, title)
    await card.scrollIntoViewIfNeeded()
    const image = card.getByRole('img', { name: title, exact: true })
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(0)
    await (await wishCard(page, 'Deseo con enlace sin imagen')).scrollIntoViewIfNeeded()
    await expect(page.getByRole('img', { name: 'Sin imagen del producto' })).toBeVisible({ timeout: 20000 })
    for (const width of [320, 390, 768, 1024, 1440]) {
      const start = Date.now()
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
      await card.scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(card.getByRole('link', { name: 'Ver enlace' })).toBeVisible()
      await expect(card.getByRole('button', { name: 'Editar ' + title })).toBeVisible()
      metrics.push({ width, resizeAndCheckMs: Date.now() - start, image: await image.boundingBox() })
      if ([390, 1440].includes(width)) await page.screenshot({ path: `artifacts/product-images-5830/wishes-${width}.png` })
    }
    await card.getByRole('button', { name: 'Editar ' + title }).click()
    const input = page.getByLabel('¿Qué te gustaría recibir?')
    await expect(input).toHaveValue(title)
    await page.getByLabel('Enlace (opcional)').fill('https://example.com/')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    card = await wishCard(page, title)
    await card.scrollIntoViewIfNeeded()
    await expect(card.getByRole('img', { name: 'Sin imagen del producto' })).toBeVisible({ timeout: 20000 })
    await card.getByRole('button', { name: 'Editar ' + title }).click()
    await page.getByLabel('Enlace (opcional)').fill(product)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect.poll(() => page.getByRole('img', { name: title, exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()

    await login(page, 'bruno@example.test')
    await page.goto('/family/' + wish.user_id)
    card = await wishCard(page, title)
    await card.scrollIntoViewIfNeeded()
    await expect.poll(() => card.getByRole('img', { name: title, exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(0)
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await card.scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(card.getByRole('button', { name: 'Me lo pido' })).toBeVisible()
      if (width === 390) await page.screenshot({ path: 'artifacts/product-images-5830/family-390.png' })
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await card.getByRole('button', { name: 'Me lo pido' }).focus()
    await page.keyboard.press('Enter')
    await expect(card.getByText('Lo regalo yo', { exact: false })).toBeVisible()
    await card.getByRole('button', { name: 'Quitar', exact: true }).click()
    await expect(card.getByRole('button', { name: 'Me lo pido' })).toBeVisible()
  } finally {
    await login(page)
    await page.request.delete('/api/wishes?id=' + wish.id)
    await page.request.delete('/api/wishes?id=' + fallback.id)
    await writeFile('artifacts/product-images-5830/responsive-metrics.json', JSON.stringify(metrics, null, 2))
  }
})

test('new wishes and surprise gifts reuse the product image without changing privacy', async ({ page }) => {
  await login(page)
  await page.goto('/my-wishes')
  await page.getByLabel('¿Qué te gustaría recibir?').fill('Altavoces añadidos desde el formulario')
  await page.getByLabel('Enlace (opcional)').fill(product)
  await page.getByRole('button', { name: 'Añadir a mi carta' }).tap()
  const card = await wishCard(page, 'Altavoces añadidos desde el formulario')
  await card.scrollIntoViewIfNeeded()
  await expect.poll(() => card.getByRole('img', { name: 'Altavoces añadidos desde el formulario', exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(0)
  const wishes = (await (await page.request.get('/api/wishes')).json()).data
  const created = wishes.find((wish: { title: string }) => wish.title === 'Altavoces añadidos desde el formulario')
  const users = (await (await page.request.get('/api/users')).json()).data
  const recipient = users.find((user: { email: string }) => user.email === 'clara@example.test')
  let surpriseId: string | undefined
  try {
    const surprise = await page.request.post('/api/surprise-gifts', { data: { recipient_id: recipient.id, title: 'Altavoces sorpresa con foto', url: product } })
    expect(surprise.status()).toBe(200)
    surpriseId = (await surprise.json()).data.id
    await page.goto('/family/' + recipient.id)
    const surpriseCard = await wishCard(page, 'Altavoces sorpresa con foto')
    await surpriseCard.scrollIntoViewIfNeeded()
    await expect.poll(() => surpriseCard.getByRole('img', { name: 'Altavoces sorpresa con foto', exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(0)
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(surpriseCard.getByRole('button', { name: 'Eliminar Altavoces sorpresa con foto' })).toBeVisible()
    await login(page, 'clara@example.test')
    expect((await (await page.request.get('/api/surprise-gifts?recipient_id=' + recipient.id)).json()).data).toEqual([])
  } finally {
    await login(page)
    if (surpriseId) await page.request.delete('/api/surprise-gifts?id=' + surpriseId)
    await page.request.delete('/api/wishes?id=' + created.id)
  }
})

test('pending and failed images reserve their space and do not block the card', async ({ page }) => {
  await login(page)
  const created = await page.request.post('/api/wishes', { data: { title: 'Producto con espera', url: product } })
  const wish = (await created.json()).data
  let release: () => void = () => {}
  const wait = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/product-image?*', async (route) => { await wait; await route.fulfill({ status: 404 }) })
  try {
    await page.goto('/my-wishes')
    const card = await wishCard(page, 'Producto con espera')
    await card.scrollIntoViewIfNeeded()
    await expect(card.getByRole('img', { name: 'Cargando imagen del producto' })).toBeVisible()
    const before = await card.boundingBox()
    await page.screenshot({ path: 'artifacts/product-images-5830/image-loading.png' })
    release()
    await expect(card.getByRole('img', { name: 'Sin imagen del producto' })).toBeVisible()
    expect(await card.boundingBox()).toEqual(before)
    await expect(card.getByRole('link', { name: 'Ver enlace' })).toBeVisible()
    await page.screenshot({ path: 'artifacts/product-images-5830/image-unavailable.png' })
  } finally {
    release()
    await page.unrouteAll({ behavior: 'wait' })
    await page.request.delete('/api/wishes?id=' + wish.id)
  }
})
