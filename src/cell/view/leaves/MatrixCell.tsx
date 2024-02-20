import {
  Component,
  For,
  JSX,
  createEffect,
  createMemo,
  createSignal,
  from,
} from 'solid-js'
import {
  flexRender,
  getCoreRowModel,
  createSolidTable,
  CellContext,
  RowData,
} from '@tanstack/solid-table'

// import CellInput from './CellInput'
// import RowInput from './RowInput'
import { addMatrixColumn, getMatrixRows, insertMatrixRow } from '../../harmonizer'
import { Row, MatrixCell as MatrixCellType } from '../../types'

import styles from './MatrixCell.module.sass'
import Button from 'solid-surfaces/components/Button'

declare module '@tanstack/solid-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateCell: (rowId: string, columnId: string, value: unknown) => void
  }
}

const DataCell = (props: CellContext<Row, unknown>) => (
  <div>{String(props.getValue())}</div>
  // TODO
  // <CellInput
  //   value={String(props.getValue())}
  //   onCommit={(value) => {
  //     props.table.options.meta?.updateCell(props.row.id, props.column.id, value)
  //   }}
  // />
)

type ColumnDef = {
  accessorKey: string
  header: string
  cell: typeof DataCell
}

type MatrixCellProps = {
  cell: MatrixCellType
} & JSX.HTMLAttributes<HTMLTableElement>

const MatrixCell: Component<MatrixCellProps> = (props) => {
  const matrix_id = createMemo(() => props.cell.definition.matrix_id)

  const [columnDefs, setColumnDefs] = createSignal([] as ColumnDef[])
  createEffect(() => {
    setColumnDefs(
      props.cell.definition.column_definitions.map((column) => ({
        accessorKey: column.key,
        header: column.name,
        cell: DataCell,
      })),
    )
  })

  const queryState = createMemo(() => from(getMatrixRows(matrix_id())))

  const [data, setData] = createSignal([] as Row[])
  createEffect(() => {
    setData(queryState()?.()?.rows || [])
  })

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return data()
      },
      columns: columnDefs(),
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => String(row['rowid']) as string,
      meta: {
        updateCell: (rowId: string, columnId: string, value: unknown) => {
          // TODO
          console.log('updateCell', rowId, columnId, value)
        },
      },
    }),
  )

  const handleAddColumn = () => {
    // Add a new bogus column to the matrix
    const column_key = `column_${columnDefs().length + 1}`
    const column_name = `Column ${columnDefs().length + 1}`
    addMatrixColumn(props.cell, column_key, column_name)

    // Make optimistic updates to column defs and data
    setColumnDefs([
      ...columnDefs(),
      {
        accessorKey: column_key,
        header: column_name,
        cell: DataCell,
      },
    ])
    // In the future, might be other default column values than null
    setData(data().map((row) => ({ ...row, [column_key]: null })))
  }

  const handleAddRow = () => {
    // Add a new row of bogus data to the matrix
    const columns = columnDefs().map((column) => column.accessorKey)
    const values = columns.map((_, index) => `Value ${index}`)
    insertMatrixRow(matrix_id(), columns, values)
  }

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
        <Button onClick={handleAddColumn}>Add Column</Button>
        <Button onClick={handleAddRow}>Add Row</Button>
        {/* <RowInput matrix_id={props.matrix_id} rowSelection={props.rowSelection} /> */}
      </tbody>
    </table>
  )
}

export default MatrixCell
