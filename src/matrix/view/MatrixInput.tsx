import { Accessor, Component, For, Match, Show, Switch, createSignal } from 'solid-js'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Input from 'solid-surfaces/components/Input'
import { Transition } from 'solid-transition-group'

import { addMatrixColumn, getMatrixHarmonics, ColumnType } from '../harmonizer'
import Button from 'solid-surfaces/components/Button'

import styles from './MatrixInput.module.sass'

const DEFAULT_COLUMN_TYPE = ColumnType.Text

type MatrixInputProps = {
  matrix_id: Accessor<string>
}

const MatrixInput: Component<MatrixInputProps> = (props) => {
  const harmonics = getMatrixHarmonics(props.matrix_id)

  const [addingNewColumn, setAddingNewColumn] = createSignal<'rest' | 'input' | 'commit'>(
    'rest',
  )
  const [newColumnType, setNewColumnType] = createSignal<ColumnType>(DEFAULT_COLUMN_TYPE)
  const [newColumnName, setNewColumnName] = createSignal('')

  const handleCommitNewColumn = async () => {
    setAddingNewColumn('commit')

    try {
      await addMatrixColumn(props.matrix_id(), newColumnName(), newColumnType())
    } catch (e) {
      console.error('Error adding column: ', e)
    }

    setAddingNewColumn('rest')
    setNewColumnName('')
    setNewColumnType(DEFAULT_COLUMN_TYPE)
  }

  return (
    <Transition name="matrix-fade">
      <Boxed class={styles.container}>
        <Show
          when={!harmonics.loading}
          fallback={<div>[ m input req .. ] [{props.matrix_id()}]</div>}
        >
          <Show
            when={harmonics?.result?.column_definitions?.length}
            fallback={<Dimmed>[ no columns yet ]</Dimmed>}
          >
            <For each={harmonics?.result?.column_definitions}>
              {(column) => <Input placeholder={column.column_name} />}
            </For>
          </Show>
          <Switch>
            <Match when={addingNewColumn() === 'rest'}>
              <Dimmed>
                <Button
                  onClick={() => {
                    setAddingNewColumn('input')
                  }}
                >
                  [ + Add new column ]
                </Button>
              </Dimmed>
            </Match>
            <Match when={addingNewColumn() === 'input'}>
              <select
                name="columnType"
                onChange={(e: Event) => {
                  const target = e.currentTarget as HTMLSelectElement
                  setNewColumnType(target.value as ColumnType)
                }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
              </select>
              <Input
                placeholder="New column name"
                onInput={(e) => {
                  setNewColumnName(e.currentTarget.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommitNewColumn()
                  }
                }}
              />
            </Match>
            <Match when={addingNewColumn() === 'commit'}>
              <Dimmed>[ adding {newColumnName()} ]</Dimmed>
            </Match>
          </Switch>
        </Show>
      </Boxed>
    </Transition>
  )
}

export default MatrixInput
