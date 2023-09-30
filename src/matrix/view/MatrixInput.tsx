import { Accessor, Component, For, Show } from 'solid-js'
import Input from 'solid-surfaces/components/Input'
import Boxed from 'solid-surfaces/components/stellation/Boxed'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Transition } from 'solid-transition-group'

import { getMatrixHarmonics } from '../harmonizer'

import NewColumnInput from './NewColumnInput'

import styles from './MatrixInput.module.sass'

type MatrixInputProps = {
  matrix_id: Accessor<string>
}

const MatrixInput: Component<MatrixInputProps> = (props) => {
  const harmonics = getMatrixHarmonics(props.matrix_id)

  return (
    <Transition name="matrix-fade">
      <Boxed class={styles.container}>
        <Show
          when={!harmonics.loading}
          fallback={<div>[ m input req .. ] [{props.matrix_id()}]</div>}
        >
          <Show
            when={harmonics?.result?.column_definitions?.length}
            fallback={<Dimmed>[ no columns yet ]</Dimmed>}
          >
            <For each={harmonics?.result?.column_definitions}>
              {(column) => <Input placeholder={column.column_name} />}
            </For>
          </Show>
          <NewColumnInput matrix_id={props.matrix_id} />
        </Show>
      </Boxed>
    </Transition>
  )
}

export default MatrixInput
