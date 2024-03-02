export enum CellType {
  // Parent types
  List = 1,
  Matrix = 2,
  Outline = 3,
  Canvas = 4,
  Dashboard = 5,

  Text = 10,
  Effect = 11,
  Portal = 12,
}

type CellBase = {
  rowid: bigint
  id: string
  root_id: string | null
  parent_id: string | null
  name: string | null
  type: CellType
  created_at: string
  updated_at: string
}

// == TEXT CELL ==
type TextCellDefinition = {
  cell_type: CellType.Text
  text: string
}

type TextCellBase = CellBase & {
  type: CellType.Text
}

// Cell SQL result before JSON parsing definition
type DehydratedTextCell = TextCellBase & {
  definition: string
}

export type TextCell = TextCellBase & {
  definition: TextCellDefinition
}

// == LIST CELL ==
type ListCellDefinition = {
  cell_type: CellType.List
}

type ListCellBase = CellBase & {
  type: CellType.List
  definition: ListCellDefinition
}

type DehydratedListCell = ListCellBase & {
  definition: string
}

type ListCell = ListCellBase & {
  definition: ListCellDefinition
}

// == MATRIX CELL ==

// Should be a valid SQLite type affinity https://www.sqlite.org/datatype3.html
export type MatrixColumnType = 'TEXT' | 'NUMERIC' | 'INTEGER' | 'REAL' | 'BLOB'

export type MatrixColumnDefinition = {
  key: string
  name: string
  type: MatrixColumnType
}

export type MatrixCellDefinition = {
  cell_type: CellType.Matrix
  matrix_id: string
  column_definitions: MatrixColumnDefinition[]
}

type MatrixCellBase = CellBase & {
  type: CellType.Matrix
  definition: MatrixCellDefinition
}

type DehydratedMatrixCell = MatrixCellBase & {
  definition: string
}

export type MatrixCell = MatrixCellBase & {
  definition: MatrixCellDefinition
}

export type CellDefinition =
  | TextCellDefinition
  | ListCellDefinition
  | MatrixCellDefinition

export type DehydratedCell =
  | DehydratedTextCell
  | DehydratedListCell
  | DehydratedMatrixCell

export type Cell = TextCell | ListCell | MatrixCell

type ColumnData = string | number | boolean | bigint | null | undefined

// TODO: audit for bigint vs string, should be just bigint ideally
export type RowId = bigint | string

export type Row = Record<string, ColumnData> & { rowid: RowId }
