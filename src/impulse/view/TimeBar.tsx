import { Component, For, createMemo } from 'solid-js'

import styles from './TimeBar.module.sass'

type TimeBarProps = {
  cycleTime: number // Cycle time in seconds (e.g. 3600 for 1 hour)
  unitCount: number // Number of units in a cycle (e.g. 60 minutes for 1 hour)
  cycleInitialProgress?: number // Percentage from 0.0-1.0
  unitWidth?: number // Width of each unit in pixels
}

const TimeBar: Component<TimeBarProps> = (props) => {
  const unitList = createMemo(() =>
    [...Array(props.unitCount * 3)].map((_, i) => i % props.unitCount),
  )

  // starts at 59
  return (
    <div
      class={styles['container']}
      style={{
        '--cycle-time': `${props.cycleTime}s`,
        '--unit-count': props.unitCount,
        '--unit-width': props.unitWidth || '48px',
      }}
    >
      <div
        class={styles['bar']}
        style={{
          'animation-delay': `-${props.cycleTime * (props.cycleInitialProgress || 0)}s`,
        }}
      >
        <For each={unitList()}>{(unit) => <div class={styles['unit']}>{unit}</div>}</For>
      </div>
    </div>
  )
}

export default TimeBar
