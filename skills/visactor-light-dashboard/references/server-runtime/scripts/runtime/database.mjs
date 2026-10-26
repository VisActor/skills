import mysql from 'mysql2/promise'
import { compileQuery } from '@visactor/vquery'
import { QueryError } from './errors.mjs'
function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new QueryError('Invalid identifier')
  return '`' + value + '`'
}
export function createDatabase(env = process.env, poolFactory = mysql.createPool) {
  const database = env.VBI_MYSQL_DATABASE
  const table = env.VBI_MYSQL_TABLE
  identifier(database)
  identifier(table)
  if (!env.VBI_MYSQL_USER) throw new Error('Set VBI_MYSQL_USER to the database account')
  const pool = poolFactory({
    host: env.VBI_MYSQL_HOST || '127.0.0.1',
    port: Number(env.VBI_MYSQL_PORT || 3306),
    user: env.VBI_MYSQL_USER,
    password: env.VBI_MYSQL_PASSWORD || '',
    database,
    connectionLimit: 3,
    waitForConnections: true,
    queueLimit: 12,
    connectTimeout: 4000,
    decimalNumbers: true,
    dateStrings: true,
    multipleStatements: false,
  })
  let schema
  async function discoverSchema(connection) {
    if (!schema) {
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${identifier(database)}.${identifier(table)}`)
      if (!columns.length) throw new Error('Configured table has no readable columns')
      schema = columns.map(({ Field, Type }) => {
        const type = Type.split(/[ (]/)[0].toLowerCase()
        return {
          name: Field,
          type: ['date', 'datetime', 'timestamp'].includes(type)
            ? type
            : /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|bit|year)$/.test(type)
              ? 'number'
              : 'string',
        }
      })
    }
    return schema
  }
  async function session(callback) {
    const connection = await pool.getConnection()
    try {
      await connection.query('SET time_zone = ?', [env.VBI_MYSQL_TIMEZONE || '+00:00'])
      return await callback(connection)
    } finally {
      connection.release()
    }
  }
  return {
    async context() {
      return session(async (c) => {
        const columns = await discoverSchema(c)
        const [[clock]] = await c.query("SELECT DATE_FORMAT(NOW(3), '%Y-%m-%d %H:%i:%s.%f') AS now")
        return {
          sourceId: table,
          schema: columns,
          now: clock.now,
        }
      })
    },
    async query(queries) {
      if (!Array.isArray(queries) || !queries.length || queries.length > 10)
        throw new QueryError('Expected 1–10 queries')
      return session(async (c) => {
        const columns = await discoverSchema(c)
        let compiled
        try {
          compiled = queries.map((q) => compileQuery(q, { table: { database, name: table }, columns }))
        } catch (error) {
          throw new QueryError(error.message)
        }
        await c.query('SET SESSION MAX_EXECUTION_TIME = 4000')
        await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')
        await c.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY')
        try {
          const results = []
          for (const { sql, parameters } of compiled) {
            const [dataset] = await c.execute(sql, parameters)
            results.push({ dataset })
          }
          await c.commit()
          return results
        } catch (error) {
          await c.rollback()
          throw error
        }
      })
    },
    close: () => pool.end(),
  }
}
