import { test } from 'node:test'
import { request } from 'node:http'
import assert from 'node:assert/strict'
import { createDashboardServer, loadDashboard, startDashboard } from '../server.mjs'
import { QueryError } from '../errors.mjs'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
const databaseEnv = { VBI_MYSQL_USER: 'reader', VBI_MYSQL_DATABASE: 'analytics', VBI_MYSQL_TABLE: 'stock' }
async function fixture(
  t,
  db = { context: async () => ({ schema: [] }), query: async () => [{ dataset: [{ sales: 12 }] }] },
) {
  const server = createDashboardServer(db, '<meta content="__VBI_SESSION_TOKEN__"><h1>Inventory</h1>', 'test-token')
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )
  const url = `http://127.0.0.1:${server.address().port}`
  return (path, options = {}) => {
    if (options.headers?.Host)
      return new Promise((resolve) => {
        request(url + path, options, (res) => {
          res.resume()
          resolve({ status: res.statusCode })
        }).end()
      })
    return fetch(url + path, options)
  }
}
const auth = { 'X-VBI-Token': 'test-token' }
test('HTML is served separately from credentials and APIs require a session', async (t) => {
  const call = await fixture(t)
  const page = await call('/')
  assert.equal(page.status, 200)
  assert.equal(page.headers.get('cache-control'), 'no-store')
  const html = await page.text()
  assert.match(html, /test-token/)
  assert.match(html, /Inventory/)
  assert.equal((await call('/index.html')).status, 200)
  assert.equal((await call('/favicon.ico')).status, 204)
  assert.equal((await call('/api/context')).status, 403)
  assert.equal((await call('/api/context', { headers: auth })).status, 200)
  assert.equal((await call('/api/context', { headers: { ...auth, Origin: 'https://evil.example' } })).status, 403)
  assert.equal((await call('/api/context', { headers: { ...auth, Host: 'evil.example' } })).status, 403)
  assert.equal((await call('/api/context', { headers: { ...auth, 'Sec-Fetch-Site': 'cross-site' } })).status, 403)
  assert.equal((await call('/.env', { headers: auth })).status, 404)
})
test('batch responses and malformed payloads', async (t) => {
  const call = await fixture(t)
  const post = (body) => ({ method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body })
  assert.deepEqual(await (await call('/api/query', post('{"queries":[{}]}'))).json(), {
    results: [{ dataset: [{ sales: 12 }] }],
  })
  assert.equal((await call('/api/query', post('{'))).status, 400)
  assert.equal((await call('/api/query', post('x'.repeat(70000)))).status, 413)
  assert.equal((await call('/api/query', { method: 'POST', headers: auth, body: '{}' })).status, 415)
})
test('query validation is public but database errors never leak secrets', async (t) => {
  const call = await fixture(t, {
    context: async () => {
      throw Error('password=SECRET')
    },
    query: async () => {
      throw new QueryError('Unsupported query')
    },
  })
  const failed = await call('/api/context', { headers: auth })
  assert.equal(failed.status, 503)
  assert.ok(!(await failed.text()).includes('SECRET'))
  const invalid = await call('/api/query', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: '{"queries":[]}',
  })
  assert.equal(invalid.status, 400)
})

test('concurrent work is bounded and released after completion', async (t) => {
  let started = 0,
    release,
    allStarted
  const ready = new Promise((resolve) => (allStarted = resolve))
  const gate = new Promise((resolve) => (release = resolve))
  const call = await fixture(t, {
    context: async () => {
      if (++started === 3) allStarted()
      await gate
      return { schema: [] }
    },
  })
  const requests = Array.from({ length: 3 }, () => call('/api/context', { headers: auth }))
  await ready
  assert.equal((await call('/api/context', { headers: auth })).status, 429)
  release()
  assert.ok((await Promise.all(requests)).every((r) => r.status === 200))
  assert.equal((await call('/api/context', { headers: auth })).status, 200)
})

