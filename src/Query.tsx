import { Component, createSignal } from 'solid-js'
import { Grid } from 'solid-surfaces/components/Grid'
import { Subheader } from 'solid-surfaces/components/typo/Header'
import Input from 'solid-surfaces/components/Input'
import Tagged from 'solid-surfaces/components/stellation/Tagged'
import 'surface-fonts/index.css'

import { execSql } from './db/client'

const Query: Component = () => {
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
    <>
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
  )
}

export default Query
