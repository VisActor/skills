import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'vbi-runtime-cli-'))
const htmlFile = join(directory, 'dashboard.html')
writeFileSync(htmlFile, '<h1>Inventory</h1><meta content="__VBI_SESSION_TOKEN__">')
after(() => rmSync(directory, { recursive: true, force: true }))

function start(port = '0') {
  const env = {
    ...process.env,
    VBI_PORT: port,
    VBI_MYSQL_USER: 'reader',
    VBI_MYSQL_DATABASE: 'analytics',
    VBI_MYSQL_TABLE: 'stock',
  }
  if (port === null) delete env.VBI_PORT
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url)), htmlFile], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = '',
    stderr = ''
  child.stdout.setEncoding('utf8').on('data', (chunk) => {
    stdout += chunk
  })
  child.stderr.setEncoding('utf8').on('data', (chunk) => {
    stderr += chunk
  })
  const ready = new Promise((resolve, reject) => {
    child.stdout.on('data', () => {
      const url = stdout.match(/http:\/\/127\.0\.0\.1:\d+\/dashboard\.html/)
      if (url) resolve(url[0])
    })
    child.once('error', reject)
    child.once('exit', (code) => reject(new Error(`Runtime exited before listening: ${code} ${stderr}`)))
  })
  // Conflicting listeners intentionally exit before announcing readiness.
  ready.catch(() => {})
  return { child, ready, error: () => stderr }
}

test('CLI serves the dashboard, rejects occupied ports, and closes on termination', { timeout: 10000 }, async () => {
  const first = start()
  try {
    const url = await first.ready
    const response = await fetch(url)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /Inventory/)
    const conflict = start(new URL(url).port)
    const [code] = await once(conflict.child, 'exit')
    assert.equal(code, 1)
    assert.match(conflict.error(), /EADDRINUSE/)
  } finally {
    first.child.kill('SIGTERM')
    await once(first.child, 'exit')
  }
})

test('CLI uses its default port and module imports do not start a server', { timeout: 10000 }, async () => {
  const defaultPort = start(null)
  try {
    await defaultPort.ready
    defaultPort.child.kill('SIGINT')
    await once(defaultPort.child, 'exit')
  } catch {
    assert.match(defaultPort.error(), /EADDRINUSE/)
  }
  const url = new URL('../server.mjs', import.meta.url).href
  const imported = spawn(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(url)})`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  imported.stdout.on('data', (chunk) => {
    output += chunk
  })
  const [code] = await once(imported, 'exit')
  assert.equal(code, 0)
  assert.equal(output, '')
})