async function dashboardFiles(t, json = true) {
  const directory = await mkdtemp(join(tmpdir(), 'vbi-runtime-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await writeFile(
    join(directory, 'inventory.html'),
    '<h1>Inventory</h1><meta content="__VBI_SESSION_TOKEN__">' +
      (json
        ? '<script id="data" type="application/json" data-src="./data.json"></script>'
        : '<script data-src="./unused.json"></script><script type="application/json"></script>'),
  )
  await writeFile(join(directory, 'data.json'), JSON.stringify({ label: '</script><script>unsafe</script>' }))
  return join(directory, 'inventory.html')
}

test('JSON resources resolve relative to the HTML and cannot close their script element', async (t) => {
  const page = await loadDashboard(await dashboardFiles(t))
  assert.equal(page.pagePath, '/inventory.html')
  const data = JSON.parse(page.html.match(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/i)[1])
  assert.equal(data.label, '</script><script>unsafe</script>')
  assert.ok(!page.html.includes('<script>unsafe'))
  assert.ok(!page.html.includes('data-src'))
  const server = createDashboardServer({ context() {}, query() {} }, page.html, 'token', page.pagePath)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const response = await fetch(`http://127.0.0.1:${server.address().port}/inventory.html`)
  assert.match(await response.text(), /Inventory/)
})

test('JSON resources support mixed-case tags and whitespace before the closing bracket', async (t) => {
  const file = await dashboardFiles(t)
  await writeFile(file, '<SCRIPT id="data" TYPE="application/json" DATA-SRC="./data.json"> \n</ScRiPt \t>')
  const page = await loadDashboard(file)
  const content = page.html.match(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/i)[1]
  assert.equal(JSON.parse(content).label, '</script><script>unsafe</script>')
  assert.ok(!/data-src/i.test(page.html))
  assert.ok(!content.includes('<'))
})

test('unrelated scripts are preserved and a missing HTML path fails explicitly', async (t) => {
  const page = await loadDashboard(await dashboardFiles(t, false))
  assert.ok(page.html.includes('data-src="./unused.json"'))
  await assert.rejects(loadDashboard(), /Usage: node server.mjs <dashboard.html>/)
})

test('direct execution requires an HTML path before connecting or listening', async () => {
  await assert.rejects(
    promisify(execFile)(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))]),
    (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Usage: node server.mjs <dashboard.html>/)
      assert.equal(error.stdout, '')
      return true
    },
  )
})

test('programmatic startup serves the configured dashboard and removes signal handlers on shutdown', async (t) => {
  const htmlFile = await dashboardFiles(t)
  const before = process.listenerCount('SIGTERM')
  const saved = Object.fromEntries([...Object.keys(databaseEnv), 'VBI_PORT'].map((key) => [key, process.env[key]]))
  Object.assign(process.env, databaseEnv)
  process.env.VBI_PORT = '0'
  const server = await startDashboard(htmlFile)
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    server.close()
  })
  await once(server, 'listening')
  assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/`)).status, 200)
  const closed = once(server, 'close')
  process.emit('SIGTERM')
  await closed
  assert.equal(process.listenerCount('SIGTERM'), before)
})

test('startup reports an occupied port and releases its lifecycle handlers', async (t) => {
  const htmlFile = await dashboardFiles(t, false)
  const first = createDashboardServer({}, 'Inventory')
  await new Promise((resolve) => first.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => first.close(resolve)))
  const saved = process.exitCode
  const server = await startDashboard(htmlFile, { ...databaseEnv, VBI_PORT: String(first.address().port) })
  const [error] = await once(server, 'error')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(error.code, 'EADDRINUSE')
  assert.equal(process.exitCode, 1)
  process.exitCode = saved
  server.close()
})

test('startup without a port override uses the documented default', async (t) => {
  const saved = process.exitCode
  const server = await startDashboard(await dashboardFiles(t, false), databaseEnv)
  t.after(() => server.close())
  const result = await new Promise((resolve) => {
    server.once('listening', () => resolve('listening'))
    server.once('error', (error) => resolve(error.code))
  })
  if (result === 'listening') assert.equal(server.address().port, 4317)
  else assert.equal(result, 'EADDRINUSE')
  await new Promise((resolve) => setImmediate(resolve))
  process.exitCode = saved
})
