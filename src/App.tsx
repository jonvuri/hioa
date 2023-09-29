import { Component, createResource } from 'solid-js'
import { LayoutGrid, Grid } from 'solid-surfaces/components/Grid'
import Main from 'solid-surfaces/components/Main'
import { ContrastHeader } from 'solid-surfaces/components/typo/Header'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import 'surface-fonts/index.css'

import { ExecResults } from './db/client'
import RootMatrix from './matrix/view/RootMatrix'
import { initialize } from './matrix/harmonizer'

import './App.sass'
import styles from './root.module.sass'

const App: Component = () => {
  const [initialized] = createResource<ExecResults>(initialize)

  return (
    <Main>
      <LayoutGrid class={styles['app-container']} row_template="auto 1fr">
        {initialized.loading ? (
          <div>[ init .. ]</div>
        ) : initialized.error ? (
          <div>[ init failed: ] {initialized.error.message}</div>
        ) : (
          <>
            <Grid full class={styles['main-header']}>
              <Tagged bottom>
                <ContrastHeader>Root Matrix</ContrastHeader>
              </Tagged>
            </Grid>
            <RootMatrix />
          </>
        )}
      </LayoutGrid>
    </Main>
  )
}

export default App
