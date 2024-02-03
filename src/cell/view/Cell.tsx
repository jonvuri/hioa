import { Component, For } from 'solid-js'
import { debugOwnerSignals, debugProps } from '@solid-devtools/logger'

import Button from 'solid-surfaces/components/Button'
import Input from 'solid-surfaces/components/Input'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Subheader } from 'solid-surfaces/components/typo/Header'

import { createCell, updateCellDefinition } from '../harmonizer'
import { Cell, CellType, TextCell } from '../types'

import styles from './Cell.module.sass'

const rootIdForCell = (cell: Cell) => cell.root_id || cell.id

type ListCellBodyProps = {
  cell: Cell
  cellsInRoot: Cell[]
}

const ListCellBody: Component<ListCellBodyProps> = (props) => {
  const addListCell = () => {
    createCell(
      CellType.List,
      props.cell.id,
      rootIdForCell(props.cell),
      `list cell * ${props.cellsInRoot.length + 1}`,
    )
  }

  const addTextCell = () => {
    createCell(
      CellType.Text,
      props.cell.id,
      rootIdForCell(props.cell),
      `text cell * ${props.cellsInRoot.length + 1}`,
    )
  }

  return (
    <>
      <For
        each={props.cellsInRoot.filter((cell) => cell.parent_id === props.cell.id)}
        fallback={<div>[ no cells in list ]</div>}
      >
        {(cell) => <HeaderedCell cell={cell} cellsInRoot={props.cellsInRoot} />}
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
  debugProps(props)
  debugOwnerSignals()

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const definition = {
      ...props.cell.definition,
      text: target.value,
    }
    console.log('Updating cell definition', { cell: props.cell, val: target.value })
    updateCellDefinition(props.cell.id, definition)
  }

  return (
    <Boxed>
      <Dimmed>{props.cell.id}</Dimmed>
      <Input type="text" onInput={handleInput} value={props.cell.definition.text || ''} />
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
  cellsInRoot: Cell[]
}

export const CellContents: Component<CellContentsProps> = (props) => {
  return (
    <div class={styles['cell-contents-container']}>
      {props.cell.type === CellType.List ? (
        <ListCellBody cell={props.cell} cellsInRoot={props.cellsInRoot} />
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
  cellsInRoot: Cell[]
}

const HeaderedCell: Component<HeaderedCellProps> = (props) => {
  return (
    <div class={styles['cell-container']}>
      <CellHeader cell={props.cell} />
      <CellContents cell={props.cell} cellsInRoot={props.cellsInRoot} />
    </div>
  )
}
