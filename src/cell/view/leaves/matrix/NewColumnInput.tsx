import { Component, Match, Switch, createSignal } from 'solid-js'
import Button from 'solid-surfaces/components/Button'
import Input from 'solid-surfaces/components/Input'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Label } from 'solid-surfaces/components/typo/Label'

import { MatrixColumnType } from '../../../types'

import styles from './NewColumnInput.module.sass'

const DEFAULT_COLUMN_TYPE: MatrixColumnType = 'TEXT'

type NewColumnInputProps = {
  onAddColumn: (column_name: string, column_type: MatrixColumnType) => void
}

const NewColumnInput: Component<NewColumnInputProps> = (props) => {
  const [addingNewColumn, setAddingNewColumn] = createSignal<'rest' | 'input' | 'commit'>(
    'rest',
  )
  const [newColumnType, setNewColumnType] =
    createSignal<MatrixColumnType>(DEFAULT_COLUMN_TYPE)
  const [newColumnName, setNewColumnName] = createSignal('')

  const handleCommitNewColumn = async () => {
    setAddingNewColumn('commit')

    try {
      await props.onAddColumn(newColumnName(), newColumnType())
    } catch (e) {
      console.error('Error adding column: ', e)
    }

    setAddingNewColumn('rest')
    setNewColumnName('')
    setNewColumnType(DEFAULT_COLUMN_TYPE)
  }

  return (
    <div class={styles['container']}>
      <Switch>
        <Match when={addingNewColumn() === 'rest'}>
          <Dimmed classList={{ [styles['add-column-container']!]: true }}>
            <Button
              classList={{ [styles['add-column-button']!]: true }}
              onClick={() => {
                setAddingNewColumn('input')
              }}
            >
              Add new column +
            </Button>
          </Dimmed>
        </Match>
        <Match when={addingNewColumn() === 'input'}>
          <div classList={{ [styles['add-column-container']!]: true }}>
            <Tagged innerTopRight>
              <Label>Column type</Label>
              <select
                name="columnType"
                onChange={(e: Event) => {
                  const target = e.currentTarget as HTMLSelectElement
                  setNewColumnType(target.value as MatrixColumnType)
                }}
              >
                <option value="TEXT">Text</option>
                <option value="NUMERIC">Numeric</option>
              </select>
            </Tagged>
            <Tagged innerTopRight>
              <Label>Column name</Label>
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
            </Tagged>
          </div>
        </Match>
        <Match when={addingNewColumn() === 'commit'}>
          <Dimmed>[ adding {newColumnName()} ]</Dimmed>
        </Match>
      </Switch>
    </div>
  )
}

export default NewColumnInput
