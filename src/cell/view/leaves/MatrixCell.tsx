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

import CellInput from './matrix/CellInput'
import CellSelect from './matrix/CellSelect'
import NewColumnInput from './matrix/NewColumnInput'
import RowInput from './matrix/RowInput'
import { useRowSelection, RowSelection } from './matrix/selection'

import { addMatrixColumn, getMatrixRows, updateMatrixRow } from '../../harmonizer'
import {
  Row,
  RowId,
  MatrixCell as MatrixCellType,
  MatrixColumnDefinition,
  MatrixColumnType,
} from '../../types'

import styles from './MatrixCell.module.sass'

declare module '@tanstack/solid-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    rowSelection: RowSelection
    selectRow: (rowId: RowId) => void
    deselectRow: (rowId: RowId) => void
    updateCell: (rowId: RowId, columnId: string, value: unknown) => void
  }
}

const SelectionCell = (props: CellContext<Row, unknown>) => {
  const selection = () => props.table.options.meta?.rowSelection?.()
  return (
    <CellSelect
      value={selection()?.[props.row.id] || false}
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

  const [columnDefs, setColumnDefs] = createSignal([] as MatrixColumnDefinition[])
  createEffect(() => {
    setColumnDefs(props.cell.definition.column_definitions)
  })

  const tableColumnDefs = createMemo(() => [
    { header: 'selection', accessorKey: 'selection', cell: SelectionCell },
    ...columnDefs().map(
      (column): ColumnDef => ({
        accessorKey: column.key,
        header: column.name,
        cell: DataCell,
      }),
    ),
  ])

  const queryState = createMemo(() => from(getMatrixRows(matrix_id())))

  const [data, setData] = createSignal([] as Row[])
  createEffect(() => {
    setData(queryState()?.()?.rows || [])
  })

  const [rowSelection, selectRow, deselectRow] = useRowSelection(data)

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return data()
      },
      columns: tableColumnDefs(),
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => String(row['rowid']) as string, // TODO: Global constant for rowid, just to track usage
      meta: {
        rowSelection,
        selectRow,
        deselectRow,
        updateCell: (rowId: RowId, columnId: string, value: unknown) => {
          updateMatrixRow(matrix_id(), rowId, columnId, value)
        },
      },
    }),
  )

  const handleAddColumn = async (column_name: string, column_type: MatrixColumnType) => {
    const column_key = `column_${columnDefs().length + 1}`

    const column_definition = {
      key: column_key,
      name: column_name,
      type: column_type,
    }

    await addMatrixColumn(props.cell, column_definition)

    // Make optimistic update to column defs
    setColumnDefs([...columnDefs(), column_definition])

    // In the future, might be other default column values than null
    setData(data().map((row) => ({ ...row, [column_key]: null })))
  }

  return (
    <div class={styles['container']}>
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
          <RowInput
            cell={props.cell}
            columnDefs={columnDefs()}
            rowSelection={rowSelection}
          />
        </tbody>
      </table>
      <NewColumnInput onAddColumn={handleAddColumn} />
    </div>
  )
}

export default MatrixCell
