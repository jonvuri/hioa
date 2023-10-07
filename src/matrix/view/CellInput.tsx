import { createSignal, onMount } from 'solid-js'
import Input from 'solid-surfaces/components/Input'

type CellInputProps = {
  value: string
  onCommit: (value: string) => void
  onClose: () => void
}

const CellInput = (props: CellInputProps) => {
  const [value, setValue] = createSignal(props.value)

  let inputRef: HTMLInputElement | undefined

  onMount(() => {
    inputRef?.focus()
  })

  return (
    <Input
      ref={inputRef}
      value={value()}
      onInput={(event) => {
        setValue(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          props.onCommit(value())
          props.onClose()
        } else if (event.key === 'Escape') {
          props.onClose()
        }
      }}
    />
  )
}

export default CellInput
