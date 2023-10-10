import { Accessor, Component, For, JSX, createMemo } from 'solid-js'
import {
  flexRender,
  getCoreRowModel,
  ColumnDef,
  createSolidTable,
  CellContext,
  RowData,
} from '@tanstack/solid-table'
import Boxed from 'solid-surfaces/components/stellation/Boxed'

import { updateRow, ROW_ID_COLUMN_NAME } from '../harmonizer'

import styles from './MatrixTable.module.sass'
import CellInput from './CellInput'

type ColumnSpec = {
  key: string
  name: string
}
type ColumnData = string | number | boolean | null | undefined
type Row = Record<string, ColumnData>

declare module '@tanstack/solid-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateCell: (rowId: string, columnId: string, value: unknown) => void
  }
}

const Cell = (props: CellContext<Row, unknown>) => (
  <Boxed>
    <CellInput
      value={String(props.getValue())}
      onCommit={(value) => {
        props.table.options.meta?.updateCell(props.row.id, props.column.id, value)
      }}
    />
  </Boxed>
)

type MatrixTableProps = {
  matrix_id: Accessor<string>
  columns: Accessor<ColumnSpec[]>
  data: Accessor<Row[]>
  rowKey?: string
  cellRenderer?: (cell: ColumnData, column: ColumnSpec, id: string) => JSX.Element
  header?: boolean
} & JSX.HTMLAttributes<HTMLTableElement>

const MatrixTable: Component<MatrixTableProps> = (props) => {
  const columnDefs = createMemo(
    () =>
      props.columns().map((column) => ({
        accessorKey: column.key,
        header: column.name,
        cell: Cell,
      })) as ColumnDef<Row>[],
  )

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return props.data()
      },
      columns: columnDefs(),
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => row[props.rowKey || ROW_ID_COLUMN_NAME] as string,
      meta: {
        updateCell: (rowId: string, columnId: string, value: unknown) => {
          updateRow(props.matrix_id(), rowId, columnId, value)
        },
      },
    }),
  )

  return (
    <table class={styles['table']}>
      <thead>
        <For each={table().getHeaderGroups()}>
          {(headerGroup) => (
            <tr>
              <For each={headerGroup.headers}>
                {(header) => (
                  <th>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )}
              </For>
            </tr>
          )}
        </For>
      </thead>
      <tbody>
        <For each={table().getRowModel().rows}>
          {(row) => (
            <tr>
              <For each={row.getVisibleCells()}>
                {(cell) => (
                  <td>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                )}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  )
}

export default MatrixTable
