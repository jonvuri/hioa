import { PWBWorker } from 'promise-worker-bi'
import sqlite3InitModule, {
  OpfsDatabase,
  PreparedStatement,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm'

import { ClientMessage, UpdateInfo, WorkerMessage } from './types'

type Sql = string

const promiseWorker = new PWBWorker()

const sendLog = (...args: string[]) =>
  promiseWorker.postMessage({ type: 'log', payload: args.join(' ') } as WorkerMessage)
const sendError = (...args: string[]) =>
  promiseWorker.postMessage({ type: 'error', payload: args.join(' ') } as WorkerMessage)

const sendSubscribedQueryResult = (sql: Sql, rows: unknown[], update_info?: UpdateInfo) =>
  promiseWorker.postMessage({
    type: 'subscribed-query-result',
    payload: { sql, rows, update_info },
  } as WorkerMessage)

const sendSubscribedQueryError = (sql: Sql, error: string) =>
  promiseWorker.postMessage({
    type: 'subscribed-query-error',
    payload: { sql, error },
  } as WorkerMessage)

const statements: Record<Sql, PreparedStatement> = {}

const runStatement = (sql: Sql, updateInfo?: UpdateInfo) => {
  try {
    const statement = statements[sql]
    if (!statement) {
      return
    }

    const columnNames = statement.getColumnNames()
    const hasDuplicates = new Set(columnNames).size !== columnNames.length
    if (hasDuplicates) {
      sendSubscribedQueryError(
        sql,
        'Duplicate column names are not supported in subscribed queries',
      )
      return
    }

    const rows = []
    while (statement.step()) {
      rows.push(statement.get({}))
    }

    sendSubscribedQueryResult(sql, rows, updateInfo)
  } catch (err: unknown) {
    if (err instanceof Error) {
      sendSubscribedQueryError(sql, err.message)
    } else {
      sendSubscribedQueryError(sql, String(err))
    }
  }
}

// TODO: Parse SQL to determine which tables are being queried and only subscribe to those
// Or take in list of tables from client
const addStatement = (db: OpfsDatabase, sql: Sql) => {
  if (statements[sql]) {
    return
  }

  statements[sql] = db.prepare(sql)
}

const removeStatement = (sql: Sql) => {
  const statement = statements[sql]

  if (!statement) {
    return
  }

  delete statements[sql]

  statement.finalize()
}

let dbReady: (db: OpfsDatabase) => void = () => {
  throw new Error('Db ready called before promise instantiation')
}
const getDb = new Promise<OpfsDatabase>((resolve) => {
  dbReady = resolve
})

promiseWorker.register(async (msg: unknown) => {
  const message = msg as ClientMessage

  const db = await getDb

  switch (message.type) {
    case 'query':
      try {
        return db.exec({
          sql: message.payload.sql,
          bind: message.payload.bindParams,
          returnValue: 'resultRows',
          rowMode: 'object',
        })
      } catch (error) {
        sendError(`Error running query: ${message.payload}\n${error}`)
      }
      break
    case 'subscribe':
      addStatement(db, message.payload)
      runStatement(message.payload)
      break
    case 'unsubscribe':
      removeStatement(message.payload)
      break
    default:
      sendError('Unknown message type', message)
  }
})

const start = function (sqlite3: Sqlite3Static) {
  sendLog('Running SQLite3 version', sqlite3.version.libVersion)

  if (!('opfs' in sqlite3)) {
    sendError('OPFS is not available')
  }

  const db = new sqlite3.oo1.OpfsDb('/hioa-db.sqlite3')

  sqlite3.capi.sqlite3_update_hook(
    db,
    (_bind: number, _op: number, _db: string, table: string, rowid: bigint) => {
      for (const sql in statements) {
        runStatement(sql, { table, rowid })
      }
    },
    null,
  )

  dbReady(db)
}

sendLog('Loading and initializing SQLite3 module...')
sqlite3InitModule({
  print: sendLog,
  printErr: sendError,
}).then((sqlite3) => {
  sendLog('Done initializing')
  try {
    start(sqlite3)
  } catch (err: unknown) {
    if (err instanceof Error) {
      sendError(err.name, err.message)
    } else {
      sendError('Unknown error', String(err))
    }
  }
})
