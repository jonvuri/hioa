import { Component, For, Match, Switch, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import Input from 'solid-surfaces/components/Input'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

import { deleteMatrixRows, insertMatrixRow } from '../../../harmonizer'
import { MatrixCell, MatrixColumnDefinition } from '../../../types'

import { RowSelection } from './selection'
import styles from './RowInput.module.sass'

type RowInputProps = {
  cell: MatrixCell
  columnDefs: MatrixColumnDefinition[] // These must come separately from cell for reactivity
  rowSelection: RowSelection
}

const RowInput: Component<RowInputProps> = (props) => {
  const [inputStore, setInputStore] = createStore<{
    [column_id: string]: {
      columnDef: MatrixColumnDefinition
      inputState: {
        value: string
      }
    }
  }>({})

  const resetInputs = ({ retainInputValues }: { retainInputValues: boolean }) => {
    const columnDefs = props.columnDefs
    // When harmonicsRows changes, update inputStore.
    // This will trigger re-render of inputs.
    // TODO: Retain or reset input values after re-render.
    if (columnDefs) {
      setInputStore((inputStore) =>
        Object.fromEntries(
          columnDefs.map((column) => [
            column.key,
            {
              columnDef: column,
              inputState: {
                value: retainInputValues
                  ? inputStore[column.key]?.inputState?.value || ''
                  : '',
              },
            },
          ]),
        ),
      )
    }
  }

  createEffect(() => resetInputs({ retainInputValues: true }))

  const updateInput = (column_id: string, value: string) => {
    setInputStore(column_id, 'inputState', 'value', value)
  }

  const valid = (value: string) => {
    return value.trim().length > 0
  }

  const allValid = () => {
    return Object.values(inputStore).every((input) => valid(input.inputState.value))
  }

  const commitInsert = () => {
    if (allValid()) {
      const column_ids = props.columnDefs.map((column) => column.key)
      const values = column_ids.map(
        (column_id) => inputStore[column_id]?.inputState.value,
      )
      insertMatrixRow(props.cell.definition.matrix_id, column_ids, values)
      resetInputs({ retainInputValues: false })
    }
  }

  const selectionLength = () => Object.keys(props.rowSelection()).length

  return (
    <tr classList={{ [styles.container!]: true }}>
      <td>{selectionLength()}</td>
      <Switch>
        <Match when={selectionLength() > 0}>
          <button
            onClick={() => {
              const selection = props.rowSelection()

              if (selection) {
                const ids = Object.keys(selection).filter((id) => selection[id])
                deleteMatrixRows(props.cell.definition.matrix_id, ids)
              } else {
                throw new Error('SelectionCell: selection meta not found')
              }
            }}
          >
            Delete
          </button>
        </Match>
        <Match when={true}>
          <For each={Object.entries(inputStore)}>
            {([column_id, column]) => (
              <td>
                <Tagged
                  accent={valid(column.inputState.value)}
                  innerTopLeft
                  innerBottomLeft={allValid()}
                >
                  <Input
                    placeholder={column.columnDef.name}
                    onInput={[
                      (column_id: string, event) => {
                        updateInput(column_id, event.currentTarget.value)
                      },
                      column_id,
                    ]}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitInsert()
                      }
                    }}
                    value={column.inputState.value}
                  />
                </Tagged>
              </td>
            )}
          </For>
        </Match>
      </Switch>
    </tr>
  )
}

export default RowInput
