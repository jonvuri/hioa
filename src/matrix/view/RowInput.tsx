import { Accessor, Component, For, Show, createSignal } from 'solid-js'
import Input from 'solid-surfaces/components/Input'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Transition } from 'solid-transition-group'

import { getMatrixHarmonics, insertRow } from '../harmonizer'

import NewColumnInput from './NewColumnInput'

import styles from './RowInput.module.sass'

type RowInputProps = {
  matrix_id: Accessor<string>
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

  return (
    <Transition name="matrix-fade">
      <Boxed class={styles.container}>
        {allValid() ? 'valid!' : 'invalid'}
        <Show
          when={!harmonicsQueryState().loading}
          fallback={<div>[ m input req .. ] [{props.matrix_id()}]</div>}
        >
          <Show
            when={harmonicsRows()?.column_definitions?.length}
            fallback={<Dimmed>[ no columns yet ]</Dimmed>}
          >
            <For each={harmonicsRows()?.column_definitions}>
              {(column) => (
                <>
                  [ column valid: {valid(columnInput(column.column_id)) ? 'yes' : 'no'} ]
                  <Input
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
                </>
              )}
            </For>
          </Show>
          <NewColumnInput matrix_id={props.matrix_id} />
        </Show>
      </Boxed>
    </Transition>
  )
}

export default RowInput
