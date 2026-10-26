import { createReadStream } from 'node:fs'
import { resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatasetSourceBuilder, InMemoryQueryAdapter, convertDSLToDuckDB } from '@visactor/vquery'
import { createDatabase } from './database.mjs'
import { QueryError } from './errors.mjs'

const maxBytes = 8 * 1024 * 1024

function jsonConfig(value, name) {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Invalid ${name} JSON`)
  }
}

async function readText(stream) {
  const chunks = []
  let size = 0
  for await (const chunk of stream) {
    size += chunk.length
    if (size > maxBytes) throw new Error('Data source exceeds 8 MiB; narrow the upstream data range')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function createRecordSource(env, type) {
  const schema = jsonConfig(env.VBI_SOURCE_SCHEMA, 'VBI_SOURCE_SCHEMA')
  if (
    !Array.isArray(schema) ||
    !schema.length ||
    schema.some(
      (column) =>
        !column ||
        typeof column.name !== 'string' ||
        !column.name ||
        !['number', 'string', 'date', 'datetime', 'timestamp'].includes(column.type),
    ) ||
    new Set(schema.map((column) => column.name)).size !== schema.length
  ) {
    throw new Error('VBI_SOURCE_SCHEMA must contain unique named columns with supported types')
  }
  const sourceId = env.VBI_SOURCE_ID || 'local-data'
  const format =
    env.VBI_SOURCE_FORMAT ||
    (type === 'file' && extname(env.VBI_SOURCE_FILE || '').toLowerCase() === '.csv' ? 'csv' : 'json')
  if (!['json', 'csv'].includes(format)) throw new Error('VBI_SOURCE_FORMAT must be json or csv')
  const pointer = env.VBI_SOURCE_ROWS_POINTER || ''
  if (pointer && (format !== 'json' || !pointer.startsWith('/') || /~(?![01])/.test(pointer))) {
    throw new Error('VBI_SOURCE_ROWS_POINTER must be a JSON Pointer for JSON data')
  }
  let load
  if (type === 'file') {
    if (!env.VBI_SOURCE_FILE) throw new Error('Set VBI_SOURCE_FILE to a local JSON or CSV file')
    const file = resolve(env.VBI_SOURCE_FILE)
    load = () => readText(createReadStream(file))
  } else {
    let url
    try {
      url = new URL(env.VBI_HTTP_URL)
    } catch {
      throw new Error('Set VBI_HTTP_URL to a valid HTTP or HTTPS address')
    }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('VBI_HTTP_URL must use HTTP or HTTPS')
    const headers = jsonConfig(env.VBI_HTTP_HEADERS || '{}', 'VBI_HTTP_HEADERS')
    if (
      !headers ||
      Array.isArray(headers) ||
      typeof headers !== 'object' ||
      Object.values(headers).some((value) => typeof value !== 'string')
    ) {
      throw new Error('VBI_HTTP_HEADERS must be an object of string values')
    }
    load = async () => {
      const response = await fetch(url, {
        method: env.VBI_HTTP_METHOD || 'GET',
        headers,
        body: env.VBI_HTTP_BODY,
        signal: AbortSignal.timeout(4000),
        redirect: 'error',
      })
      if (!response.ok || !response.body) throw new Error('Upstream data source is unavailable')
      return readText(response.body)
    }
  }
  return {
    async context() {
      return { sourceId, schema, now: new Date().toISOString() }
    },
    async query(queries) {
      if (!Array.isArray(queries) || !queries.length || queries.length > 10)
        throw new QueryError('Expected 1–10 queries')
      let statements
      try {
        statements = queries.map((query) => convertDSLToDuckDB(query, sourceId))
      } catch (error) {
        throw new QueryError(error.message)
      }
      let text = await load()
      if (format === 'json') {
        let rows = JSON.parse(text)
        if (pointer) {
          for (const key of pointer.slice(1).split('/')) rows = rows?.[key.replaceAll('~1', '/').replaceAll('~0', '~')]
        }
        if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
          throw new Error('JSON data must resolve to an array of row objects')
        }
        text = JSON.stringify(rows)
      }
      const adapter = new InMemoryQueryAdapter()
      await adapter.open()
      try {
        await adapter.loadDataset(
          sourceId,
          schema,
          await DatasetSourceBuilder.from({ type: format, rawDataset: text }).build(),
        )
        const results = []
        for (const statement of statements) {
          const result = await adapter.query(statement)
          results.push({ dataset: result.dataset })
        }
        return results
      } finally {
        await adapter.close()
      }
    },
    async close() {},
  }
}

export async function createSource(env = process.env) {
  const type = env.VBI_SOURCE_TYPE || 'mysql'
  if (type === 'mysql') return createDatabase(env)
  if (type === 'file' || type === 'http') return createRecordSource(env, type)
  if (type === 'module') {
    if (!env.VBI_SOURCE_MODULE) throw new Error('Set VBI_SOURCE_MODULE to a local adapter module')
    const module = await import(pathToFileURL(resolve(env.VBI_SOURCE_MODULE)).href)
    const source = await module.createSource(env)
    if (!source || ['context', 'query', 'close'].some((method) => typeof source[method] !== 'function')) {
      throw new Error('Source adapter must implement context(), query(queries) and close()')
    }
    return source
  }
  throw new Error('VBI_SOURCE_TYPE must be mysql, file, http or module')
}
