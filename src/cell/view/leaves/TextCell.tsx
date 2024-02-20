import { Component, onMount } from 'solid-js'

import Input from 'solid-surfaces/components/Input'

import { updateCellDefinition } from '../../harmonizer'
import { TextCell as TextCellType } from '../../types'

type TextCellProps = {
  cell: TextCellType
}

const TextCell: Component<TextCellProps> = (props) => {
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

export default TextCell
