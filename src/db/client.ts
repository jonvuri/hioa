import { PWBHost } from 'promise-worker-bi'

import DbWorker from './worker?worker'

import { ClientMessage, WorkerMessage } from './types'
import { createMemo, createSignal, onCleanup } from 'solid-js'

const worker = new DbWorker()
const promiseWorker = new PWBHost(worker)

type Sql = string
type ListenerCallback = (rows: unknown[]) => void
type Listener = {
  sql: Sql
  listener: ListenerCallback
}

const listeners: Listener[] = []

const resultCache: Record<Sql, unknown[]> = {}

const addListener = (sql: Sql, listener: ListenerCallback) => {
  for (const { sql: existingSql, listener: existingListener } of listeners) {
    if (sql === existingSql) {
      if (listener === existingListener) {
        return
      } else {
        // Already subscribed to this sql, so just add listener without subscribing,
        // and also immediately send it the cached result if any
        listeners.push({ sql, listener })

        const cachedResult = resultCache[sql]
        if (cachedResult) {
          listener(cachedResult)
        }
        return
      }
    }
  }

  // No listeners for this sql yet, so both add and subscribe
  listeners.push({ sql, listener })
  promiseWorker.postMessage({ type: 'subscribe', payload: sql } as ClientMessage)
}

const removeListener = (listener: ListenerCallback) => {
  const index = listeners.findIndex(
    ({ listener: existingListener }) => listener === existingListener,
  )

  if (index === -1) {
    return
  }

  const { sql } = listeners[index]

  listeners.splice(index, 1)

  for (const { sql: existingSql } of listeners) {
    if (sql === existingSql) {
      // Listener still exists for this sql, so don't unsubscribe
      return
    }
  }

  // No listeners for this sql anymore, so unsubscribe and clear the cache
  promiseWorker.postMessage({ type: 'unsubscribe', payload: sql } as ClientMessage)
  delete resultCache[sql]
}

const notifyListeners = (sql: Sql, rows: unknown[]) => {
  for (const { sql: existingSql, listener } of listeners) {
    if (sql === existingSql) {
      listener(rows)
    }
  }

  resultCache[sql] = rows
}

promiseWorker.register((msg) => {
  const message = msg as unknown as WorkerMessage
  switch (message.type) {
    case 'subscribed-query-result':
      notifyListeners(message.payload.sql, message.payload.rows)
      break
    case 'subscribed-query-error':
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

export type ExecResults = Record<string, unknown>[]

export const execSql = async (
  sql: string,
  bindParams?: unknown[],
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

export type Store<T> =
  | {
      result: T | null
      loading: true
      error: string | null
    }
  | {
      result: T
      loading: false
      error: null
    }
  | {
      result: null
      loading: false
      error: string
    }

// TODO: Reverify that onCleanup works as expected
export const subscribeSql = <ResultRow extends Record<string, unknown>>(
  sql: () => string,
  idKey: string,
) => {
  const [rows, setRows] = createSignal<ResultRow[] | undefined>()
  const [queryState, setQueryState] = createSignal<{
    loading: boolean
    error: Error | null
  }>({ loading: true, error: null })

  // TODO: Return query meta?
  // const [meta, setMeta] = createStore<{ columns: string[]; types: string[] }>({

  createMemo(() => {
    // TODO: Error handling
    const listener = ((newRows: ResultRow[]) => {
      setQueryState({
        loading: false,
        error: null,
      })

      setRows((oldRows) => {
        if (!oldRows) {
          return newRows
        }

        const ret = new Array(newRows.length)
        let changed = false

        for (const index in newRows) {
          const newRow = newRows[index]
          const oldRow = oldRows[index]

          if (oldRow) {
            if (oldRow[idKey] === newRow[idKey]) {
              let rowChanged = false

              for (const key in newRow) {
                if (oldRow[key] !== newRow[key]) {
                  rowChanged = true
                  break
                }
              }

              if (rowChanged) {
                ret[index] = newRow
                changed = true
              } else {
                ret[index] = oldRow
              }
            } else {
              ret[index] = newRow
              changed = true
            }
          } else {
            ret[index] = newRow
            changed = true
          }
        }

        if (changed) {
          return ret
        } else {
          return oldRows
        }
      })
    }) as ListenerCallback

    addListener(sql(), listener)

    onCleanup(() => {
      removeListener(listener)
    })
  })

  return [rows, queryState] as [typeof rows, typeof queryState]
}
