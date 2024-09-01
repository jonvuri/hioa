enum CellType {
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

type TextCell = TextCellBase & {
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
type MatrixColumnType = 'TEXT' | 'NUMERIC' | 'INTEGER' | 'REAL' | 'BLOB'

type MatrixColumnDefinition = {
  key: string
  name: string
  type: MatrixColumnType
}

type MatrixCellDefinition = {
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

type MatrixCell = MatrixCellBase & {
  definition: MatrixCellDefinition
}

type CellDefinition = TextCellDefinition | ListCellDefinition | MatrixCellDefinition

type DehydratedCell = DehydratedTextCell | DehydratedListCell | DehydratedMatrixCell

type Cell = TextCell | ListCell | MatrixCell

type ColumnData = string | number | boolean | bigint | null | undefined

// TODO: audit for bigint vs string, should be just bigint ideally
type RowId = bigint | string

type Row = Record<string, ColumnData> & { rowid: RowId }

export { CellType }
export type {
  TextCell,
  MatrixColumnType,
  MatrixColumnDefinition,
  MatrixCellDefinition,
  MatrixCell,
  CellDefinition,
  DehydratedCell,
  Cell,
  RowId,
  Row,
}
