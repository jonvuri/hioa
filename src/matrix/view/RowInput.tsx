import { Accessor, Component, For, Match, Switch, createEffect, on } from 'solid-js'
import { createStore } from 'solid-js/store'

import Input from 'solid-surfaces/components/Input'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Transition } from 'solid-transition-group'

import {
  deleteRows,
  getMatrixHarmonics,
  insertRow,
  ColumnDefinition,
} from '../harmonizer'
import { RowSelection } from './selection'

import styles from './RowInput.module.sass'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

type RowInputProps = {
  matrix_id: Accessor<string>
  rowSelection: RowSelection
}

const RowInput: Component<RowInputProps> = (props) => {
  const [harmonicsRows, harmonicsQueryState] = getMatrixHarmonics(props.matrix_id)

  const [inputStore, setInputStore] = createStore<{
    [column_id: string]: {
      columnDef: ColumnDefinition
      inputState: {
        value: string
      }
    }
  }>({})

  const resetInputs = () => {
    const columnDefs = harmonicsRows()?.column_definitions
    // When harmonicsRows changes, update inputStore
    // This will trigger re-render of inputs
    if (columnDefs) {
      setInputStore(
        Object.fromEntries(
          columnDefs.map((column) => [
            column.column_id,
            {
              columnDef: column,
              inputState: {
                value: '',
              },
            },
          ]),
        ),
      )
    }
  }

  createEffect(
    on(harmonicsRows, () => {
      resetInputs()
    }),
  )

  const updateInput = (column_id: string, value: string) => {
    setInputStore(column_id, 'inputState', 'value', value)
  }

  const commitInsert = () => {
    if (allValid()) {
      const column_defs = harmonicsRows()!.column_definitions
      const column_ids = column_defs.map((column) => column.column_id)
      const values = column_ids.map((column_id) => inputStore[column_id].inputState.value)
      insertRow(props.matrix_id(), column_ids, values)
      resetInputs()
    }
  }

  const valid = (value: string) => {
    return value.trim().length > 0
  }

  const allValid = () => {
    return Object.values(inputStore).every((input) => valid(input.inputState.value))
  }

  const selectionLength = () => Object.keys(props.rowSelection()).length

  return (
    <Transition name="matrix-fade">
      <tr classList={{ [styles.container]: true }}>
        <td>{selectionLength()}</td>
        <Switch>
          <Match when={harmonicsQueryState().loading}>
            <div>[ m input req .. ] [{props.matrix_id()}]</div>
          </Match>
          <Match when={harmonicsQueryState().error}>
            <div>
              [ m input error ! ] [
              {harmonicsQueryState().error && ` ${harmonicsQueryState().error} `}]
            </div>
          </Match>
          <Match when={harmonicsRows()?.column_definitions?.length === 0}>
            <Dimmed>[m input no columns yet .. ] [{props.matrix_id()}]</Dimmed>
          </Match>
          <Match when={selectionLength() > 0}>
            <button
              onClick={() => {
                const selection = props.rowSelection()

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
                      placeholder={column.columnDef.column_name}
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
                    />
                  </Tagged>
                </td>
              )}
            </For>
          </Match>
        </Switch>
      </tr>
    </Transition>
  )
}

export default RowInput
