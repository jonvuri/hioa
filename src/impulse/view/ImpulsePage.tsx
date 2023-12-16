import { Component } from 'solid-js'
import { Grid } from 'solid-surfaces/components/Grid'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'

import TickMark from './TickMark'
import TimeBar from './TimeBar'

const ImpulsePage: Component = () => {
  return (
    <>
      <Grid full>
        <Tagged bottomLeft>
          <ContrastHeader>Impulse</ContrastHeader>
        </Tagged>
      </Grid>
      <Grid full>
        <>
          <TimeBar cycleTime={3600} unitCount={60} cycleInitialProgress={0.4} />
          <TimeBar cycleTime={60} unitCount={60} />
          <TickMark />
        </>
      </Grid>
    </>
  )
}

export default ImpulsePage
