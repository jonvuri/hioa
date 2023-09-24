import { PWBWorker } from 'promise-worker-bi'
import sqlite3InitModule, {
  OpfsDatabase,
  PreparedStatement,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm'

import { ClientMessage, WorkerMessage } from './types'

type Sql = string

const promiseWorker = new PWBWorker()

const sendLog = (...args: string[]) =>
  promiseWorker.postMessage({ type: 'log', payload: args.join(' ') } as WorkerMessage)
const sendError = (...args: string[]) =>
  promiseWorker.postMessage({ type: 'error', payload: args.join(' ') } as WorkerMessage)

const sendSubscribedQueryResult = (sql: Sql, rows: unknown[]) =>
  promiseWorker.postMessage({
    type: 'subscribed-query-result',
    payload: { sql, rows },
  } as WorkerMessage)

const sendSubscribedQueryError = (sql: Sql, error: string) =>
  promiseWorker.postMessage({
    type: 'subscribed-query-error',
    payload: { sql, error },
  } as WorkerMessage)

const statements: Record<Sql, PreparedStatement> = {}

const runStatement = (sql: Sql) => {
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

    if (rows.length > 0) {
      sendSubscribedQueryResult(sql, rows)
    } else {
      sendLog('No rows returned for: ', sql)
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      sendSubscribedQueryError(sql, err.message)
    } else {
      sendSubscribedQueryError(sql, String(err))
    }
  }
}

// TODO: Parse SQL to determine which tables are being queried and only subscribe to those
const addStatement = (db: OpfsDatabase, sql: Sql) => {
  if (statements[sql]) {
    return
  }

  statements[sql] = db.prepare(sql)
  sendLog('Added statement: ', sql)
  sendLog('Statements: \n', Object.keys(statements).join('\n'))
}

const removeStatement = (sql: Sql) => {
  const statement = statements[sql]

  if (!statement) {
    return
  }

  delete statements[sql]

  statement.finalize()
  sendLog('Removed statement: ', sql)
  if (Object.keys(statements).length === 0) {
    sendLog('No more statements')
  } else {
    sendLog('Statements: \n', Object.keys(statements).join('\n'))
  }
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
          sql: message.payload,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      sendLog('Update hook: ', String(args))

      for (const sql in statements) {
        runStatement(sql)
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
