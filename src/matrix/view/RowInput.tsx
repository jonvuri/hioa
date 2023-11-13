import { Accessor, Component, For, Match, Switch, createSignal } from 'solid-js'
import Input from 'solid-surfaces/components/Input'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Transition } from 'solid-transition-group'

import { deleteRows, getMatrixHarmonics, insertRow } from '../harmonizer'
import { RowSelection } from './selection'

import styles from './RowInput.module.sass'

type RowInputProps = {
  matrix_id: Accessor<string>
  rowSelection: RowSelection
}

const RowInput: Component<RowInputProps> = (props) => {
  const [harmonicsRows, harmonicsQueryState] = getMatrixHarmonics(props.matrix_id)

  const [inputs, setInputs] = createSignal<Record<string, string> | null>(null)

  const updateInput = (column_id: string, value: string) => {
    let currentInputs = inputs()

    if (currentInputs === null) {
      currentInputs = Object.fromEntries(
        // Result will never be null because inputs are hidden till defined
        harmonicsRows()!.column_definitions.map((column) => [column.column_id, '']),
      )
    }

    setInputs({
      ...currentInputs,
      [column_id]: value,
    })
  }

  const commitInsert = () => {
    if (allValid()) {
      const column_defs = harmonicsRows()!.column_definitions
      const column_ids = column_defs.map((column) => column.column_id)
      const values = column_ids.map((column_id) => inputs()?.[column_id])
      insertRow(props.matrix_id(), column_ids, values)
      setInputs(null)
    }
  }

  const columnInput = (column_id: string) => inputs()?.[column_id] || ''

  const valid = (value: string) => {
    return value.trim().length > 0
  }

  const allValid = () => {
    const currentInputs = inputs()

    return currentInputs !== null && Object.values(currentInputs).every(valid)
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
          <Match when={allValid()}>
            <Dimmed>[m input all valid .. ] [{props.matrix_id()}]</Dimmed>
          </Match>
          <Match when={true}>
            <For each={harmonicsRows()?.column_definitions}>
              {(column) => (
                <td>
                  <Input
                    classList={{ [styles.valid]: valid(columnInput(column.column_id)) }}
                    placeholder={column.column_name}
                    value={columnInput(column.column_id)}
                    onInput={[
                      (column_id: string, event) => {
                        updateInput(column_id, event.currentTarget.value)
                      },
                      column.column_id,
                    ]}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitInsert()
                      }
                    }}
                  />
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
