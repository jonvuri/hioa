import { Component, For, createSignal, from } from 'solid-js'
import { Transition } from 'solid-transition-group'
import Input from 'solid-surfaces/components/Input'
import { Grid } from 'solid-surfaces/components/Grid'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'

import { createCell, listRootCells } from '../harmonizer'
import { CellType } from '../types'

import styles from './Root.module.sass'

type RootProps = {
  onSelectCell: (cell_id: string) => void
}

const RootMatrix: Component<RootProps> = (props) => {
  const cells = from(listRootCells())

  const [newCellName, setNewCellName] = createSignal('')

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setNewCellName(target.value)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      createCell(CellType.List, null, null, newCellName())
      setNewCellName('')
    }
  }

  return (
    <>
      <Grid full>
        <Tagged bottomLeft>
          <ContrastHeader>Root</ContrastHeader>
        </Tagged>
      </Grid>
      <Grid full subgrid row_template="1fr auto">
        <Grid full>
          <Transition name="matrix-fade">
            <div>
              {cells()?.loading ? (
                '[ cells load ]'
              ) : cells()?.error ? (
                `[ cells error ! ] [ ${cells()?.error} ]`
              ) : (
                <For each={cells()?.rows || []}>
                  {(cell) => (
                    <div
                      class={styles['cell']}
                      onClick={() => props.onSelectCell(cell.id)}
                    >
                      {cell.name} [{cell.id}]
                    </div>
                  )}
                </For>
              )}
            </div>
          </Transition>
        </Grid>
        <Grid full>
          <Boxed>
            <Input
              type="text"
              label="Create new cell"
              placeholder="Cell name"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              value={newCellName()}
            />
          </Boxed>
        </Grid>
      </Grid>
    </>
  )
}

export default RootMatrix
