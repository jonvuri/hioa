import { Accessor, Component, Show, createMemo } from 'solid-js'
import { Transition } from 'solid-transition-group'

import Lined from 'solid-surfaces/components/stellation/Lined'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Header } from 'solid-surfaces/components/typo/Header'

import DeleteMatrix from './DeleteMatrix'
import MatrixTable from './MatrixTable'

import { getMatrixHarmonics, getMatrix } from '../harmonizer'

import styles from './Matrix.module.sass'

type MatrixProps = {
  matrix_id: Accessor<string>
  onClose: () => void
}

const Matrix: Component<MatrixProps> = (props) => {
  const [harmonicsRows, harmonicsQueryState] = getMatrixHarmonics(props.matrix_id)
  const [matrixRows, matrixQueryState] = getMatrix(props.matrix_id)

  const name = () => harmonicsRows()?.matrix_name

  const columnSpecs = createMemo(
    () =>
      harmonicsRows()?.column_definitions.map((column) => ({
        key: column.column_id,
        name: column.column_name,
      })) || [],
  )

  const data = createMemo(() => matrixRows() || [])

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonicsQueryState().loading && !matrixQueryState().loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <Show
          when={!harmonicsQueryState().error && !matrixQueryState().error}
          fallback={
            <div>
              [ m load error ! ] [
              {harmonicsQueryState().error && ` ${harmonicsQueryState().error} `}
              {matrixQueryState().error && ` ${matrixQueryState().error} `}]
            </div>
          }
        >
          <div class={styles.container}>
            <Lined>
              <div class={styles['header-container']}>
                <div style={{ display: 'flex' }}>
                  <Header margin={false}>{name()}</Header>{' '}
                  <Dimmed>[{props.matrix_id()}]</Dimmed>
                </div>
                <DeleteMatrix matrix_id={props.matrix_id} onClose={props.onClose} />
              </div>
            </Lined>
            {data()?.length && (
              <MatrixTable
                matrix_id={props.matrix_id}
                columns={columnSpecs}
                data={data}
              />
            )}
          </div>
        </Show>
      </Show>
    </Transition>
  )
}

export default Matrix
