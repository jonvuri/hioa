type Sql = string

type UpdateInfo = {
  table: string
  rowid: bigint
}

// Message from client to worker
type ClientMessage =
  | {
      type: 'query'
      payload: {
        sql: Sql
        bindParams?: (string | number)[]
      }
    }
  | {
      type: 'subscribe'
      payload: Sql
    }
  | {
      type: 'unsubscribe'
      payload: Sql
    }

// Message from worker to client
type WorkerMessage =
  | {
      type: 'subscribed-query-result'
      payload: {
        sql: Sql
        rows: unknown[]
        update_info?: UpdateInfo
      }
    }
  | {
      type: 'subscribed-query-error'
      payload: {
        sql: Sql
        error: string
      }
    }
  | {
      type: 'error'
      payload: string
    }
  | {
      type: 'log'
      payload: string
    }

export type { UpdateInfo, ClientMessage, WorkerMessage }
