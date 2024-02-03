import { Component, Show, createMemo, from, JSX } from 'solid-js'

import { getCell, listCellsInRoot } from '../harmonizer'
import { Cell } from '../types'

const rootIdForCell = (cell: Cell) => cell.root_id || cell.id

type CellLoaderProps = {
  cell_id: string
  loading_view: () => JSX.Element
  error_view: (error: string) => JSX.Element
  cell_view: (cell: Cell, cellsInRoot: Cell[]) => JSX.Element
}

// TODO: Fully memoize, keyed on cell ids
const CellLoader: Component<CellLoaderProps> = (props) => {
  const cellQueryState = createMemo(() => from(getCell(props.cell_id)))
  const cellsInRootQueryState = createMemo(() => {
    const cell = cellQueryState()?.()?.result

    if (cell) {
      const root_id = rootIdForCell(cell)
      return from(listCellsInRoot(root_id))
    }
  })

  return (
    <Show
      when={
        cellQueryState()?.() &&
        cellsInRootQueryState()?.() &&
        !(cellQueryState()?.()?.loading || cellsInRootQueryState()?.()?.loading)
      }
      fallback={props.loading_view()}
    >
      <Show
        when={!(cellQueryState()?.()?.error || cellsInRootQueryState()?.()?.error)}
        fallback={props.error_view(
          cellQueryState()?.()?.error || cellsInRootQueryState()?.()?.error || '',
        )}
      >
        {props.cell_view(
          cellQueryState()()!.result as Cell,
          cellsInRootQueryState()!()!.rows || [],
        )}
      </Show>
    </Show>
  )
}

export default CellLoader
