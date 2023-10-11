import { Component } from 'solid-js'
import Boxed from 'solid-surfaces/components/stellation/Boxed'

import cellStyles from './Cell.module.sass'

type SelectionCellProps = {
  value: boolean
  onChange: (value: boolean) => void
}

const SelectionCell: Component<SelectionCellProps> = (props) => (
  <Boxed classList={{ [cellStyles['cell']]: true }}>
    <input
      type="checkbox"
      checked={props.value}
      onChange={(event) => {
        props.onChange(event.currentTarget.checked)
      }}
    />
  </Boxed>
)

export default SelectionCell
