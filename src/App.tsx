import { Component, createResource } from 'solid-js'
import { LayoutGrid } from 'solid-surfaces/components/Grid'
import Main from 'solid-surfaces/components/Main'
import 'surface-fonts/index.css'

import { ExecResults } from './db/client'
import { initialize } from './cell/harmonizer'

import './global.sass'
import styles from './App.module.sass'
import Router from './Router'

const App: Component = () => {
  const [initialized] = createResource<ExecResults>(initialize)

  return (
    <Main>
      <LayoutGrid
        containerClassList={{ [styles['app-grid-container']]: true }}
        gridClassList={{ [styles['app-grid']]: true }}
        row_template="auto 1fr"
      >
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
