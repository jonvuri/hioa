import { createStore, reconcile } from 'solid-js/store'
import { PWBHost } from 'promise-worker-bi'

import DbWorker from './worker?worker'

import { ClientMessage, WorkerMessage } from './types'

const worker = new DbWorker()
const promiseWorker = new PWBHost(worker)

type Sql = string
type ListenerCallback = (rows: unknown[]) => void
type Listener = {
  sql: Sql
  listener: ListenerCallback
}
const listeners: Listener[] = []

const addListener = (sql: Sql, listener: ListenerCallback) => {
  for (const { sql: existingSql, listener: existingListener } of listeners) {
    if (sql === existingSql) {
      if (listener === existingListener) {
        return
      } else {
        // Already subscribed to this sql, so just add listener
        listeners.push({ sql, listener })
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

  // No listeners for this sql anymore, so unsubscribe
  promiseWorker.postMessage({ type: 'unsubscribe', payload: sql } as ClientMessage)
}

promiseWorker.register((msg) => {
  const message = msg as unknown as WorkerMessage
  switch (message.type) {
    case 'subscribed-query-result':
      for (const { sql, listener } of listeners) {
        if (sql === message.payload.sql) {
          listener(message.payload.rows)
        }
      }
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

export const execSql = async (sql: string): Promise<ExecResults> => {
  return promiseWorker.postMessage({
    type: 'query',
    payload: sql,
  } as ClientMessage)
}

declare global {
  interface Window {
    sql: typeof execSql
  }
}
window.sql = execSql

// subcribe should return cleanup fn in tuple w/ result
export const subscribeSql = <RowType>(sql: string) => {
  type Store = {
    result: RowType[]
    loading: boolean
    error: string | null
  }

  const [result, setResult] = createStore<Store>({
    result: [],
    loading: true,
    error: null,
  })

  const listener = ((rows: RowType[]) => {
    setResult(
      reconcile(
        {
          result: rows,
          loading: false,
          error: null,
        },
        { key: 'rowid' },
      ),
    )
  }) as ListenerCallback

  addListener(sql, listener)

  const onCleanup = () => {
    removeListener(listener)
  }

  return [result as Store, onCleanup] as const
}
