// mark merge

import { Component } from 'solid-js'
import { createCodeMirror } from 'solid-codemirror'
import { EditorView } from '@codemirror/view'

import { updateCellDefinition } from '../../harmonizer'
import { TextCell as TextCellType } from '../../types'

import timeMarkExtension from './time_mark_extension'

const myDarkTheme = EditorView.theme(
  {
    '&': {
      color: 'white',
      backgroundColor: 'transparent',
    },
    '& .cm-scroller': {
      overflow: 'visible',
    },
    '.cm-content': {
      caretColor: '#ffffff',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#ffffff',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#3c3c3c',
    },
  },
  { dark: true },
)

type TextCellProps = {
  cell: TextCellType
}

const TextCell: Component<TextCellProps> = (props) => {
  // TODO: Refactor to deal with reactivity warning
  // https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/reactivity.md
  const { ref: editorRef, createExtension } = createCodeMirror({
    value: props.cell.definition.text,
    onValueChange: (value) => {
      const definition = {
        ...props.cell.definition,
        text: value,
      }
      updateCellDefinition(props.cell.id, definition)
    },
  })

  createExtension(myDarkTheme)
  createExtension(
    timeMarkExtension((timeMark) => {
      console.log('time mark: ', timeMark)
    }),
  )

  return <div ref={editorRef} />
}

export default TextCell
