import { execSql, subscribeSql } from '../db/client'

type ColumnDefinition = {
  column_id: string
  column_name: string
  column_type: 'string' | 'number' | 'boolean'
}

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
      row_id INTEGER PRIMARY KEY
    );

    COMMIT;
  `)
}

export const listMatrices = () =>
  subscribeSql<{ matrix_id: string; matrix_name: string }>(
    `
      SELECT
        matrix_id,
        matrix_name
      FROM
        __MatrixHarmonics;
    `,
  )

export const getMatrixHarmonics = async (matrix_id: string) => {
  const result = (await execSql(`
    SELECT
      matrix_name,
      column_definitions
    FROM
      __MatrixHarmonics
    WHERE
      matrix_id = '${matrix_id}';
  `)) as { matrix_name: string; column_definitions: string }[]

  if (result.length === 0) {
    throw new Error(`Matrix ${matrix_id} not found`)
  }

  return {
    matrix_name: result[0].matrix_name,
    column_definitions: JSON.parse(result[0].column_definitions) as ColumnDefinition[],
  }
}
