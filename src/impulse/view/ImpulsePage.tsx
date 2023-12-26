import { Component } from 'solid-js'
import { Grid } from 'solid-surfaces/components/Grid'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'

import TickMark from './TickMark'
import TimeBar from './TimeBar'

const ImpulsePage: Component = () => {
  const now = new Date()
  const second = (now.getSeconds() + 1) % 60
  const minute = ((now.getMinutes() + 1) % 60) + second / 60
  const hour = ((now.getHours() + 1) % 24) + minute / 60 + second / 3600

  return (
    <>
      <Grid full>
        <Tagged bottomLeft>
          <ContrastHeader>Impulse</ContrastHeader>
        </Tagged>
      </Grid>
      <Grid full>
        <TimeBar cycleTime={86400} unitCount={24} cycleInitialProgress={hour / 24} />
        <TimeBar cycleTime={3600} unitCount={60} cycleInitialProgress={minute / 60} />
        <TimeBar cycleTime={60} unitCount={60} cycleInitialProgress={second / 60} />
        <TickMark />
      </Grid>
    </>
  )
}

export default ImpulsePage
