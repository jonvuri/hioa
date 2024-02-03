import { map } from 'rxjs'

import { execSql, getObservable } from '../db/client'
import { Cell, DehydratedCell, CellType, CellDefinition } from './types'

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
  )

export const listCellsInRoot = (root_id: string) =>
  getObservable<DehydratedCell>(
    `
      SELECT
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
      const rows = queryState.rows?.map(
        (row): Cell => ({
          ...row,
          definition: JSON.parse(row.definition),
        }),
      )

      return {
        loading: queryState.loading,
        error: queryState.error,
        rows,
      }
    }),
  )

export const getCell = (cell_id: string) => {
  const listQueryState = getObservable<DehydratedCell>(
    `
      SELECT
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
        loading: queryState.loading,
        error: queryState.error,
        result,
      }
    }),
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
