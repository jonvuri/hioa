import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
} from 'solid-js'
import Table from 'solid-surfaces/components/Table'

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
    <>
      {harmonics.loading ? (
        <>[ m load matrix .. ] [{props.matrix_id()}]</>
      ) : (
        <>
          <Header>{harmonics()?.matrix_name}</Header> [{props.matrix_id()}]
          <Table columns={columnSpecs()} data={result} />
        </>
      )}
    </>
  )
}

export default Matrix
