import { Accessor, Component, Show, createMemo, from } from 'solid-js'
import { Transition } from 'solid-transition-group'
import Button from 'solid-surfaces/components/Button'
import { Grid } from 'solid-surfaces/components/Grid'
import Lined from 'solid-surfaces/components/stellation/Lined'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed, Shimmer } from 'solid-surfaces/components/typo/Color'
import { ContrastHeader, Header } from 'solid-surfaces/components/typo/Header'

import { getCell, listCellsInRoot } from '../harmonizer'
import { Cell } from '../types'

import { CellContents, CellsInRootContext } from './BranchCell'
import styles from './RootCell.module.sass'

const rootIdForCell = (cell: Cell) => cell.root_id || cell.id

type RootCellHeaderProps = {
  cell: Cell
}

const RootCellHeader: Component<RootCellHeaderProps> = (props) => {
  return (
    <Lined>
      <div class={styles['header-container']}>
        <div style={{ display: 'flex' }}>
          <Header margin={false}>
            <Shimmer>{props.cell.name}</Shimmer>
          </Header>{' '}
          <Dimmed>[{props.cell.id}]</Dimmed>
        </div>
      </div>
    </Lined>
  )
}

type CellLoaderProps = {
  cell_id: string
}

// TODO: Experiment with keyed / memoizing more
const CellLoader: Component<CellLoaderProps> = (props) => {
  const cellQueryState = createMemo(() => from(getCell(props.cell_id)))
  const cellsInRootQueryState = createMemo(() => {
    const cell = cellQueryState()?.()?.result

    if (cell) {
      const root_id = rootIdForCell(cell)
      return from(listCellsInRoot(root_id))
    }
  })

  const loading = createMemo(
    () => cellQueryState()?.()?.loading || cellsInRootQueryState()?.()?.loading,
  )
  const error = createMemo(
    () => cellQueryState()?.()?.error || cellsInRootQueryState()?.()?.error,
  )

  const cell = createMemo(() => cellQueryState()?.()?.result)
  const cellsInRoot = createMemo(() => cellsInRootQueryState()?.()?.rows || [])

  return (
    <Show when={!loading()} fallback={<div>[ m load cell .. ] [{props.cell_id}]</div>}>
      <Show
        when={!error()}
        fallback={
          <div>
            [ m load error ! ] [{' '}
            {cellQueryState()?.()?.error || cellsInRootQueryState()?.()?.error || ''} ]
          </div>
        }
      >
        <Show when={cell()} fallback={<div>[ m no cell ]</div>} keyed>
          {(cell) => (
            <Show when={cellsInRoot()} fallback={<div>[ m no cells in root ]</div>}>
              {(cellsInRoot) => (
                <div class={styles.container}>
                  <RootCellHeader cell={cell} />
                  <CellsInRootContext.Provider value={cellsInRoot}>
                    <CellContents cell={cell} />
                  </CellsInRootContext.Provider>
                </div>
              )}
            </Show>
          )}
        </Show>
      </Show>
    </Show>
  )
}

type RootCellProps = {
  cell_id: Accessor<string>
  onClose: () => void
}

const RootCell: Component<RootCellProps> = (props) => {
  return (
    <>
      <Grid full>
        <div style={{ display: 'flex' }}>
          <Tagged bottomLeft>
            <ContrastHeader>Cell</ContrastHeader>
          </Tagged>
          <Button onClick={props.onClose}>Close</Button>
        </div>
      </Grid>
      <Grid full>
        <Transition name="matrix-fade">
          <CellLoader cell_id={props.cell_id()} />
        </Transition>
      </Grid>
    </>
  )
}

export default RootCell
