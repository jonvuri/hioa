import { createMemo } from 'solid-js'
import { execSql, subscribeSql } from '../db/client'
import { CellType } from './types'

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

export const createCell = (name?: string) => {
  const cell_id = `__cell_${Date.now().toString(16)}`

  return execSql(`
    INSERT INTO __cell (
      id,
      name,
      type,
      definition,
      created_at,
      updated_at
    ) VALUES (
      '${cell_id}',
      ${name?.trim() ? `'${name}'` : 'NULL'},
      1,
      '{}',
      datetime('now'),
      datetime('now')
    );
  `)
}

export const deleteCell = (cell_id: string) =>
  execSql(`
    DELETE FROM __cell
    WHERE id = '${cell_id}';
  `)

export const listRootCells = () =>
  subscribeSql<{
    id: string
    name: string
    type: CellType
    created_at: string
    updated_at: string
  }>(
    () => `
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
    'id',
  )

export const getCell = (cell_id: () => string) => {
  const [results, queryState] = subscribeSql<{
    id: string
    root_id: string
    parent_id: string
    name: string
    type: CellType
    definition: string
    created_at: string
    updated_at: string
  }>(
    () => `
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
        id = '${cell_id()}';
    `,
    'id',
  )

  const hydratedResults = createMemo(() => {
    const result = results()?.[0]
    if (result) {
      return {
        ...result,
        definition: JSON.parse(result.definition),
      }
    }
  })

  return [hydratedResults, queryState] as [typeof hydratedResults, typeof queryState]
}
