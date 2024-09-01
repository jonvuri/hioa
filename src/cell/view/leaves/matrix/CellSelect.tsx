import { Component, createSignal } from 'solid-js'
import Boxed from 'solid-surfaces/components/stellation/Boxed'

import cellStyles from './Cell.module.sass'
import styles from './CellSelect.module.sass'

type SelectionCellProps = {
  value: boolean
  onChange: (value: boolean) => void
}

const SelectionCell: Component<SelectionCellProps> = (props) => {
  // TODO: Refactor to deal with reactivity warning
  // https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/reactivity.md
  const [checked, setChecked] = createSignal(props.value)

  return (
    <Boxed
      classList={{
        [cellStyles['cell']!]: true,
        [styles['cell-container']!]: true,
        [styles['checked']!]: checked(),
      }}
    >
      <label class={styles['label']}>
        <input
          type="checkbox"
          class={styles['checkbox']}
          checked={props.value}
          onChange={(event) => {
            props.onChange(event.currentTarget.checked)
            setChecked(event.currentTarget.checked)
          }}
        />
      </label>
    </Boxed>
  )
}

export default SelectionCell
