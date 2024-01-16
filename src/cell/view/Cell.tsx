import { Accessor, Component, Show } from 'solid-js'
import { Transition } from 'solid-transition-group'

import Button from 'solid-surfaces/components/Button'
import { Grid } from 'solid-surfaces/components/Grid'
import Lined from 'solid-surfaces/components/stellation/Lined'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { Dimmed, Shimmer } from 'solid-surfaces/components/typo/Color'
import { ContrastHeader, Header } from 'solid-surfaces/components/typo/Header'

import { getCell } from '../harmonizer'

import styles from './Cell.module.sass'

type CellProps = {
  cell_id: Accessor<string>
  onClose: () => void
}

const Cell: Component<CellProps> = (props) => {
  const [cell, cellQueryState] = getCell(props.cell_id)

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
      <Grid full classList={{ [styles['grid-container']]: true }}>
        <Transition name="matrix-fade">
          <Show
            when={!cellQueryState().loading}
            fallback={<div>[ m load cell .. ] [{props.cell_id()}]</div>}
          >
            <Show
              when={!cellQueryState().error}
              fallback={
                <div>
                  [ m load error ! ] [
                  {cellQueryState().error && ` ${cellQueryState().error} `}]
                </div>
              }
            >
              <div class={styles.container}>
                <Lined>
                  <div class={styles['header-container']}>
                    <div style={{ display: 'flex' }}>
                      <Header margin={false}>
                        <Shimmer>{cell()?.name}</Shimmer>
                      </Header>{' '}
                      <Dimmed>[{props.cell_id()}]</Dimmed>
                    </div>
                  </div>
                </Lined>
                <div class={styles['body-container']}>
                  <pre>{JSON.stringify(cell(), null, 2)}</pre>
                </div>
              </div>
            </Show>
          </Show>
        </Transition>
      </Grid>
    </>
  )
}

export default Cell
