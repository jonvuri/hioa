import { Accessor, Component, Show, createMemo } from 'solid-js'
import Table from 'solid-surfaces/components/Table'
import { Transition } from 'solid-transition-group'

import { getMatrixHarmonics, getMatrix } from '../harmonizer'
import { Header } from 'solid-surfaces/components/typo/Header'

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

  const columnSpecs = createMemo(() => {
    const result = harmonics?.result

    return (
      result?.[0] &&
      (JSON.parse(result[0].column_definitions).map((def: ColumnDefinition) => ({
        key: def.column_id,
        name: def.column_name,
      })) ||
        [])
    )
  })

  const name = () => harmonics?.result?.[0].matrix_name

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonics.loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <Show
          when={!matrixStore.error}
          fallback={<div>[ m load error ! ] [{harmonics.error}]</div>}
        >
          <div>
            <Header>{name()}</Header> [{props.matrix_id()}]
            <Table columns={columnSpecs()} data={matrixStore.result!} />
          </div>
        </Show>
      </Show>
    </Transition>
  )
}

export default Matrix
