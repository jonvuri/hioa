import { Accessor, createEffect, createSignal, on } from 'solid-js'

import { Row, RowId } from '../../../types'

export const useRowSelection = (data: Accessor<Row[]>) => {
  const [selection, setSelection] = createSignal<Record<string, boolean>>({})

  createEffect(
    on(data, () => {
      setSelection({})
    }),
  )

  const selectRow = (row_id: RowId) => {
    setSelection((selection) => {
      return {
        ...selection,
        [String(row_id)]: true,
      }
    })
  }

  const deselectRow = (row_id: RowId) => {
    setSelection((selection) => {
      const newSelection = {
        ...selection,
      }
      delete newSelection[String(row_id)]
      return newSelection
    })
  }

  return [selection, selectRow, deselectRow] as const
}

export type RowSelection = ReturnType<typeof useRowSelection>[0]
