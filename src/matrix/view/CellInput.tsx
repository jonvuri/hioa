import { createSignal } from 'solid-js'
import Input from 'solid-surfaces/components/Input'
import Boxed from 'solid-surfaces/components/stellation/Boxed'

import cellStyles from './Cell.module.sass'
import styles from './CellInput.module.sass'

type CellInputProps = {
  value: string
  onCommit: (value: string) => void
}

const CellInput = (props: CellInputProps) => {
  let inputRef: HTMLInputElement
  const [value, setValue] = createSignal(props.value)
  const [editing, setEditing] = createSignal(false)

  const reset = () => {
    setValue(props.value)
    setEditing(false)
  }

  return (
    <Boxed
      classList={{ [cellStyles['cell']]: true, [styles['cell-container']]: true }}
      onClick={() => {
        inputRef.focus()
      }}
    >
      <Input
        ref={inputRef!}
        classList={{ [styles['input']]: true, [styles['editing']]: editing() }}
        value={value()}
        onFocus={() => {
          setEditing(true)
        }}
        onBlur={reset}
        onInput={(event) => {
          setValue(event.currentTarget.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            props.onCommit(value())
            reset()
          } else if (event.key === 'Escape') {
            reset()
          }
        }}
      />
    </Boxed>
  )
}

export default CellInput
