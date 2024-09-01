import { filter, map, scan } from 'rxjs'

import { execSql, getObservable, QueryState, SingleResultQueryState } from '../db/client'

import {
  Cell,
  DehydratedCell,
  CellType,
  CellDefinition,
  MatrixCell,
  MatrixCellDefinition,
  Row,
  RowId,
  MatrixColumnDefinition,
} from './types'

// TODO: Add extends rowid to RowType and enforce in sql strings somehow too
type RowCache<RowType> = {
  rowMap: Record<string, RowType>
  queryState: QueryState<RowType>
  emit: boolean // Whether or not the latest result is an update that should be emitted
}

const rowCacheScan =
  (idKey: string) =>
  <RowType extends { rowid: RowId }>(
    last: RowCache<RowType> | QueryState<RowType>,
    newQueryState: QueryState<RowType>,
  ): RowCache<RowType> => {
    // Figure out if last is a query state (only happens the
    // first time, before the first row cache can be generated)
    const lastRowMap = 'rowMap' in last ? last.rowMap : {}

    // Pass through and always emit, if loading or error state
    // (Initial QueryState for last will always be loading)
    if (newQueryState.loading || newQueryState.error) {
      return {
        rowMap: lastRowMap,
        queryState: newQueryState,
        emit: true,
      }
    }

    const newRowMap: Record<string, RowType> = {}
    let emit = !newQueryState.updateInfo // Always emit if there's no update info

    if (newQueryState.rows) {
      // Map over rows checking the row cache, reusing the old row if
      // present in order to maintain referential equality
      newQueryState.rows = newQueryState.rows.map((row) => {
        // If emit not yet set, and there's an update row,
        // and this row is it, then set emit to true
        if (!emit && row.rowid) {
          emit = BigInt(row?.rowid) === newQueryState.updateInfo?.rowid
        }

        // TODO: Augment RowType to include idKey as string key
        const id = (row as unknown as Record<string, string> & { rowid: bigint })[
          idKey
        ] as string
        const lastRow = lastRowMap[id]

        if (lastRow) {
          const newRow = Object.assign(lastRow, row)

          newRowMap[id] = newRow
          return newRow
        } else {
          newRowMap[id] = row
          return row
        }
      })
    }

    // If emit is still not set to true, and there's an update,
    // also check the last query for the update row. If it's there,
    // it was just removed, so emit the update
    if (!emit && newQueryState.updateInfo && 'queryState' in last) {
      for (const row of last.queryState.rows || []) {
        if (BigInt(row.rowid) === newQueryState.updateInfo.rowid) {
          emit = true
          break
        }
      }
    }

    return {
      rowMap: newRowMap,
      queryState: newQueryState,
      emit,
    }
  }

const rowCacheEmitFilter = <RowType>(
  rowCache: RowCache<RowType> | QueryState<RowType>,
): boolean => ('queryState' in rowCache ? rowCache.emit : true)

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

// The same kind of filter predicate as above, but for single result query states
const resultEmitFilter = <ResultType extends { rowid: bigint }>(
  newQueryState: SingleResultQueryState<ResultType>,
): boolean =>
  !newQueryState.updateInfo ||
  BigInt(newQueryState.result?.rowid) === newQueryState.updateInfo?.rowid

// Initialize cell table on load if it doesn't yet exist
const initialize = () =>
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

