import { Accessor, Component, For, JSX, createMemo } from 'solid-js'
import {
  flexRender,
  getCoreRowModel,
  ColumnDef,
  createSolidTable,
  CellContext,
  RowData,
} from '@tanstack/solid-table'

import CellInput from './CellInput'
import CellSelect from './CellSelect'
import { RowSelection } from './selection'
import { updateRow, ROW_ID_COLUMN_NAME, deleteRows } from '../harmonizer'
import { Row, RowId, ColumnId } from '../types'

import styles from './MatrixTable.module.sass'

type ColumnSpec = {
  key: string
  name: string
}

declare module '@tanstack/solid-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    rowSelection: RowSelection
    selectRow: (rowId: RowId) => void
    deselectRow: (rowId: RowId) => void
    updateCell: (rowId: RowId, columnId: ColumnId, value: unknown) => void
  }
}

const SelectionCell = (props: CellContext<Row, unknown>) => {
  const selection = props.table.options.meta?.rowSelection?.()
  return (
    <CellSelect
      value={selection?.[props.row.id] || false}
      onChange={(value) => {
        if (value) {
          props.table.options.meta?.selectRow(props.row.id)
        } else {
          props.table.options.meta?.deselectRow(props.row.id)
        }
      }}
    />
  )
}

const DataCell = (props: CellContext<Row, unknown>) => (
  <CellInput
    value={String(props.getValue())}
    onCommit={(value) => {
      props.table.options.meta?.updateCell(props.row.id, props.column.id, value)
    }}
  />
)

type MatrixTableProps = {
  matrix_id: Accessor<string>
  columns: Accessor<ColumnSpec[]>
  data: Accessor<Row[]>
  rowSelection: RowSelection
  selectRow: (rowId: RowId) => void
  deselectRow: (rowId: RowId) => void
  rowKey?: string
} & JSX.HTMLAttributes<HTMLTableElement>

const MatrixTable: Component<MatrixTableProps> = (props) => {
  const columnDefs = createMemo<ColumnDef<Row>[]>(() => [
    { header: 'selection', accessorKey: 'selection', cell: SelectionCell },
    ...props.columns().map((column) => ({
      accessorKey: column.key,
      header: column.name,
      cell: DataCell,
    })),
  ])

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return props.data()
      },
      columns: columnDefs(),
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => row[props.rowKey || ROW_ID_COLUMN_NAME] as string,
      meta: {
        rowSelection: props.rowSelection,
        selectRow: props.selectRow,
        deselectRow: props.deselectRow,
        updateCell: (rowId: RowId, columnId: ColumnId, value: unknown) => {
          updateRow(props.matrix_id(), rowId, columnId, value)
        },
      },
    }),
  )

  return (
    <>
      <button
        onClick={() => {
          const selection = table().options.meta?.rowSelection?.()

          if (selection) {
            const ids = Object.keys(selection).filter((id) => selection[id])
            deleteRows(props.matrix_id(), ids)
          } else {
            throw new Error('SelectionCell: selection meta not found')
          }
        }}
      >
        Delete
      </button>
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
    </>
  )
}

export default MatrixTable
