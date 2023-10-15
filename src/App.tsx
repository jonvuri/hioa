import { Component, createResource } from 'solid-js'
import { LayoutGrid } from 'solid-surfaces/components/Grid'
import Main from 'solid-surfaces/components/Main'
import 'surface-fonts/index.css'

import { ExecResults } from './db/client'
import { initialize } from './matrix/harmonizer'

import './App.sass'
import styles from './root.module.sass'
import Router from './Router'

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
          <Router />
        )}
      </LayoutGrid>
    </Main>
  )
}

export default App
