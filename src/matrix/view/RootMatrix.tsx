import { Component, For, Show, createSignal, onCleanup } from 'solid-js'
import Button from 'solid-surfaces/components/Button'
import Input from 'solid-surfaces/components/Input'
import { Transition } from 'solid-transition-group'

import { createMatrix } from '../harmonizer'
import { subscribeSql } from '../../db/client'

import styles from './RootMatrix.module.sass'
import Matrix from './Matrix'

const RootMatrix: Component = () => {
  const [newMatrixName, setNewMatrixName] = createSignal('')
  const [selectedMatrixId, setSelectedMatrixId] = createSignal('')
  const [hideMatrix, setHideMatrix] = createSignal(false)

  const [matrices, cleanup] = subscribeSql<{ matrix_id: string; matrix_name: string }>(
    `
      SELECT
        matrix_id,
        matrix_name
      FROM
        __MatrixHarmonics;
    `,
  )

  onCleanup(cleanup)

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setNewMatrixName(target.value)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      createMatrix(newMatrixName())
    }
  }

  const handleMatrixSelect = (matrixId: string) => () => {
    setSelectedMatrixId(matrixId)
  }

  const handleToggleHideMatrix = () => {
    setHideMatrix(!hideMatrix())
  }

  return (
    <>
      <Input
        type="text"
        label="Insert new matrix"
        placeholder="Matrix name"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      {matrices.loading ? (
        '[ m list load .. ]'
      ) : (
        <For each={matrices.result || []}>
          {(matrix) => (
            <div
              class={styles['matrix-row']}
              onClick={handleMatrixSelect(matrix.matrix_id)}
            >
              {matrix.matrix_name} [{matrix.matrix_id}]
            </div>
          )}
        </For>
      )}
      <Button onClick={handleToggleHideMatrix}>
        {hideMatrix() ? 'Show matrix' : 'Hide matrix'}
      </Button>
      <Transition name="matrix-fade">
        <Show when={!hideMatrix()}>
          {!hideMatrix() && selectedMatrixId() && (
            <div>
              <div>[ selected matrix: {selectedMatrixId()} ]</div>
              <Matrix matrix_id={selectedMatrixId} />
            </div>
          )}
        </Show>
      </Transition>
    </>
  )
}

export default RootMatrix
