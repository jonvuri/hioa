import { createMemo } from 'solid-js'
import { Cron } from 'croner'

import { execSql, subscribeSql } from '../db/client'
import { Row } from './types'

export const ROW_ID_COLUMN_NAME = '__row_id'

export enum ColumnType {
  Text = 'TEXT',
  Number = 'REAL',
}

export type ColumnDefinition = {
  column_id: string
  column_name: string
  column_type?: string
}

// Test out croner
Cron('*/1 * * * * *', () => {
  console.log('This will run every second')
})

// Initialize harmonics table on load if it doesn't yet exist
export const initialize = () =>
  execSql(`
    CREATE TABLE IF NOT EXISTS __MatrixHarmonics (
      matrix_id TEXT,
      matrix_name TEXT,
      column_definitions JSON
    );
  `)

export const createMatrix = (name: string) => {
  const matrix_id = `__Matrix_${Date.now().toString(16)}`

  return execSql(`
    BEGIN;

    -- Insert entry for this matrix into the harmonics table
    INSERT INTO __MatrixHarmonics (
      matrix_id,
      matrix_name,
      column_definitions
    ) VALUES (
      '${matrix_id}',
      '${name}',
      '[]'
    );

    -- Create the matrix table
    CREATE TABLE IF NOT EXISTS ${matrix_id} (
      ${ROW_ID_COLUMN_NAME} INTEGER PRIMARY KEY
    );

    COMMIT;
  `)
}

export const deleteMatrix = (matrix_id: string) =>
  execSql(`
    BEGIN;

    -- Delete the matrix table
    DROP TABLE ${matrix_id};

    -- Delete the matrix entry from the harmonics table
    DELETE FROM __MatrixHarmonics
    WHERE matrix_id = '${matrix_id}';

    COMMIT;
  `)

export const listMatrices = () =>
  subscribeSql<{ matrix_id: string; matrix_name: string }>(
    () => `
      SELECT
        matrix_id,
        matrix_name
      FROM
        __MatrixHarmonics;
    `,
    ROW_ID_COLUMN_NAME,
  )

export const getMatrixHarmonics = (matrix_id: () => string) => {
  const [rows, queryState] = subscribeSql<{
    matrix_name: string
    column_definitions: string
  }>(
    () => `
      SELECT
        matrix_name,
        column_definitions
      FROM
        __MatrixHarmonics
      WHERE
        matrix_id = '${matrix_id()}';
    `,
    'column_definitions',
  )

  const hydratedRows = createMemo(() => {
    const harmonics = rows()?.[0]
    if (harmonics) {
      return {
        matrix_name: harmonics.matrix_name,
        column_definitions: JSON.parse(
          harmonics.column_definitions,
        ) as ColumnDefinition[],
      }
    }
  })

  return [hydratedRows, queryState] as [typeof hydratedRows, typeof queryState]
}

export const getMatrix = (matrix_id: () => string) =>
  subscribeSql<Row>(
    () => `
      SELECT
        *
      FROM
        ${matrix_id()};
    `,
    ROW_ID_COLUMN_NAME,
  )

export const addMatrixColumn = (
  matrix_id: string,
  column_name: string,
  column_type: ColumnType,
) => {
  const column_id = `__Column_${Date.now().toString(16)}`

  return execSql(`
    BEGIN;

    -- Add the column to the matrix table
    ALTER TABLE ${matrix_id}
    ADD ${column_id} ${column_type};

    -- Update the column definitions in the harmonics table
    UPDATE __MatrixHarmonics
    SET column_definitions = json_insert(
      column_definitions,
      '$[#]',
      json_object(
        'column_id',
        '${column_id}',
        'column_name',
        '${column_name}',
        'column_type',
        '${column_type}'
      )
    )
    WHERE matrix_id = '${matrix_id}';

    COMMIT;
  `)
}

export const insertRow = (matrix_id: string, column_ids: string[], values: unknown[]) =>
  execSql(
    `
      INSERT INTO ${matrix_id} (
        ${column_ids.join(', ')}
      )
      VALUES (
        ${column_ids.map(() => '?').join(', ')}
      );
    `,
    values,
  )

export const updateRow = (
  matrix_id: string,
  row_id: string,
  column_id: string,
  value: unknown,
) =>
  execSql(
    `
      UPDATE ${matrix_id}
      SET ${column_id} = ?
      WHERE ${ROW_ID_COLUMN_NAME} = ?;
    `,
    [value, row_id],
  )

export const deleteRow = (matrix_id: string, row_id: string) =>
  execSql(
    `
      DELETE FROM ${matrix_id}
      WHERE ${ROW_ID_COLUMN_NAME} = ?;
    `,
    [row_id],
  )

export const deleteRows = (matrix_id: string, row_ids: string[]) =>
  execSql(
    `
      DELETE FROM ${matrix_id}
      WHERE ${ROW_ID_COLUMN_NAME} IN (${row_ids.map(() => '?').join(', ')});
    `,
    row_ids,
  )
