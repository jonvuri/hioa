import { Accessor, Component, Show, createSelector, createSignal } from 'solid-js'
import { Transition } from 'solid-transition-group'

import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Lined from 'solid-surfaces/components/stellation/Lined'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Header } from 'solid-surfaces/components/typo/Header'

import CellInput from './CellInput'
import DeleteMatrix from './DeleteMatrix'
import MatrixTable from './MatrixTable'

import {
  getMatrixHarmonics,
  getMatrix,
  updateRow,
  ROW_ID_COLUMN_NAME,
} from '../harmonizer'

import styles from './Matrix.module.sass'

type MatrixProps = {
  matrix_id: Accessor<string>
  onClose: () => void
}

const Matrix: Component<MatrixProps> = (props) => {
  const [editingCellRowId, setEditingCellRowId] = createSignal<string | null>(null)
  const isCellRowSelected = createSelector(editingCellRowId)

  const [editingCellColumnKey, setEditingCellColumnKey] = createSignal<string | null>(
    null,
  )
  const isCellColumnSelected = createSelector(editingCellColumnKey)

  const handleSetCell = (rowId: string, columnId: string, value: string) => {
    updateRow(props.matrix_id(), rowId, columnId, value)
  }

  const harmonics = getMatrixHarmonics(props.matrix_id)
  const matrixStore = getMatrix(props.matrix_id)

  type ColumnDefinition = {
    column_id: string
    column_name: string
  }

  const name = () => harmonics?.result?.matrix_name
  const columnSpecs = () =>
    harmonics?.result?.column_definitions.map((column: ColumnDefinition) => ({
      key: column.column_id,
      name: column.column_name,
    })) || []

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonics.loading && !matrixStore.loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <Show
          when={!harmonics.error && !matrixStore.error}
          fallback={
            <div>
              [ m load error ! ] [{harmonics.error && ` ${harmonics.error} `}
              {matrixStore.error && ` ${matrixStore.error} `}]
            </div>
          }
        >
          <div class={styles.container}>
            <Lined>
              <div class={styles['header-container']}>
                <div style={{ display: 'flex' }}>
                  <Header margin={false}>{name()}</Header>{' '}
                  <Dimmed>[{props.matrix_id()}]</Dimmed>
                </div>
                <DeleteMatrix matrix_id={props.matrix_id} onClose={props.onClose} />
              </div>
            </Lined>
            <MatrixTable
              columns={columnSpecs()}
              data={matrixStore.result!}
              rowKey={ROW_ID_COLUMN_NAME}
              cellRenderer={(cell, column, rowId) => {
                const editing =
                  isCellRowSelected(rowId) && isCellColumnSelected(column.key)
                return editing ? (
                  <Boxed>
                    <CellInput
                      value={String(cell)}
                      onCommit={(value) => handleSetCell(rowId, column.key, value)}
                      onClose={() => {
                        setEditingCellRowId(null)
                        setEditingCellColumnKey(null)
                      }}
                    />
                  </Boxed>
                ) : (
                  <Boxed
                    classList={{ [styles.cell]: true }}
                    onClick={() => {
                      setEditingCellRowId(rowId)
                      setEditingCellColumnKey(column.key)
                    }}
                  >
                    {cell}
                  </Boxed>
                )
              }}
            />
          </div>
        </Show>
      </Show>
    </Transition>
  )
}

export default Matrix
