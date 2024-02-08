import { filter, map, scan } from 'rxjs'

import { execSql, getObservable, QueryState, SingleResultQueryState } from '../db/client'
import { Cell, DehydratedCell, CellType, CellDefinition } from './types'

// TODO: Add extends rowid to RowType and enforce in sql strings somehow too
type RowCache<RowType> = {
  rowMap: Record<string, RowType>
  queryState: QueryState<RowType>
}

const rowCacheScan =
  (rowIdKey: string) =>
  <RowType>(
    last: RowCache<RowType> | QueryState<RowType>,
    newQueryState: QueryState<RowType>,
  ): RowCache<RowType> => {
    // Figure out if last is a query state (only happens the
    // first time, before the first row cache can be generated)
    const lastRowMap = 'rowMap' in last ? last.rowMap : {}

    // Just pass through if loading or error state
    if (newQueryState.loading || newQueryState.error) {
      return {
        rowMap: lastRowMap,
        queryState: newQueryState,
      }
    }

    const newRowMap: Record<string, RowType> = {}

    if (newQueryState.rows) {
      // Map over rows checking the row cache, reusing the old row if
      // present in order to maintain referential equality
      newQueryState.rows = newQueryState.rows.map((row) => {
        // TODO: Augment RowType to include rowIdKey as string key
        const rowId = (row as Record<string, string>)[rowIdKey] as string

        const lastRow = lastRowMap[rowId]

        if (lastRow) {
          const newRow = Object.assign(lastRow, row)

          newRowMap[rowId] = newRow
          return newRow
        } else {
          newRowMap[rowId] = row
          return row
        }
      })
    }

    return {
      rowMap: newRowMap,
      queryState: newQueryState,
    }
  }

// Takes in a row cache scan result and emits only the query state
const rowCacheEmitter = <RowType>(
  rowCacheScanResult: RowCache<RowType> | QueryState<RowType>,
): QueryState<RowType> =>
  'queryState' in rowCacheScanResult ? rowCacheScanResult.queryState : rowCacheScanResult

const singleResultCacheScan =
  (rowIdKey: string) =>
  <ResultType>(
    last: SingleResultQueryState<ResultType>,
    newQueryState: SingleResultQueryState<ResultType>,
  ): SingleResultQueryState<ResultType> => {
    if (newQueryState.loading) {
      return {
        sql: newQueryState.sql,
        loading: true,
        error: null,
        result: null,
        updateInfo: null,
      }
    } else if (newQueryState.error) {
      return {
        sql: newQueryState.sql,
        loading: false,
        error: newQueryState.error,
        result: null,
        updateInfo: null,
      }
    } else if (newQueryState.result) {
      // TODO: Augment RowType to include rowIdKey as string key
      const rowId = (newQueryState.result as Record<string, string>)[rowIdKey]

      if (last.result && rowId === (last.result as Record<string, string>)[rowIdKey]) {
        // Use existing row if present to maintain referential equality
        const newResult = Object.assign(last.result, newQueryState.result)

        console.log('(s) found existing row ', rowId)

        return {
          sql: newQueryState.sql,
          loading: false,
          error: null,
          result: newResult,
          updateInfo: newQueryState.updateInfo,
        }
      } else {
        return {
          sql: newQueryState.sql,
          loading: false,
          error: null,
          result: newQueryState.result,
          updateInfo: newQueryState.updateInfo,
        }
      }
    } else {
      // TODO: Log instead of throw
      throw new Error(`Got a result with no rows and no error: ${newQueryState}`)
    }
  }

// Filter predicate that only lets through query states with new,
// updated rows, if the query state has update info
const updateRowsPredicate = <RowType extends { rowid: string }>(
  newQueryState: QueryState<RowType>,
): boolean =>
  !newQueryState.updateInfo ||
  newQueryState.rows.find(
    (row) => BigInt(row.rowid) === newQueryState.updateInfo?.rowid,
  ) !== undefined

// The same kind of filter predicate as above, but for single result query states
const updateResultPredicate = <ResultType extends { rowid: string }>(
  newQueryState: SingleResultQueryState<ResultType>,
): boolean =>
  !newQueryState.updateInfo ||
  BigInt(newQueryState.result?.rowid) === newQueryState.updateInfo?.rowid