const createCell = (
  cell_type: CellType,
  parent_id: string | null,
  root_id: string | null,
  name?: string,
) => {
  if (cell_type === CellType.Matrix) {
    return createMatrixCell(parent_id, root_id, name)
  }

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

const deleteCellAndChildren = async (cell: Cell) => {
  const matrix_ids = await execSql(
    `
    WITH RECURSIVE
    child_cell(id) AS (
      VALUES($cell_id)

      UNION

      SELECT __cell.id
      FROM __cell, child_cell
      WHERE __cell.parent_id = child_cell.id
    )
    SELECT json_extract(definition, '$.matrix_id') AS matrix_id
    FROM __cell
    WHERE __cell.id IN child_cell AND __cell.type = $cell_type;
  `,
    {
      $cell_id: cell.id,
      $cell_type: CellType.Matrix,
    },
  )

  return execSql(
    `
    BEGIN;

    ${matrix_ids.map((row) => `DROP TABLE ${row.matrix_id};`).join('\n')}

    WITH RECURSIVE
    child_cell(id) AS (
      VALUES($cell_id)

      UNION

      SELECT __cell.id
      FROM __cell, child_cell
      WHERE __cell.parent_id = child_cell.id
    )
    DELETE FROM __cell
      WHERE __cell.id IN child_cell;

    COMMIT;
    `,
    {
      $cell_id: cell.id,
    },
  )
}

const createMatrixCell = (
  parent_id: string | null,
  root_id: string | null,
  name?: string,
) => {
  const cell_type = CellType.Matrix
  const now = Date.now().toString(16)
  const cell_id = `__cell_${now}`
  const matrix_id = `__matrix_${now}`
  const definition: MatrixCellDefinition = {
    cell_type,
    matrix_id,
    column_definitions: [],
  }

  // Create the matrix table as well as its owner cell
  return execSql(
    `
      BEGIN;
  
      CREATE TABLE IF NOT EXISTS ${matrix_id} (
        rowid INTEGER PRIMARY KEY
      );

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
        $definition,
        datetime('now'),
        datetime('now')
      );
  
      COMMIT;
    `,
    {
      $cell_id: cell_id,
      $root_id: root_id,
      $parent_id: parent_id,
      $name: name,
      $cell_type: cell_type,
      $definition: JSON.stringify(definition),
    },
  )
}

// Only text column types currently
const addMatrixColumn = (cell: MatrixCell, column_definition: MatrixColumnDefinition) =>
  // Add the column to the matrix table, and then update the
  // matrix column definitions stored in the owner cell
  execSql(
    `
    BEGIN;

    ALTER TABLE ${cell.definition.matrix_id}
    ADD COLUMN ${column_definition.key} ${column_definition.type};

    UPDATE __cell
    SET definition = json_insert(
      definition,
      '$.column_definitions[#]',
      json($column_definition)
    )
    WHERE id = $cell_id;

    COMMIT;
  `,
    {
      $cell_id: cell.id,
      $column_definition: JSON.stringify(column_definition),
    },
  )

const insertMatrixRow = (matrix_id: string, column_keys: string[], values: unknown[]) =>
  execSql(
    `
      INSERT INTO ${matrix_id} (
        ${column_keys.join(',')}
      )
      VALUES (
        ${column_keys.map(() => '?').join(',')}
      );
    `,
    values,
  )

const updateMatrixRow = (
  matrix_id: string,
  row_id: RowId,
  column_id: string,
  value: unknown,
) =>
  execSql(
    `
      UPDATE ${matrix_id}
      SET ${column_id} = $value
      WHERE rowid = $row_id;
    `,
    { $value: value, $row_id: row_id },
  )

// Not used yet
// export const deleteMatrixRow = (matrix_id: string, row_id: RowId) =>
//   execSql(
//     `
//       DELETE FROM ${matrix_id}
//       WHERE rowid = $row_id;
//     `,
//     { $row_id: row_id },
//   )

const deleteMatrixRows = (matrix_id: string, row_ids: RowId[]) =>
  execSql(
    `
      DELETE FROM ${matrix_id}
      WHERE rowid IN (${row_ids.map(() => '?').join(', ')});
    `,
    row_ids,
  )

const getMatrixRows = (matrix_id: string) =>
  getObservable<Row>(
    `
        SELECT
          *
        FROM
          ${matrix_id};
      `,
  ).pipe(
    scan<QueryState<Row>, RowCache<Row>>(rowCacheScan('rowid')),
    filter((rowCache): boolean => rowCacheEmitFilter(rowCache)),
    map(rowCacheEmitter),
  )

const listRootCells = () =>
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
    filter((rowCache): boolean => rowCacheEmitFilter(rowCache)),
    map(rowCacheEmitter),
  )

const listCellsInRoot = (root_id: string) =>
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
    filter((queryState): boolean => rowCacheEmitFilter(queryState)),
    map(rowCacheEmitter),
  )

const getCell = (cell_id: string) => {
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
    filter((queryState): boolean => resultEmitFilter(queryState)),
  )

  return cellQueryState
}

const updateCellDefinition = (cell_id: string, definition: CellDefinition) =>
  execSql(
    `
    UPDATE __cell
    SET definition = $definition,
        updated_at = datetime('now')
    WHERE id = $cell_id;
  `,
    { $cell_id: cell_id, $definition: JSON.stringify(definition) },
  )

export {
  initialize,
  createCell,
  deleteCellAndChildren,
  addMatrixColumn,
  insertMatrixRow,
  updateMatrixRow,
  deleteMatrixRows,
  getMatrixRows,
  listRootCells,
  listCellsInRoot,
  getCell,
  updateCellDefinition,
}
