import { Component, For, JSX } from 'solid-js'

import Boxed from 'solid-surfaces/components/stellation/Boxed'

import styles from './MatrixTable.module.sass'

type ColumnSpec = {
  key: string
  name: string
}
type ColumnData = string | number | boolean | null | undefined
type Row = Record<string, ColumnData>

type MatrixTableProps = {
  columns: ColumnSpec[]
  data: Row[]
  rowKey?: string
  cellRenderer?: (cell: ColumnData, column: ColumnSpec, id: string) => JSX.Element
  header?: boolean
} & JSX.HTMLAttributes<HTMLTableElement>

const MatrixTable: Component<MatrixTableProps> = (props) => {
  const cellRenderer = props.cellRenderer ?? ((cell) => <Boxed>{cell}</Boxed>)

  return (
    <table class={styles['table']} {...props}>
      {(props.header ?? true) && (
        <thead>
          <tr>
            <For each={props.columns}>{(column) => <th>{column.name}</th>}</For>
          </tr>
        </thead>
      )}
      <tbody>
        <For each={props.data}>
          {(row) => (
            <tr>
              <For each={props.columns}>
                {(column) => (
                  <td>
                    {cellRenderer(
                      row[column.key],
                      column,
                      String(row[props.rowKey || 'id'] || ''),
                    )}
                  </td>
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
