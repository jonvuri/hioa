import { Accessor, Component, For, createContext, createMemo, useContext } from 'solid-js'

import Button from 'solid-surfaces/components/Button'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { GutterHeader } from 'solid-surfaces/components/typo/Header'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

import MatrixCell from './leaves/MatrixCell'
import TextCell from './leaves/TextCell'
import { createCell, deleteCell } from '../harmonizer'
import { Cell, CellType } from '../types'

import styles from './BranchCell.module.sass'

const rootIdForCell = (cell: Cell) => cell.root_id || cell.id

export const CellsInRootContext = createContext<Accessor<Cell[]>>(() => [])

type ListCellProps = {
  cell: Cell
}

const ListCell: Component<ListCellProps> = (props) => {
  const cellsInRoot = useContext(CellsInRootContext)

  const addListCell = () => {
    createCell(
      CellType.List,
      props.cell.id,
      rootIdForCell(props.cell),
      `list cell * ${cellsInRoot.length + 1}`,
    )
  }

  const addTextCell = () => {
    createCell(
      CellType.Text,
      props.cell.id,
      rootIdForCell(props.cell),
      `text cell * ${cellsInRoot.length + 1}`,
    )
  }

  const addMatrixCell = () => {
    createCell(
      CellType.Matrix,
      props.cell.id,
      rootIdForCell(props.cell),
      `matrix cell * ${cellsInRoot.length + 1}`,
    )
  }

  const listCells = createMemo(() =>
    cellsInRoot().filter((cell) => cell.parent_id === props.cell.id),
  )

  return (
    <>
      <div class={styles['list-cell']}>
        <For each={listCells()} fallback={<div>[ no cells in list ]</div>}>
          {(cell) => <BranchCell cell={cell} />}
        </For>
      </div>
      <div class={styles['list-cell-toolbar']}>
        <Button onClick={addListCell}>Add list cell</Button>
        <Button onClick={addTextCell}>Add text cell</Button>
        <Button onClick={addMatrixCell}>Add matrix cell</Button>
      </div>
    </>
  )
}

type CellHeaderProps = {
  cell: Cell
}

const CellHeader: Component<CellHeaderProps> = (props) => {
  const handleDelete = () => {
    deleteCell(props.cell)
  }

  return (
    <div class={styles['cell-header-container']}>
      <div class={styles['cell-header-title']}>
        <GutterHeader margin={false} classList={{ [styles['cell-title']!]: true }}>
          {props.cell.name}
        </GutterHeader>
        &nbsp;&nbsp;
        <Dimmed>[{props.cell.id}]</Dimmed>
      </div>
      <div>
        <Button onClick={handleDelete}>x</Button>
      </div>
    </div>
  )
}

type CellContentsProps = {
  cell: Cell
}

export const CellContents: Component<CellContentsProps> = (props) => {
  return (
    <div class={styles['cell-contents-container']}>
      {props.cell.type === CellType.List ? (
        <ListCell cell={props.cell} />
      ) : props.cell.type === CellType.Text ? (
        <TextCell cell={props.cell} />
      ) : props.cell.type === CellType.Matrix ? (
        <MatrixCell cell={props.cell} />
      ) : (
        <div>[ unknown cell type ]</div>
      )}
    </div>
  )
}

type BranchCellProps = {
  cell: Cell
}

const BranchCell: Component<BranchCellProps> = (props) => (
  <Tagged classList={{ [styles['cell-container']!]: true }} topLeft>
    <CellHeader cell={props.cell} />
    <CellContents cell={props.cell} />
  </Tagged>
)
