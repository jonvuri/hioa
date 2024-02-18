import {
  Accessor,
  Component,
  For,
  createContext,
  createMemo,
  onMount,
  useContext,
} from 'solid-js'

import Button from 'solid-surfaces/components/Button'
import Input from 'solid-surfaces/components/Input'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { GutterHeader } from 'solid-surfaces/components/typo/Header'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

import MatrixCell from './MatrixCell'
import { createCell, deleteCell, updateCellDefinition } from '../harmonizer'
import { Cell, CellType, TextCell } from '../types'

import styles from './Cell.module.sass'

const rootIdForCell = (cell: Cell) => cell.root_id || cell.id

export const CellsInRootContext = createContext<Accessor<Cell[]>>(() => [])

type ListCellBodyProps = {
  cell: Cell
}

const ListCellBody: Component<ListCellBodyProps> = (props) => {
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
          {(cell) => <HeaderedCell cell={cell} />}
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

type TextCellBodyProps = {
  cell: TextCell
}

const TextCellBody: Component<TextCellBodyProps> = (props) => {
  let input: HTMLInputElement | undefined

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const definition = {
      ...props.cell.definition,
      text: target.value,
    }
    updateCellDefinition(props.cell.id, definition)
  }

  onMount(() => {
    input!.value = props.cell.definition.text
  })

  return <Input type="text" ref={input} onInput={handleInput} />
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
        <ListCellBody cell={props.cell} />
      ) : props.cell.type === CellType.Text ? (
        <TextCellBody cell={props.cell} />
      ) : props.cell.type === CellType.Matrix ? (
        <MatrixCell cell={props.cell} />
      ) : (
        <div>[ unknown cell type ]</div>
      )}
    </div>
  )
}

type HeaderedCellProps = {
  cell: Cell
}

const HeaderedCell: Component<HeaderedCellProps> = (props) => (
  <Tagged classList={{ [styles['cell-container']!]: true }} topLeft>
    <CellHeader cell={props.cell} />
    <CellContents cell={props.cell} />
  </Tagged>
)
