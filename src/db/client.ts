import { PWBHost } from 'promise-worker-bi'
import { BehaviorSubject, Observable, share } from 'rxjs'
import sqliteParser from 'sqlite-parser'
import type { SqliteStatement } from 'sqlite-parser'

// TODO: Use constructor
// eslint-disable-next-line import-x/default
import DbWorker from './worker?worker'
import { ClientMessage, UpdateInfo, WorkerMessage } from './types'

const worker = new DbWorker()
const promiseWorker = new PWBHost(worker)

type Sql = string
type TableName = string

// TODO: Add query state wrapper
type UnreifiedRow = Record<string, unknown>

type QueryResult = {
  sql: Sql
  rows: UnreifiedRow[] | null
  updateInfo: UpdateInfo | null
  error: string | null
}

type ListenerCallback = (rows: QueryResult) => void

const sqlListenerMap: Record<Sql, ListenerCallback> = {}
const tableSqlMap: Record<TableName, Set<Sql>> = {}

const getSelectFromTables = (ast: SqliteStatement) => {
  const tables = new Set<string>()

  const visit = (node: SqliteStatement) => {
    if (node.type === 'statement' && node.variant === 'list') {
      for (const statement of node.statement) {
        visit(statement)
      }
    } else if (node.type === 'statement' && node.variant === 'select') {
      if (node.from.variant === 'table') {
        tables.add(node.from.name)
      } else if (node.from.type === 'map') {
        tables.add(node.from.source.name)
        for (const join of node.from.map) {
          tables.add(join.source.name)
        }
      }
    }
    // Nothing else, this function only visits SELECTS
  }

  visit(ast)

  return tables
}

const getDropTables = (ast: SqliteStatement) => {
  const tables = new Set<string>()

  const visit = (node: SqliteStatement) => {
    if (node.type === 'statement' && node.variant === 'list') {
      for (const statement of node.statement) {
        visit(statement)
      }
    } else if (node.type === 'statement' && node.variant === 'drop') {
      tables.add(node.target.name)
    }
    // Nothing else, this function only visits DROP TABLES
  }

  visit(ast)

  return tables
}

const logSql = (message: string, sql: Sql) => {
  console.log(`${message}: ${sql.replace(/\s+/g, ' ')}`)
}

const addListener = (sql: Sql, listener: ListenerCallback) => {
  logSql('Adding listener for', sql)

  if (sqlListenerMap[sql]) {
    // TODO: Only throw in dev mode, otherwise just log
    throw new Error(`Tried to add a listener for '${sql}', but one already exists`)
  }

  const fromTables = getSelectFromTables(sqliteParser(sql))

  sqlListenerMap[sql] = listener

  for (const table of fromTables) {
    let tableListeners = tableSqlMap[table]

    if (!tableListeners) {
      tableListeners = new Set()
      tableSqlMap[table] = tableListeners
    }

    tableListeners.add(sql)
  }

  return promiseWorker.postMessage({ type: 'subscribe', payload: sql } as ClientMessage)
}

const removeListener = (sql: Sql) => {
  logSql('Removing listener for', sql)

  delete sqlListenerMap[sql]

  const fromTables = getSelectFromTables(sqliteParser(sql))

  for (const table of fromTables) {
    const tableListeners = tableSqlMap[table]

    if (tableListeners) {
      tableListeners.delete(sql)

      if (tableListeners.size === 0) {
        delete tableSqlMap[table]
      }
    }
  }

  return promiseWorker.postMessage({ type: 'unsubscribe', payload: sql } as ClientMessage)
}

const removeAllTableListeners = (table: TableName) => {
  console.log(`Removing all listeners for table: ${table}`)

  const promises = []

  const tableListeners = tableSqlMap[table]
  if (tableListeners) {
    for (const sql of tableListeners) {
      delete sqlListenerMap[sql]
      promises.push(
        promiseWorker.postMessage({ type: 'unsubscribe', payload: sql } as ClientMessage),
      )
    }
  }

  delete tableSqlMap[table]

  return Promise.all(promises)
}

