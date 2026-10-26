import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { basename, resolve } from 'node:path'
import { createSource } from './source.mjs'
import { QueryError } from './errors.mjs'

export async function loadDashboard(htmlFile) {
  if (!htmlFile) throw new Error('Usage: node server.mjs <dashboard.html>')
  const url = pathToFileURL(resolve(htmlFile))
  let html = await readFile(url, 'utf8')
  for (const [block, attributes] of html.matchAll(/<script\b([^>]*)>\s*<\/script\s*>/gi)) {
    const path = attributes.match(/\bdata-src="([^"]+)"/i)?.[1]
    if (!/\btype="application\/json"/i.test(attributes) || !path) continue
    const data = JSON.parse(await readFile(new URL(path, url), 'utf8'))
    html = html.replace(
      block,
      `<script${attributes.replace(/\s+data-src="[^"]+"/i, '')}>${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`,
    )
  }
  return { html, pagePath: '/' + encodeURIComponent(basename(fileURLToPath(url))) }
}

export function createDashboardServer(source, html, token = randomBytes(32).toString('hex'), pagePath = '/index.html') {
  let active = 0
  return createServer(async (req, res) => {
    const address = `127.0.0.1:${req.socket.localPort}`
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Frame-Options', 'DENY')
    const json = (status, value) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(value))
    }
    if (
      req.headers.host !== address ||
      (req.headers.origin && req.headers.origin !== `http://${address}`) ||
      req.headers['sec-fetch-site'] === 'cross-site'
    )
      return json(403, { error: 'Only same-origin local access is allowed' })
    const path = req.url?.split('?')[0]
    if (req.method === 'GET' && ['/', pagePath].includes(path)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      return res.end(html.replaceAll('__VBI_SESSION_TOKEN__', token))
    }
    if (path === '/favicon.ico') {
      res.writeHead(204)
      return res.end()
    }
    const provided = req.headers['x-vbi-token']
    if (
      typeof provided !== 'string' ||
      Buffer.byteLength(provided) !== Buffer.byteLength(token) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(token))
    )
      return json(403, { error: 'Invalid local session; reload the page' })
    if (active >= 3) return json(429, { error: 'Queries are busy; try again shortly' })
    active++
    try {
      if (req.method === 'GET' && path === '/api/context') return json(200, await source.context())
      if (req.method === 'POST' && path === '/api/query') {
        if (req.headers['content-type'] !== 'application/json') return json(415, { error: 'Expected application/json' })
        const chunks = []
        let bytes = 0
        for await (const chunk of req) {
          bytes += chunk.length
          if (bytes > 65536) {
            json(413, { error: 'Query too large' })
            return
          }
          chunks.push(chunk)
        }
        let payload
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          return json(400, { error: 'Invalid JSON' })
        }
        return json(200, { results: await source.query(payload?.queries) })
      }
      return json(404, { error: 'Not found' })
    } catch (error) {
      if (error instanceof QueryError) return json(400, { error: error.message })
      console.error('Data source request failed:', error.code || error.name)
      json(503, { error: '数据源暂不可用，请检查本地服务与连接配置；已保留上次结果。' })
    } finally {
      active--
    }
  })
}
export async function startDashboard(htmlFile, env = process.env) {
  const { html, pagePath } = await loadDashboard(htmlFile)
  const source = await createSource(env)
  const server = createDashboardServer(source, html, undefined, pagePath)
  const port = Number(env.VBI_PORT || 4317)
  server.requestTimeout = 10000
  server.on('error', async (error) => {
    console.error(`Local service failed: ${error.code}`)
    await source.close()
    process.exitCode = 1
  })
  server.listen(port, '127.0.0.1', () =>
    console.log(
      `Dashboard: http://127.0.0.1:${server.address().port}${pagePath}\nStop with Ctrl+C. Data source credentials remain in this process.`,
    ),
  )
  const stop = () => {
    server.close(async () => {
      await source.close()
    })
    server.closeIdleConnections()
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, stop)
  server.once('close', () => {
    for (const signal of ['SIGINT', 'SIGTERM']) process.removeListener(signal, stop)
  })
  return server
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await startDashboard(process.argv[2])
