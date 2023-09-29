import { Accessor, Component, Show } from 'solid-js'
import Table from 'solid-surfaces/components/Table'
import { Transition } from 'solid-transition-group'

import { getMatrixHarmonics, getMatrix } from '../harmonizer'
import { Header } from 'solid-surfaces/components/typo/Header'

import styles from './Matrix.module.sass'

type MatrixProps = {
  matrix_id: Accessor<string>
}

const Matrix: Component<MatrixProps> = (props) => {
  const harmonics = getMatrixHarmonics(props.matrix_id)

  const matrixStore = getMatrix(props.matrix_id)

  type ColumnDefinition = {
    column_id: string
    column_name: string
  }

  const name = () => harmonics?.result?.matrix_name
  const columnSpecs = () =>
    harmonics?.result?.column_definitions.map((column: ColumnDefinition) => ({
      key: column.column_id,
      name: column.column_name,
    })) || []

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonics.loading && !matrixStore.loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <Show
          when={!harmonics.error && !matrixStore.error}
          fallback={
            <div>
              [ m load error ! ] [{harmonics.error && ` ${harmonics.error} `}
              {matrixStore.error && ` ${matrixStore.error} `}]
            </div>
          }
        >
          <div class={styles.container}>
            <Header>{name()}</Header> [{props.matrix_id()}]
            <Table columns={columnSpecs()} data={matrixStore.result!} />
          </div>
        </Show>
      </Show>
    </Transition>
  )
}

export default Matrix
