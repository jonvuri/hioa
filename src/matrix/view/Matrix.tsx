import {
  Accessor,
  Component,
  Show,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
} from 'solid-js'
import Table from 'solid-surfaces/components/Table'
import { Transition } from 'solid-transition-group'

import { getMatrixHarmonics } from '../harmonizer'
import { subscribeSql } from '../../db/client'
import { Header } from 'solid-surfaces/components/typo/Header'

type MatrixProps = {
  matrix_id: Accessor<string>
}

const Matrix: Component<MatrixProps> = (props) => {
  const [harmonics] = createResource(props.matrix_id, getMatrixHarmonics)

  const subscribe = createMemo<ReturnType<typeof subscribeSql> | null>((prev) => {
    if (prev) {
      const cleanup = prev[1]
      cleanup()
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subscribeSql<any>(`SELECT * FROM ${props.matrix_id()}`)
  }, null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (subscribe()?.[0]?.result || []) as any[]

  createEffect(() => {
    const cleanup = subscribe()?.[1]

    if (cleanup) {
      onCleanup(cleanup)
    }
  })

  const columnSpecs = () =>
    harmonics()?.column_definitions.map((def) => ({
      key: def.column_id,
      name: def.column_name,
    })) || []

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonics.loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <div>
          <Header>{harmonics()?.matrix_name}</Header> [{props.matrix_id()}]
          <Table columns={columnSpecs()} data={result} />
        </div>
      </Show>
    </Transition>
  )
}

export default Matrix
