export type RowId = string
export type ColumnId = string

type ColumnData = string | number | boolean | null | undefined

export type Row = Record<RowId, ColumnData>