// Initialize cell table on load if it doesn't yet exist
export const initialize = () =>
  execSql(`
    CREATE TABLE IF NOT EXISTS __cell (
      id TEXT,
      root_id TEXT,
      parent_id TEXT,
      name TEXT,
      type NUMBER,
      definition JSON,
      created_at DATE,
      updated_at DATE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS __cell_id ON __cell (id);
    CREATE INDEX IF NOT EXISTS __cell_root_id ON __cell (root_id);
    CREATE INDEX IF NOT EXISTS __cell_parent_id ON __cell (parent_id);
  `)

export const createCell = (
  cell_type: CellType,
  parent_id: string | null,
  root_id: string | null,
  name?: string,
) => {
  const cell_id = `__cell_${Date.now().toString(16)}`

  return execSql(
    `
    INSERT INTO __cell (
      id,
      root_id,
      parent_id,
      name,
      type,
      definition,
      created_at,
      updated_at
    ) VALUES (
      $cell_id,
      $root_id,
      $parent_id,
      $name,
      $cell_type,
      '{}',
      datetime('now'),
      datetime('now')
    );
  `,
    {
      $cell_id: cell_id,
      $root_id: root_id,
      $parent_id: parent_id,
      $name: name,
      $cell_type: cell_type,
    },
  )
}

export const deleteCell = (cell_id: string) =>
  execSql(`
    DELETE FROM __cell
    WHERE id = '${cell_id}';
  `)

export const listRootCells = () =>
  getObservable<Cell>(
    `
      SELECT
        rowid,
        id,
        name,
        type,
        created_at,
        updated_at
      FROM
        __cell
      WHERE
        root_id IS NULL;
    `,
  ).pipe(
    scan<QueryState<Cell>, RowCache<Cell>>(rowCacheScan('id')),
    map(rowCacheEmitter),
    filter((queryState): boolean => updateRowsPredicate(queryState)),
  )

export const listCellsInRoot = (root_id: string) =>
  getObservable<DehydratedCell>(
    `
      SELECT
        rowid,
        id,
        root_id,
        parent_id,
        name,
        type,
        definition,
        created_at,
        updated_at
      FROM
        __cell
      WHERE
        root_id = '${root_id}';
    `,
  ).pipe(
    map((queryState) => {
      if (queryState.loading) {
        return {
          sql: queryState.sql,
          loading: true as const,
          error: null,
          rows: null,
          updateInfo: null,
        }
      } else if (queryState.error) {
        return {
          sql: queryState.sql,
          loading: false as const,
          error: queryState.error,
          rows: null,
          updateInfo: null,
        }
      } else if (queryState.rows) {
        return {
          sql: queryState.sql,
          loading: false as const,
          error: null,
          rows: queryState.rows.map(
            (row): Cell => ({
              ...row,
              definition: JSON.parse(row.definition),
            }),
          ),
          updateInfo: queryState.updateInfo,
        }
      } else {
        // TODO: Log instead of throw
        throw new Error(`Got a result with no rows and no error: ${queryState}`)
      }
    }),
    scan<QueryState<Cell>, RowCache<Cell>>(rowCacheScan('id')),
    map(rowCacheEmitter),
    filter((queryState): boolean => updateRowsPredicate(queryState)),
  )

export const getCell = (cell_id: string) => {
  const listQueryState = getObservable<DehydratedCell>(
    `
      SELECT
        rowid,
        id,
        root_id,
        parent_id,
        name,
        type,
        definition,
        created_at,
        updated_at
      FROM
        __cell
      WHERE
        id = '${cell_id}';
    `,
  )

  const cellQueryState = listQueryState.pipe(
    map((queryState) => {
      const first = queryState.rows?.[0]
      const result = first
        ? ({
            ...first,
            definition: JSON.parse(first.definition),
          } as Cell)
        : null

      return {
        sql: queryState.sql,
        loading: queryState.loading,
        error: queryState.error,
        result,
        updateInfo: queryState.updateInfo,
      } as SingleResultQueryState<Cell>
    }),
    scan(singleResultCacheScan('id')),
    filter((queryState): boolean => updateResultPredicate(queryState)),
  )

  return cellQueryState
}

export const updateCellDefinition = (cell_id: string, definition: CellDefinition) =>
  execSql(
    `
    UPDATE __cell
    SET definition = $definition,
        updated_at = datetime('now')
    WHERE id = $cell_id;
  `,
    { $cell_id: cell_id, $definition: JSON.stringify(definition) },
  )
