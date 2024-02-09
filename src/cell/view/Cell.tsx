import { Accessor, Component, For, createContext, onMount, useContext } from 'solid-js'

import Button from 'solid-surfaces/components/Button'
import Input from 'solid-surfaces/components/Input'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Subheader } from 'solid-surfaces/components/typo/Header'

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

  return (
    <>
      <For
        each={cellsInRoot().filter((cell) => cell.parent_id === props.cell.id)}
        fallback={<div>[ no cells in list ]</div>}
      >
        {(cell) => <HeaderedCell cell={cell} />}
      </For>
      <Button onClick={addListCell}>Add list cell</Button>
      <Button onClick={addTextCell}>Add text cell</Button>
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

  const handleDelete = () => {
    deleteCell(props.cell.id)
  }

  onMount(() => {
    input!.value = props.cell.definition.text
  })

  return (
    <Boxed>
      <div>
        <Dimmed>{props.cell.id}</Dimmed>
        <Button onClick={handleDelete}>x</Button>
      </div>
      <Input type="text" ref={input} onInput={handleInput} />
    </Boxed>
  )
}

type CellHeaderProps = {
  cell: Cell
}

const CellHeader: Component<CellHeaderProps> = (props) => {
  return (
    <Tagged>
      <div class={styles['cell-header-container']}>
        <div style={{ display: 'flex' }}>
          <Subheader margin={false}>{props.cell.name}</Subheader>{' '}
          <Dimmed>[{props.cell.id}]</Dimmed>
        </div>
      </div>
    </Tagged>
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
      ) : (
        <div>[ unknown cell type ]</div>
      )}
    </div>
  )
}

type HeaderedCellProps = {
  cell: Cell
}

const HeaderedCell: Component<HeaderedCellProps> = (props) => {
  return (
    <div class={styles['cell-container']}>
      <CellHeader cell={props.cell} />
      <CellContents cell={props.cell} />
    </div>
  )
}
