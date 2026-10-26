import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDatabase } from '../database.mjs'
import { QueryError } from '../errors.mjs'
const columns = [
  { Field: 'id', Type: 'bigint unsigned' },
  { Field: 'quantity', Type: 'decimal(12,2)' },
  { Field: 'category', Type: 'varchar(80)' },
  { Field: 'occurred_at', Type: 'DATETIME(3)' },
  { Field: 'record_date', Type: 'date' },
  { Field: 'updated_at', Type: 'timestamp' },
]
const schema = [
  { name: 'id', type: 'number' },
  { name: 'quantity', type: 'number' },
  { name: 'category', type: 'string' },
  { name: 'occurred_at', type: 'datetime' },
  { name: 'record_date', type: 'date' },
  { name: 'updated_at', type: 'timestamp' },
]
function fixture(options = {}) {
  const calls = []
  const bindings = []
  let config
  const connection = {
    async query(sql, parameters) {
      calls.push(sql)
      bindings.push(parameters)
      if (sql.startsWith('SHOW')) return [options.missing ? [] : columns]
      if (sql.startsWith('SELECT DATE')) return [[{ now: '2026-10-12 19:00:00.000000' }]]
      return []
    },
    async execute(sql, params) {
      calls.push({ sql, params })
      if (options.failure) throw Error('unavailable')
      return [[{ quantity: 123.45 }]]
    },
    async commit() {
      calls.push('commit')
    },
    async rollback() {
      calls.push('rollback')
    },
    release() {
      calls.push('release')
    },
  }
  const db = createDatabase(
    { VBI_MYSQL_USER: 'reader', VBI_MYSQL_DATABASE: 'analytics', VBI_MYSQL_TABLE: 'stock-2026', ...options.env },
    (settings) => {
      config = settings
      return { getConnection: async () => connection, end: async () => calls.push('end') }
    },
  )
  return {
    db,
    calls,
    bindings,
    get config() {
      return config
    },
  }
}
test('discovers configured source and releases connections', async () => {
  const f = fixture({
    env: {
      VBI_MYSQL_HOST: 'db',
      VBI_MYSQL_PORT: '3307',
      VBI_MYSQL_USER: 'readonly',
      VBI_MYSQL_PASSWORD: 'secret',
      VBI_MYSQL_DATABASE: 'warehouse',
      VBI_MYSQL_TABLE: 'inventory',
      VBI_MYSQL_TIMEZONE: '+08:00',
    },
  })
  const context = await f.db.context()
  assert.deepEqual(context, { sourceId: 'inventory', schema, now: '2026-10-12 19:00:00.000000' })
  assert.deepEqual(f.bindings[0], ['+08:00'])
  assert.ok(f.calls.includes('SHOW COLUMNS FROM `warehouse`.`inventory`'))
  assert.ok(f.calls.includes('release'))
  assert.equal(f.config.multipleStatements, false)
  assert.equal(f.config.port, 3307)
  assert.ok(!JSON.stringify(context).includes('secret'))
  await f.db.close()
  assert.ok(f.calls.includes('end'))
})
test('rejects a table without readable columns but still releases the connection', async () => {
  const f = fixture({ missing: true })
  await assert.rejects(f.db.context(), /no readable columns/)
  assert.ok(f.calls.includes('release'))
})
test('a dashboard batch uses one read-only snapshot and bound parameters', async () => {
  const f = fixture()
  const result = await f.db.query([
    {
      select: [{ field: 'quantity', aggr: { func: 'sum' }, alias: 'quantity' }],
      where: { field: 'category', op: '=', value: 'office' },
    },
  ])
  assert.deepEqual(result, [{ dataset: [{ quantity: 123.45 }] }])
  assert.ok(f.calls.includes('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'))
  const compiled = f.calls.find((c) => c.params)
  assert.deepEqual(compiled.params, ['office'])
  assert.match(compiled.sql, /`analytics`\.`stock-2026`/)
  assert.deepEqual(f.calls.slice(-2), ['commit', 'release'])
})
test('failed batch rolls back and releases; invalid batches never connect', async () => {
  const f = fixture({ failure: true })
  await assert.rejects(f.db.query([{ select: ['quantity'] }]), /unavailable/)
  assert.deepEqual(f.calls.slice(-2), ['rollback', 'release'])
  for (const input of [null, [], Array(11).fill({}), {}]) await assert.rejects(f.db.query(input), QueryError)
})

test('passes Builder DSL to vquery without injecting or restricting limits', async () => {
  const f = fixture()
  const queries = [{ select: ['id'] }, { select: ['id'], limit: 10001 }]
  await f.db.query(queries)
  const executions = f.calls.filter((call) => call.params)
  assert.doesNotMatch(executions[0].sql, /\blimit\b/i)
  assert.match(executions[1].sql, /limit 10001$/)
  assert.equal(queries[0].limit, undefined)
})

test('invalid DSL is reported before starting a transaction and releases the discovery connection', async () => {
  const f = fixture()
  await assert.rejects(
    f.db.query([{ select: ['quantity'], where: { field: 'quantity', op: 'sleep', value: 1 } }]),
    QueryError,
  )
  assert.ok(!f.calls.includes('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'))
  assert.equal(f.calls.at(-1), 'release')
})

test('source metadata comes from MySQL, is cached across requests and defaults to UTC', async () => {
  const f = fixture()
  const context = await f.db.context()
  assert.equal(context.sourceId, 'stock-2026')
  assert.equal(f.config.database, 'analytics')
  assert.deepEqual(f.bindings[0], ['+00:00'])
  await f.db.query([{ select: ['id'] }])
  await f.db.context()
  assert.equal(f.calls.filter((sql) => typeof sql === 'string' && sql.startsWith('SHOW')).length, 1)
})

test('invalid identifiers and missing accounts fail before creating a pool', () => {
  const env = { VBI_MYSQL_USER: 'reader', VBI_MYSQL_DATABASE: 'analytics', VBI_MYSQL_TABLE: 'stock' }
  const unused = () => assert.fail('Invalid configuration must not create a pool')
  for (const value of [null, 'bad`name', 'x;DROP', '', 'x'.repeat(129)])
    assert.throws(() => createDatabase({ ...env, VBI_MYSQL_TABLE: value }, unused), QueryError)
  assert.throws(() => createDatabase({ ...env, VBI_MYSQL_USER: '' }, unused), /VBI_MYSQL_USER/)
})
