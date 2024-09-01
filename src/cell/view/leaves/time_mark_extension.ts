// TODO:
// - Doesn't work at index 0 in the document
// - Add replacement decoration for added time marks

import { parse } from 'chrono-node'
import {
  EditorState,
  StateEffect,
  StateField,
  Transaction,
  TransactionSpec,
} from '@codemirror/state'
import {
  EditorView,
  Decoration,
  WidgetType,
  DecorationSet,
  keymap,
} from '@codemirror/view'

import styles from './TextCell.module.sass'

type TimeMark = {
  referenceDate: Date
  startDate: Date
  endDate: Date | null
}

const timeMarkExtension = (onAddTimeMark: (timeMark: TimeMark) => void) => {
  const timeMarkDecoration = Decoration.mark({
    class: styles['hioa-time-mark'],
    inclusiveEnd: true,
    markId: 'time-mark',
  })

  class DialogWidget extends WidgetType {
    pos: number
    str: string

    constructor(pos: number, str: string = '') {
      super()
      this.pos = pos
      this.str = str
    }

    toDOM() {
      const chronoResult = parse(this.str)?.[0]

      if (chronoResult) {
        timeMark = {
          referenceDate: chronoResult.refDate,
          startDate: chronoResult.start.date(),
          endDate: chronoResult.end?.date() || null,
        }

        const dialog = document.createElement('div')

        dialog.className = styles['custom-dialog']
        dialog.innerHTML = `
          <div>Reference: ${timeMark.referenceDate}</div>
          <div>Start: ${timeMark.startDate}</div>
          <div>End: ${timeMark.endDate}</div>
        `

        return dialog
      } else {
        const dialog = document.createElement('div')

        dialog.className = styles['custom-dialog']
        dialog.innerHTML = `
          <div>nil</div>
        `

        return dialog
      }
    }
  }

  // with active time mark (initiated from @ input):
  //  on update, check if new input follows and is contiguous with existing time mark
  //  if so, update time mark with new input integrated
  // on esc or input elsewhere:
  //  cancel time mark

  let timeMarkRange: [number, number] | null = null
  let timeMarkStr: string = ''
  let timeMark: TimeMark | null = null

  const addToTimeMark = StateEffect.define<{ from: number; to: number; text: string }>()

  const updateTimeMark = StateEffect.define<{
    fromA: number
    toA: number
    fromB: number
    toB: number
    text: string
  }>()

  const destroyTimeMark = StateEffect.define()

  const timeMarkField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none
    },
    update(timeMarkSet, tr) {
      timeMarkSet = Decoration.none

      for (const e of tr.effects) {
        if (e.is(addToTimeMark)) {
          // The single '@' character
          const from = e.value.from
          const to = e.value.to

          const dialogWidget = Decoration.widget({
            widget: new DialogWidget(from),
            side: 1,
          }).range(from)

          timeMarkRange = [from, to]
          timeMarkSet = timeMarkSet.update({
            add: [dialogWidget, timeMarkDecoration.range(from, to)],
          })
        } else if (e.is(updateTimeMark)) {
          const { fromA, toA, fromB, toB, text } = e.value

          // Current range
          const markFrom = timeMarkRange?.[0]
          const markTo = timeMarkRange?.[1]

          // Whether the change range is fully contained with the current range
          const contained =
            typeof markFrom === 'number' &&
            typeof markTo === 'number' &&
            fromA > markFrom &&
            toA <= markTo

          const aDelta = toA - fromA
          const bDelta = toB - fromB

          const lengthChange = bDelta - aDelta

          if (contained) {
            // Handle negative / backspace
            timeMarkRange = [markFrom, markTo + lengthChange]
            timeMarkStr =
              timeMarkStr.slice(0, fromA - markFrom - 1) +
              text +
              timeMarkStr.slice(toA - markFrom - 1)

            const dialogWidget = Decoration.widget({
              widget: new DialogWidget(markFrom, timeMarkStr),
              side: 1,
            }).range(markFrom)

            timeMarkSet = timeMarkSet.update({
              add: [
                dialogWidget,
                timeMarkDecoration.range(timeMarkRange[0], timeMarkRange[1]),
              ],
            })
          } else {
            timeMarkSet = Decoration.none
          }
        } else if (e.is(destroyTimeMark)) {
          timeMarkSet = Decoration.none
        }
      }

      // Time mark resetting due to non-contiguous input or clicking elsewhere
      // Reset time mark state too
      if (timeMarkSet.size === 0) {
        timeMarkRange = null
        timeMarkStr = ''
        timeMark = null
      }

      return timeMarkSet
    },
    provide: (f) => EditorView.decorations.from(f),
  })

  const handleAtKey = EditorState.transactionFilter.of((tr: Transaction) => {
    let transactions: TransactionSpec | readonly TransactionSpec[] = tr
    if (tr.docChanged) {
      tr.changes.iterChanges((fromA, toA, fromB, toB, text) => {
        if (timeMarkRange) {
          // if time mark exists, then just fire off an update
          // effect for it to decide to merge or destroy
          transactions = [
            tr,
            {
              effects: updateTimeMark.of({
                fromA,
                toA,
                fromB,
                toB,
                text: text.toString(),
              }),
            },
          ]
        } else if (
          text.sliceString(0, 1) === '@' &&
          tr.newDoc.sliceString(fromA - 1, fromA).match(/\W/)
        ) {
          // @ symbol typed with no preceding word character
          // start up a new time mark
          transactions = [
            tr,
            {
              effects: addToTimeMark.of({ from: fromB, to: toB, text: text.toString() }),
            },
          ]
        }
      })
    }
    return transactions
  })

  const enterKeyBinding = keymap.of([
    {
      key: 'Enter',
      run: (view) => {
        if (timeMark) {
          onAddTimeMark(timeMark)
          view.dispatch({ effects: destroyTimeMark.of(null) })
          return true
        } else {
          return false
        }
      },
    },
  ])

  const escapeKeyBinding = keymap.of([
    {
      key: 'Escape',
      run: (view) => {
        if (timeMark) {
          view.dispatch({ effects: destroyTimeMark.of(null) })
          return true
        } else {
          return false
        }
      },
    },
  ])

  return [timeMarkField, handleAtKey, enterKeyBinding, escapeKeyBinding]
}

export default timeMarkExtension