const notifyListener = (sql: Sql, result: QueryResult) => {
  const listener = sqlListenerMap[sql]

  if (listener) {
    listener(result)
  } else {
    // TODO: Only throw in dev mode, otherwise just log
    throw new Error(`Got subscribed rows for '${sql}', but there is no listener`)
  }
}

const checkForTableDeletes = (sql: Sql) => {
  const fromTables = getDropTables(sqliteParser(sql))
  for (const table of fromTables) {
    removeAllTableListeners(table)
  }
}

type QueryState<RowType> =
  | {
      // Loading
      sql: Sql
      loading: true
      error: null
      rows: null
      updateInfo: null
    }
  | {
      // Error
      sql: Sql
      loading: false
      error: string
      rows: null
      updateInfo: null
    }
  | {
      // Success
      sql: Sql
      loading: false
      error: null
      rows: RowType[]
      updateInfo: UpdateInfo | null
    }

type SingleResultQueryState<Result> =
  | {
      // Loading
      sql: Sql
      loading: true
      error: null
      result: null
      updateInfo: null
    }
  | {
      // Error
      sql: Sql
      loading: false
      error: string
      result: null
      updateInfo: null
    }
  | {
      // Success
      sql: Sql
      loading: false
      error: null
      result: Result
      updateInfo: UpdateInfo | null
    }

const sqlObservables: Record<Sql, Observable<QueryState<UnreifiedRow>>> = {}

const createObservable = (sql: Sql) =>
  new Observable<QueryState<UnreifiedRow>>((subscribe) => {
    const listener: ListenerCallback = (result) => {
      if (result.error) {
        subscribe.next({
          sql,
          loading: false,
          error: result.error,
          rows: null,
          updateInfo: null,
        })
      } else if (result.rows) {
        subscribe.next({
          sql,
          loading: false,
          error: null,
          rows: result.rows,
          updateInfo: result.updateInfo || null,
        })
      } else {
        // TODO: Only throw in dev, log otherwise
        throw new Error(`Got a result with no rows and no error: ${result}`)
      }
    }

    addListener(sql, listener)

    return () => {
      removeListener(sql)
    }
  }).pipe(
    share({
      connector: () =>
        new BehaviorSubject<QueryState<UnreifiedRow>>({
          sql,
          loading: true,
          error: null,
          rows: null,
          updateInfo: null,
        }),
    }),
  )

const getObservable = <RowType>(sql: Sql) => {
  let observable = sqlObservables[sql]

  if (!observable) {
    observable = createObservable(sql)
    sqlObservables[sql] = observable
  }

  return observable as Observable<QueryState<RowType>>
}

promiseWorker.register((msg) => {
  const message = msg as unknown as WorkerMessage
  switch (message.type) {
    case 'subscribed-query-result':
      notifyListener(message.payload.sql, {
        sql: message.payload.sql,
        rows: message.payload.rows as UnreifiedRow[],
        updateInfo: message.payload.update_info || null,
        error: null,
      })
      break
    case 'subscribed-query-error':
      notifyListener(message.payload.sql, {
        sql: message.payload.sql,
        rows: null,
        updateInfo: null,
        error: message.payload.error,
      })
      console.error(
        'Error for subscribed query %s: %s',
        message.payload.sql,
        message.payload.error,
      )
      break
    case 'error':
      console.error(message.payload)
      break
    case 'log':
      console.log(message.payload)
      break
    default:
      console.log('Unknown message', message)
  }
})

type ExecResults = UnreifiedRow[]

const execSql = async (
  sql: string,
  bindParams?: unknown[] | Record<string, unknown>,
): Promise<ExecResults> => {
  logSql('Executing', sql)

  checkForTableDeletes(sql)

  return promiseWorker.postMessage({
    type: 'query',
    payload: {
      sql,
      bindParams,
    },
  } as ClientMessage)
}

declare global {
  interface Window {
    sql: typeof execSql
  }
}
window.sql = execSql

export { getObservable, execSql }
export type { QueryState, SingleResultQueryState, ExecResults }
