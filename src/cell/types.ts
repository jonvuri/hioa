export enum CellType {
  // Parent types
  List = 1,
  Table = 2,
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

export type CellDefinition = TextCellDefinition | ListCellDefinition

export type DehydratedCell = DehydratedTextCell | DehydratedListCell

export type Cell = TextCell | ListCell
