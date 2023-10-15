import { Component, For, createSignal } from 'solid-js'
import { Transition } from 'solid-transition-group'
import Input from 'solid-surfaces/components/Input'
import { Grid } from 'solid-surfaces/components/Grid'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'

import { createMatrix, listMatrices } from '../harmonizer'

import styles from './RootMatrix.module.sass'

type RootMatrixProps = {
  onSelectMatrix: (matrix_id: string) => void
}

const RootMatrix: Component<RootMatrixProps> = (props) => {
  const [newMatrixName, setNewMatrixName] = createSignal('')

  const [matricesRows, matricesQueryState] = listMatrices()

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setNewMatrixName(target.value)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      createMatrix(newMatrixName())
      setNewMatrixName('')
    }
  }

  return (
    <>
      <Grid full class={styles['main-header']}>
        <Tagged bottom>
          <ContrastHeader>Root Matrix</ContrastHeader>
        </Tagged>
      </Grid>
      <Grid full subgrid row_template="1fr auto">
        <Grid full>
          <Transition name="matrix-fade">
            <div>
              {matricesQueryState().loading ? (
                '[ m matrices load ]'
              ) : (
                <For each={matricesRows() || []}>
                  {(matrix) => (
                    <div
                      class={styles['matrix-row']}
                      onClick={() => props.onSelectMatrix(matrix.matrix_id)}
                    >
                      {matrix.matrix_name} [{matrix.matrix_id}]
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
              label="Insert new matrix"
              placeholder="Matrix name"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              value={newMatrixName()}
            />
          </Boxed>
        </Grid>
      </Grid>
    </>
  )
}

export default RootMatrix
