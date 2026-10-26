import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSource } from '../source.mjs'
import { QueryError } from '../errors.mjs'
import { startDashboard } from '../server.mjs'

const schema = [
  { name: 'category', type: 'string' },
  { name: 'amount', type: 'number' },
]
const rows = [
  { category: 'A', amount: 2 },
  { category: 'B', amount: 5 },
  { category: 'A', amount: 3 },
]
const query = {
  select: [{ field: 'amount', alias: 'total', aggr: { func: 'sum' } }],
  where: { op: 'and', conditions: [{ field: 'category', op: '=', value: 'A' }] },
}
const fileEnv = (file) => ({
  VBI_SOURCE_TYPE: 'file',
  VBI_SOURCE_FILE: file,
  VBI_SOURCE_SCHEMA: JSON.stringify(schema),
})

async function directory(t) {
  const dir = await mkdtemp(join(tmpdir(), 'vbi-server-source-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}

async function upstream(t, handler) {
  const server = createServer(handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )
  return `http://127.0.0.1:${server.address().port}`
}

test('local JSON and CSV use VQuery filtering and aggregation and reload once per batch', async (t) => {
  const dir = await directory(t)
  const file = join(dir, 'rows.json')
  await writeFile(file, JSON.stringify(rows))
  const source = await createSource(fileEnv(file))
  assert.equal((await source.context()).sourceId, 'local-data')
  assert.deepEqual((await source.context()).schema, schema)
  assert.ok(Number.isFinite(Date.parse((await source.context()).now)))
  assert.deepEqual(await source.query([query, { select: ['category', 'amount'], limit: 1 }]), [
    { dataset: [{ total: 5 }] },
    { dataset: [rows[0]] },
  ])
  await writeFile(file, JSON.stringify([{ category: 'A', amount: 9 }]))
  assert.deepEqual(await source.query([query]), [{ dataset: [{ total: 9 }] }])
  await source.close()
  const csv = join(dir, 'rows.csv')
  await writeFile(csv, 'category,amount\nA,2\nB,5\nA,3\n')
  const csvSource = await createSource({ ...fileEnv(csv), VBI_SOURCE_ID: 'csv-data' })
  assert.equal((await csvSource.context()).sourceId, 'csv-data')
  assert.deepEqual(await csvSource.query([query]), [{ dataset: [{ total: 5 }] }])
  await writeFile(csv, '')
  assert.deepEqual(await csvSource.query([{ select: ['category'] }]), [{ dataset: [] }])
  await csvSource.close()
})

test('JSON Pointer resolves wrapped rows and escaped property names', async (t) => {
  const file = join(await directory(t), 'wrapped.json')
  await writeFile(file, JSON.stringify({ data: { 'rows/~': rows } }))
  const source = await createSource({ ...fileEnv(file), VBI_SOURCE_ROWS_POINTER: '/data/rows~1~0' })
  assert.deepEqual(await source.query([query]), [{ dataset: [{ total: 5 }] }])
  for (const value of [{}, [null], [[1]], [1], [{ data: [] }]]) {
    await writeFile(file, JSON.stringify(value))
    await assert.rejects(source.query([query]), /array of row objects/)
  }
  await source.close()
})

test('HTTP reads a configured upstream without CORS headers; headers/body stay on the server', async (t) => {
  let requests = 0
  const url = await upstream(t, async (req, res) => {
    requests++
    assert.equal(req.method, 'POST')
    assert.equal(req.headers.authorization, 'Bearer private-token')
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    assert.equal(Buffer.concat(chunks).toString(), '{"range":"current"}')
    res.end(JSON.stringify({ data: rows }))
  })
  const source = await createSource({
    VBI_SOURCE_TYPE: 'http',
    VBI_SOURCE_SCHEMA: JSON.stringify(schema),
    VBI_HTTP_URL: url,
    VBI_HTTP_METHOD: 'POST',
    VBI_HTTP_HEADERS: '{"Authorization":"Bearer private-token"}',
    VBI_HTTP_BODY: '{"range":"current"}',
    VBI_SOURCE_ROWS_POINTER: '/data',
  })
  assert.ok(!JSON.stringify(await source.context()).includes('private-token'))
  assert.deepEqual(await source.query([query, query]), [{ dataset: [{ total: 5 }] }, { dataset: [{ total: 5 }] }])
  assert.equal(requests, 1)
  await source.close()
})

test('HTTP defaults to GET and handles CSV, empty responses, failures and redirects', async (t) => {
  const url = await upstream(t, (req, res) => {
    assert.equal(req.method, 'GET')
    if (req.url === '/failed') {
      res.writeHead(500)
      return res.end('private error')
    }
    if (req.url === '/empty') {
      res.writeHead(204)
      return res.end()
    }
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/csv' })
      return res.end()
    }
    res.end('category,amount\nA,2\nA,3\n')
  })
  const env = { VBI_SOURCE_TYPE: 'http', VBI_SOURCE_SCHEMA: JSON.stringify(schema), VBI_SOURCE_FORMAT: 'csv' }
  const source = await createSource({ ...env, VBI_HTTP_URL: url + '/csv' })
  assert.deepEqual(await source.query([query]), [{ dataset: [{ total: 5 }] }])
  for (const path of ['/failed', '/empty', '/redirect']) {
    const failed = await createSource({ ...env, VBI_HTTP_URL: url + path })
    await assert.rejects(failed.query([query]))
    await failed.close()
  }
  await source.close()
})

test('invalid source configuration fails explicitly without echoing credentials', async () => {
  for (const value of [
    'invalid',
    '{}',
    '[]',
    '[null]',
    '[{"name":"x","type":"binary"}]',
    '[{"name":4,"type":"number"}]',
    '[{"name":"","type":"number"}]',
    JSON.stringify([...schema, schema[0]]),
  ]) {
    await assert.rejects(createSource({ ...fileEnv('/unused.json'), VBI_SOURCE_SCHEMA: value }), /VBI_SOURCE_SCHEMA/)
  }
  for (const config of [
    { VBI_SOURCE_FILE: undefined },
    { VBI_SOURCE_FORMAT: 'xml' },
    { VBI_SOURCE_ROWS_POINTER: 'data' },
    { VBI_SOURCE_ROWS_POINTER: '/~2' },
    { VBI_SOURCE_FORMAT: 'csv', VBI_SOURCE_ROWS_POINTER: '/data' },
  ])
    await assert.rejects(createSource({ ...fileEnv('/unused.json'), ...config }))
  const http = { VBI_SOURCE_TYPE: 'http', VBI_SOURCE_SCHEMA: JSON.stringify(schema), VBI_HTTP_URL: 'http://127.0.0.1' }
  await assert.rejects(createSource({ ...http, VBI_HTTP_URL: 'file:///tmp/private.json' }), /HTTP or HTTPS/)
  await assert.rejects(createSource({ ...http, VBI_HTTP_URL: 'invalid private-token URL' }), (error) => {
    assert.equal(error.input, undefined)
    assert.ok(!error.message.includes('private-token'))
    return true
  })
  for (const headers of ['private-token', 'null', '[]', '1', '{"Authorization":42}']) {
    await assert.rejects(createSource({ ...http, VBI_HTTP_HEADERS: headers }), (error) => {
      assert.ok(!error.message.includes('private-token'))
      return true
    })
  }
  await assert.rejects(createSource({ VBI_SOURCE_TYPE: 'unknown' }), /VBI_SOURCE_TYPE/)
})

test('query validation precedes data loading and oversized data is rejected', async (t) => {
  const dir = await directory(t)
  const file = join(dir, 'large.json')
  const source = await createSource(fileEnv(file))
  for (const queries of [undefined, [], Array(11).fill(query)]) {
    await assert.rejects(source.query(queries), QueryError)
  }
  await assert.rejects(source.query([{ select: [{ field: 'amount', aggr: { func: 'unsupported' } }] }]), QueryError)
  await assert.rejects(source.query([query]), /ENOENT/)
  await writeFile(file, Buffer.alloc(8 * 1024 * 1024 + 1, ' '))
  await assert.rejects(source.query([query]), /8 MiB/)
  await source.close()
})

test('custom adapters support other local databases and HTTP protocols', async (t) => {
  const dir = await directory(t)
  const module = join(dir, 'custom.mjs')
  await writeFile(
    module,
    'export function createSource(env) { return { context: async () => ({sourceId: env.ID}), query: async () => [{dataset: [{total: 7}]}], close: async () => {} } }',
  )
  const source = await createSource({ VBI_SOURCE_TYPE: 'module', VBI_SOURCE_MODULE: module, ID: 'custom-data' })
  assert.equal((await source.context()).sourceId, 'custom-data')
  assert.deepEqual(await source.query([query]), [{ dataset: [{ total: 7 }] }])
  await source.close()
  await assert.rejects(createSource({ VBI_SOURCE_TYPE: 'module' }), /VBI_SOURCE_MODULE/)
  for (const [name, value] of [
    ['empty', 'null'],
    ['missing', '{}'],
  ]) {
    const file = join(dir, name + '.mjs')
    await writeFile(file, `export const createSource = () => ${value === '{}' ? '({})' : value}`)
    await assert.rejects(createSource({ VBI_SOURCE_TYPE: 'module', VBI_SOURCE_MODULE: file }), /must implement/)
  }
})

test('file-backed startup serves the same context/query protocol and closes cleanly', async (t) => {
  const dir = await directory(t)
  const file = join(dir, 'rows.json')
  const html = join(dir, 'page.html')
  await writeFile(file, JSON.stringify(rows))
  await writeFile(html, '<meta name="vbi-session" content="__VBI_SESSION_TOKEN__">')
  const server = await startDashboard(html, { ...fileEnv(file), VBI_PORT: '0' })
  await once(server, 'listening')
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )
  const url = `http://127.0.0.1:${server.address().port}`
  const page = await (await fetch(url)).text()
  const token = page.match(/content="([^"]+)"/)[1]
  const context = await (await fetch(url + '/api/context', { headers: { 'X-VBI-Token': token } })).json()
  assert.deepEqual(context.schema, schema)
  const result = await (
    await fetch(url + '/api/query', {
      method: 'POST',
      headers: { 'X-VBI-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: [query] }),
    })
  ).json()
  assert.deepEqual(result, { results: [{ dataset: [{ total: 5 }] }] })
})

test('source factory can use the process environment', async (t) => {
  const file = join(await directory(t), 'empty.json')
  await writeFile(file, '[]')
  const env = fileEnv(file)
  const saved = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
  Object.assign(process.env, env)
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  const source = await createSource()
  assert.deepEqual(await source.query([query]), [{ dataset: [{ total: null }] }])
  await source.close()
})
