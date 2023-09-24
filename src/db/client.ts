import { createStore, reconcile } from 'solid-js/store'
import { PWBHost } from 'promise-worker-bi'

import DbWorker from './worker?worker'

import { ClientMessage, WorkerMessage } from './types'
import { createMemo, onCleanup } from 'solid-js'

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

// Retry doing this with accessor and onCleanup in subscribe itself
export const subscribeSql = <Result>(sql: () => string) => {
  // Try using a Signal here instead if this misbehaves
  const [store, setStore] = createStore<Store<Result>>({
    result: null,
    loading: true,
    error: null,
  })

  createMemo(() => {
    // TODO: Error handling
    const listener = ((rows: unknown) => {
      setStore(
        reconcile(
          {
            result: rows as Result,
            loading: false,
            error: null,
          },
          { key: 'rowid' },
        ),
      )
    }) as ListenerCallback

    addListener(sql(), listener)

    onCleanup(() => {
      console.log('Subscribe removing listener')
      removeListener(listener)
    })
  })

  return store
}
