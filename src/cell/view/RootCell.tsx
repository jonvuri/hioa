import { Accessor, Component } from 'solid-js'
import { Transition } from 'solid-transition-group'

import Button from 'solid-surfaces/components/Button'
import { Grid } from 'solid-surfaces/components/Grid'
import Lined from 'solid-surfaces/components/stellation/Lined'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed, Shimmer } from 'solid-surfaces/components/typo/Color'
import { ContrastHeader, Header } from 'solid-surfaces/components/typo/Header'

import { CellContents } from './Cell'
import CellLoader from './CellLoader'

import { Cell } from '../types'

import styles from './RootCell.module.sass'

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
      <Grid full classList={{ [styles['grid-container']!]: true }}>
        <Transition name="matrix-fade">
          <CellLoader
            cell_id={props.cell_id()}
            loading_view={() => <div>[ m load cell .. ] [{props.cell_id()}]</div>}
            error_view={(error) => <div>[ m load error ! ] [ {error} ]</div>}
            cell_view={(cell, cellsInRoot) => (
              <div class={styles.container}>
                <RootCellHeader cell={cell} />
                <CellContents cell={cell} cellsInRoot={cellsInRoot} />
              </div>
            )}
          />
        </Transition>
      </Grid>
    </>
  )
}

export default RootCell
