import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'
import { PassThrough } from 'node:stream'
import { EventEmitter } from 'node:events'
import { extractProductImage, isPublicAddress, productUrl, loadProductImage } from '../src/lib/product-image.ts'

test('selects product metadata, decodes attributes and resolves relative URLs', () => {
  assert.equal(extractProductImage(`<meta content='/speaker.jpg?a=1&amp;b=2' property='og:image'>`, 'https://shop.example/p/1'), 'https://shop.example/speaker.jpg?a=1&b=2')
  assert.equal(extractProductImage(`<meta name="twitter:image" content="//cdn.example/t.jpg"><meta property="og:image" content="/og.jpg">`, 'https://shop.example/p'), 'https://shop.example/og.jpg')
  assert.equal(extractProductImage('<meta name=twitter:image content=/t.jpg>', 'https://shop.example/p'), 'https://shop.example/t.jpg')
  assert.equal(extractProductImage('<link itemprop="image" href="../micro.jpg">', 'https://shop.example/p/1'), 'https://shop.example/micro.jpg')
  assert.equal(extractProductImage('<img id="landingImage" data-old-hires="https://cdn.example/amazon.jpg">', 'https://shop.example/p'), 'https://cdn.example/amazon.jpg')
  assert.equal(extractProductImage(`<script type="application/ld+json">{"@graph":[{"@type":"Product","image":[{"contentUrl":"/schema.jpg"}]}]}</script>`, 'https://shop.example/p'), 'https://shop.example/schema.jpg')
})

test('ignores logos, scripts and comments; tolerates missing or malformed metadata', () => {
  for (const html of ['', '<img src="/logo.jpg">', '<!-- <meta property="og:image" content="/bad.jpg"> -->', '<script>"<meta property=og:image content=/bad.jpg>"</script>', '<script type="application/ld+json">broken</script>']) {
    assert.equal(extractProductImage(html, 'https://shop.example/p'), null)
  }
  assert.equal(extractProductImage('<meta property="og:image" content=""><meta name="twitter:image" content="/valid.jpg">', 'https://shop.example/p'), 'https://shop.example/valid.jpg')
  assert.equal(extractProductImage('<meta property="og:image" content="file:///secret"><meta name="twitter:image" content="/valid.jpg">', 'https://shop.example/p'), 'https://shop.example/valid.jpg')
})

