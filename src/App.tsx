import { Component } from 'solid-js'
import { LayoutGrid, Grid } from 'solid-surfaces/components/Grid'
import Main from 'solid-surfaces/components/Main'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

import './App.sass'
import styles from './root.module.sass'

import RootMatrix from './RootMatrix'
import Input from 'solid-surfaces/components/Input'

const App: Component = () => (
  <Main>
    <LayoutGrid>
      <Grid full class={styles['main-header']}>
        <Tagged bottom>
          <ContrastHeader>Root Matrix</ContrastHeader>
        </Tagged>
      </Grid>
      <Grid full>
        <Input type="text" label="Insert new matrix" placeholder="Matrix name" />
      </Grid>
      <Grid full>
        <RootMatrix />
      </Grid>
    </LayoutGrid>
  </Main>
)

export default App
