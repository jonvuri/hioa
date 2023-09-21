import { Component, createResource, createSignal } from 'solid-js'
import { LayoutGrid, Grid } from 'solid-surfaces/components/Grid'
import Main from 'solid-surfaces/components/Main'
import { ContrastHeader, Subheader } from 'solid-surfaces/components/typo/Header'
import Input from 'solid-surfaces/components/Input'
import Tagged from 'solid-surfaces/components/stellation/Tagged'

import { execSql, ExecResults } from './db/client'
import RootMatrix from './matrix/view/RootMatrix'
import { initialize } from './matrix/harmonizer'

import './App.sass'
import styles from './root.module.sass'

const App: Component = () => {
  const [initialized] = createResource<ExecResults>(initialize)

  const [query, setQuery] = createSignal('')
  const [queryResults, setQueryResults] = createSignal('')

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setQuery(target.value)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      execSql(query()).then((res) => {
        const results = Array.isArray(res)
          ? res.map((val) => JSON.stringify(val)).join('\n')
          : JSON.stringify(res)
        setQueryResults(results)
      })
    }
  }

  return (
    <Main>
      <LayoutGrid>
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
            <Grid full></Grid>
            <Grid full>
              <RootMatrix />
            </Grid>
            <Grid
              full
              style={{
                'margin-top': '2rem',
              }}
            >
              <Tagged>
                <Input
                  type="text"
                  label="run query"
                  placeholder="query"
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                />
              </Tagged>
            </Grid>
            <Grid full>
              <Subheader>Query results</Subheader>
              <div>{queryResults()}</div>
            </Grid>
          </>
        )}
      </LayoutGrid>
    </Main>
  )
}

export default App