test('rejects private/reserved IPs, IPv4 encodings, mapped IPv6, credentials and unsafe protocols', () => {
  for (const address of ['0.0.0.0', '10.1.2.3', '127.0.0.1', '100.100.100.200', '169.254.169.254', '172.16.1.2', '192.168.1.1', '192.0.2.1', '198.18.1.1', '224.0.0.1', '255.255.255.255', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '2001:db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(address), false, address)
  for (const address of ['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111']) assert.equal(isPublicAddress(address), true, address)
  for (const url of ['http://127.1/p', 'http://2130706433/p', 'http://0x7f000001/p', 'http://[::ffff:127.0.0.1]/', 'http://localhost/p', 'https://a.localhost/', 'https://user:pass@shop.example/', 'https://shop.example:8443/', 'file:///secret', 'data:image/png,test', 'javascript:alert(1)']) assert.throws(() => productUrl(url), undefined, url)
})

test('pins validated DNS, checks redirects and image destinations, and bounds remote responses', async (t) => {
  const responses = []
  const calls = []
  mock.method(dns, 'lookup', async (host) => host === 'private.example' ? [{ address: '127.0.0.1', family: 4 }] : [{ address: '1.1.1.1', family: 4 }])
  const handler = (url, options, callback) => {
    calls.push(url.href)
    assert.equal(options.family, 4)
    options.lookup(url.hostname, {}, (error, address, family) => { assert.equal(error, null); assert.equal(address, '1.1.1.1'); assert.equal(family, 4) })
    const req = new EventEmitter()
    req.end = () => queueMicrotask(() => {
      const next = responses.shift()
      assert.ok(next, 'unexpected outgoing request')
      const res = new PassThrough()
      res.statusCode = next.status ?? 200
      res.headers = next.headers ?? { 'content-type': 'text/html' }
      callback(res)
      if (!res.destroyed) res.end(next.body ?? '')
    })
    return req
  }
  mock.method(http, 'request', handler)
  mock.method(https, 'request', handler)
  syncBuiltinESMExports()
  const signal = AbortSignal.timeout(10000)
  try {
    await t.test('short link, relative image, binary image body', async () => {
      responses.push({ status: 302, headers: { location: 'https://shop.example/product' } }, { body: '<meta property="og:image" content="/photo.png">' }, { headers: { 'content-type': 'image/png' }, body: Buffer.from([137, 80, 78, 71]) })
      const image = await loadProductImage('https://short.example/a', signal)
      assert.equal(image.type, 'image/png'); assert.equal(image.body.length, 4)
      assert.equal(image.url, 'https://shop.example/photo.png')
    })
    await t.test('private DNS before connecting', async () => {
      const count = calls.length
      await assert.rejects(loadProductImage('https://private.example/product', signal), /Private address/)
      assert.equal(calls.length, count)
    })
    await t.test('private redirect and private image DNS', async () => {
      responses.push({ status: 302, headers: { location: 'http://169.254.169.254/latest' } })
      await assert.rejects(loadProductImage('https://shop.example/product', signal), /Private URL/)
      responses.push({ body: '<meta property="og:image" content="https://private.example/image.png">' })
      await assert.rejects(loadProductImage('https://shop.example/product', signal), /Private address/)
    })
    await t.test('Amazon short links resolve to public mobile metadata instead of the unavailable desktop route', async () => {
      const before = calls.length
      responses.push({ status: 301, headers: { location: 'https://www.amazon.es/product-title/dp/B0G3N54XSC/ref=share?tag=example' } }, { body: '<meta property="og:image" content="https://m.media-amazon.com/images/I/product.jpg">' }, { headers: { 'content-type': 'image/jpeg' }, body: Buffer.from([255, 216, 255]) })
      const image = await loadProductImage('https://amzn.eu/d/example', signal)
      assert.equal(image.type, 'image/jpeg')
      assert.deepEqual(calls.slice(before), ['https://amzn.eu/d/example', 'https://www.amazon.es/gp/aw/d/B0G3N54XSC', 'https://m.media-amazon.com/images/I/product.jpg'])
    })
    await t.test('direct Amazon links normalize safely while other hosts remain unchanged', async () => {
      for (const [input, expected] of [
        ['https://www.amazon.es/gp/product/b0dxw25r3d?th=1', 'https://www.amazon.es/gp/aw/d/B0DXW25R3D'],
        ['https://amazon.co.uk/dp/B0DXW25R3D', 'https://amazon.co.uk/gp/aw/d/B0DXW25R3D'],
        ['https://www.amazon.es/gp/aw/d/B0DXW25R3D', 'https://www.amazon.es/gp/aw/d/B0DXW25R3D'],
        ['https://www.amazon.es.evil.example/dp/B0DXW25R3D?x=1', 'https://www.amazon.es.evil.example/dp/B0DXW25R3D?x=1'],
        ['https://shop.example/dp/B0DXW25R3D', 'https://shop.example/dp/B0DXW25R3D'],
      ]) {
        const before = calls.length
        responses.push({ body: '<h1>No product metadata</h1>' })
        assert.equal(await loadProductImage(input, signal), null)
        assert.equal(calls[before], expected)
      }
    })
    await t.test('missing image, SVG, large body and aborted requests', async () => {
      responses.push({ body: '<h1>No image</h1>' })
      assert.equal(await loadProductImage('https://shop.example/product', signal), null)
      responses.push({ headers: { 'content-type': 'image/svg+xml' }, body: '<svg/>' })
      await assert.rejects(loadProductImage('https://shop.example/product', signal), /Unsupported response/)
      responses.push({ body: Buffer.alloc(2 * 1024 * 1024 + 1) })
      assert.equal(await loadProductImage('https://shop.example/product', signal), null)
      responses.push({ headers: { 'content-type': 'image/png' }, body: Buffer.alloc(2 * 1024 * 1024 + 1) })
      await assert.rejects(loadProductImage('https://shop.example/product', signal), /Resource too large/)
      responses.push({ headers: { 'content-type': 'text/html', 'content-length': '3000000' }, body: '<meta property="og:image" content="/image.png">' + ' '.repeat(2 * 1024 * 1024) }, { headers: { 'content-type': 'image/png' }, body: Buffer.from([137, 80, 78, 71]) })
      assert.equal((await loadProductImage('https://shop.example/product', signal)).body.length, 4)
      await assert.rejects(loadProductImage('https://shop.example/product', AbortSignal.abort()))
    })
  } finally { mock.restoreAll(); syncBuiltinESMExports() }
})
