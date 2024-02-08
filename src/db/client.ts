import { BehaviorSubject, Observable, share } from 'rxjs'
import { PWBHost } from 'promise-worker-bi'

import DbWorker from './worker?worker'

import { ClientMessage, UpdateInfo, WorkerMessage } from './types'

const worker = new DbWorker()
const promiseWorker = new PWBHost(worker)

type Sql = string

// TODO: Add query state wrapper
type UnreifiedRow = Record<string, unknown>

type QueryResult = {
  sql: Sql
  rows: UnreifiedRow[] | null
  updateInfo: UpdateInfo | null
  error: string | null
}

type ListenerCallback = (rows: QueryResult) => void

const workerListeners: Record<Sql, ListenerCallback> = {}

const notifyListener = (sql: Sql, result: QueryResult) => {
  const listener = workerListeners[sql]

  if (listener) {
    listener(result)
  } else {
    // TODO: Only throw in dev mode, otherwise just log
    throw new Error(`Got subscribed rows for '${sql}', but there is no listener`)
  }
}

export type QueryState<RowType> =
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

export type SingleResultQueryState<Result> =
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
    if (workerListeners[sql]) {
      // TODO: Only throw in dev mode, otherwise just log
      throw new Error(`Tried to add a listener for '${sql}', but one already exists`)
    }

    workerListeners[sql] = (result) => {
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

    promiseWorker.postMessage({ type: 'subscribe', payload: sql } as ClientMessage)

    return () => {
      delete workerListeners[sql]

      promiseWorker.postMessage({ type: 'unsubscribe', payload: sql } as ClientMessage)
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

export const getObservable = <RowType>(sql: Sql) => {
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

export type ExecResults = UnreifiedRow[]

export const execSql = async (
  sql: string,
  bindParams?: unknown[] | Record<string, unknown>,
): Promise<ExecResults> => {
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
