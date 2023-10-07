import { Component, For, createSignal } from 'solid-js'
import Input from 'solid-surfaces/components/Input'
import { Transition } from 'solid-transition-group'

import { createMatrix, listMatrices } from '../harmonizer'

import Matrix from './Matrix'
import RowInput from './RowInput'

import styles from './RootMatrix.module.sass'
import { Grid } from 'solid-surfaces/components/Grid'
import Boxed from 'solid-surfaces/components/stellation/Boxed'

const RootMatrix: Component = () => {
  const [newMatrixName, setNewMatrixName] = createSignal('')
  const [selectedMatrixId, setSelectedMatrixId] = createSignal('')

  const matrices = listMatrices()

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
    <Grid full subgrid row_template="1fr auto">
      <Grid full>
        <Transition name="matrix-fade">
          {selectedMatrixId() ? (
            <Matrix
              matrix_id={selectedMatrixId}
              onClose={() => setSelectedMatrixId('')}
            />
          ) : (
            <div>
              {matrices.loading ? (
                '[ m matrices load ]'
              ) : (
                <For each={matrices.result || []}>
                  {(matrix) => (
                    <div
                      class={styles['matrix-row']}
                      onClick={() => setSelectedMatrixId(matrix.matrix_id)}
                    >
                      {matrix.matrix_name} [{matrix.matrix_id}]
                    </div>
                  )}
                </For>
              )}
            </div>
          )}
        </Transition>
      </Grid>
      <Grid full>
        {selectedMatrixId() ? (
          <RowInput matrix_id={selectedMatrixId} />
        ) : (
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
        )}
      </Grid>
    </Grid>
  )
}

export default RootMatrix
